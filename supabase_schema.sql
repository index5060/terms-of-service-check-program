-- =========================================================================
-- GuardTerms Supabase Database Schema DDL (v2 - RAG & Public API Integration)
-- =========================================================================

-- 1. 필수 확장 기능 활성화 (UUID 생성 및 PGVector 기능)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- Vector DB 기능 활성화 (1536 차원 호환)

-- 2. Scenarios (약관 평가 대상 서비스 정보)
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    emoji VARCHAR(50) NOT NULL,
    brand_color VARCHAR(50) NOT NULL,
    text_color VARCHAR(50) NOT NULL,
    base_score INTEGER NOT NULL DEFAULT 100,
    base_summary TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Terms (각 시나리오 하위의 개별 약관 조항)
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    description TEXT NOT NULL,
    impact_score INTEGER NOT NULL DEFAULT 0,
    detail_info TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Government Guidelines (정부 공공 규제 준거 데이터 - RAG 및 팩트체크용)
CREATE TABLE IF NOT EXISTS public.government_guidelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency VARCHAR(50) NOT NULL, -- 'PIPC', 'KFTC', 'KISA'
    category VARCHAR(100) NOT NULL, -- '평가기준', '심결례', '표준약관', '보고서'
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(1000),
    embedding vector(1536), -- 1536 차원의 임베딩 값 (OpenAI / Gemini)
    metadata JSONB DEFAULT '{}'::JSONB, -- 관련 법조항, 시행일 등 추가 메타
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Risk Factors (약관에 내포된 독소 조항 / 위험 요소)
CREATE TABLE IF NOT EXISTS public.risk_factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('danger', 'warning', 'safe')),
    related_term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE NOT NULL,
    resolved_message TEXT NOT NULL,
    full_clause_text TEXT NOT NULL,
    danger_segment TEXT NOT NULL,
    ai_analysis_comment TEXT NOT NULL,
    remedy_action_tip TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Risk Factor Evidences (독소 조항과 그것을 입증하는 정부 가이드라인 간의 다대다 매핑)
CREATE TABLE IF NOT EXISTS public.risk_factor_evidences (
    risk_factor_id UUID REFERENCES public.risk_factors(id) ON DELETE CASCADE,
    guideline_id UUID REFERENCES public.government_guidelines(id) ON DELETE CASCADE,
    PRIMARY KEY (risk_factor_id, guideline_id)
);

-- 7. Collection Items (실시간 수집되는 개인정보 항목)
CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    type VARCHAR(100) NOT NULL,
    related_term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Simulations (사용자 시뮬레이션 이력 저장)
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Supabase Auth 연동용
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
    agreed_term_ids JSONB NOT NULL DEFAULT '{}'::JSONB, -- {"term-id-1": true, "term-id-2": false}
    final_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. 성능 최적화용 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_terms_scenario_id ON public.terms(scenario_id);
CREATE INDEX IF NOT EXISTS idx_risk_factors_scenario_id ON public.risk_factors(scenario_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_scenario_id ON public.collection_items(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_guidelines_agency ON public.government_guidelines(agency);
CREATE INDEX IF NOT EXISTS idx_guidelines_category ON public.government_guidelines(category);

-- HNSW 인덱스를 사용한 벡터 코사인 유사도 검색 최적화 (PGVector 확장 기능)
CREATE INDEX IF NOT EXISTS hnsw_guidelines_embedding ON public.government_guidelines USING hnsw (embedding vector_cosine_ops);

-- =========================================================================
-- 10. RPC 함수: match_guidelines (벡터 유사도 검색 쿼리용 저장 프로시저)
-- =========================================================================
CREATE OR REPLACE FUNCTION match_guidelines (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_agency varchar default null
)
RETURNS TABLE (
  id uuid,
  agency varchar,
  category varchar,
  title varchar,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    guidelines.id,
    guidelines.agency,
    guidelines.category,
    guidelines.title,
    guidelines.content,
    1 - (guidelines.embedding <=> query_embedding) AS similarity
  FROM government_guidelines AS guidelines
  WHERE 
    (1 - (guidelines.embedding <=> query_embedding) > match_threshold)
    AND (filter_agency IS NULL OR guidelines.agency = filter_agency)
  ORDER BY guidelines.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- =========================================================================
-- 11. RLS (Row Level Security) 설정 및 기본 보안 정책 정의
-- =========================================================================
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factor_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- 11.1 공개 읽기 가능 정책 (Public Read-Only)
CREATE POLICY "Allow public select for scenarios" ON public.scenarios FOR SELECT USING (true);
CREATE POLICY "Allow public select for terms" ON public.terms FOR SELECT USING (true);
CREATE POLICY "Allow public select for government_guidelines" ON public.government_guidelines FOR SELECT USING (true);
CREATE POLICY "Allow public select for risk_factors" ON public.risk_factors FOR SELECT USING (true);
CREATE POLICY "Allow public select for risk_factor_evidences" ON public.risk_factor_evidences FOR SELECT USING (true);
CREATE POLICY "Allow public select for collection_items" ON public.collection_items FOR SELECT USING (true);

-- 11.2 시뮬레이션 이력 보안 정책 (본인 것만 읽기/작성 가능, 비회원 가입은 insert 허용)
CREATE POLICY "Allow users to read their own simulations" ON public.simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own simulations" ON public.simulations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow anonymous insertions for simulations" ON public.simulations FOR INSERT WITH CHECK (auth.role() = 'anon');
