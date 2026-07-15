'use server';

import { supabase } from '@/utils/supabase';

// LLM 분석 반환 데이터 인터페이스 정의
export interface LLMAnalysisResult {
  title: string;
  level: 'danger' | 'warning' | 'safe';
  description: string;
  fullClauseText: string;
  dangerSegment: string;
  aiAnalysisComment: string;
  remedyActionTip: string;
  impactScore: number;
}

// 공공 가이드라인 항목 타입 정의
interface GovGuidelineRow {
  agency: string;
  title: string;
  content: string;
}

// 오프라인/로컬 Fallback을 위한 기본 정책 규제 지침 데이터셋 (RAG 소스)
const LOCAL_GOV_GUIDELINES = `
[개인정보보호위원회 (PIPC) 지침]
- 최소 수집의 원칙: 서비스 제공을 위해 필요한 최소한의 개인정보만 필수 수집해야 하며, 무관한 정보(예: 결제 정보, 기기 주소록 등)는 필수 동의로 강제할 수 없다. 이를 위반 시 불법 약관으로 시정 조치 및 과징금이 부과된다.
- 국외 이전 규정: 사용자의 실명, 전화번호, 카드번호 등 민감 식별정보를 충분한 암호화 절차나 안전성 확보 조치 없이 중국 등 해외 제3자 서버로 이전/위탁하는 조항은 프라이버시 오남용 위험성이 극도로 높다.

[공정거래위원회 (KFTC) 표준]
- 일방적 관할 합의 금지: 사용자의 소송 제기 권리를 원천 차단하고 해외 법원이나 특정 분쟁기관을 유일한 관할 법원으로 지정하는 계약 조항은 고객에게 부당하게 불리하여 무효에 속한다.
- 일방적 서비스 변경 및 환불 불가: 디지털 콘텐츠 및 쇼핑 거래에서 어떠한 예외도 인정하지 않고 환불을 영구 거부하거나, 회사가 일방적으로 계약을 해지할 수 있도록 유도하는 조항은 대표적인 불공정 약관이다.

[한국인터넷진흥원 (KISA) 수칙]
- 기기 접근 권한 최소화: 모바일 앱 구동 시 서비스 성격과 무관하게 백그라운드 GPS 실시간 동선, 통화 목록, SMS 수집, 사진 갤러리 미디어에 대한 일괄 접근 및 상시 조회를 강제 취득하는 행위는 해킹 및 스미싱 2차 범죄 악용 소지가 큼으로 금지 대상이다.
`;

/**
 * Groq API를 사용하여 임의의 약관을 실시간 분석 및 팩트체크 요약하는 Server Action
 * (사용자가 환경변수 GEMINI_API_KEY에 입력한 Groq 키 'gsk_...'를 읽어 호출 처리)
 */
export async function analyzeTermWithLLM(clauseText: string): Promise<{ success: boolean; data?: LLMAnalysisResult; error?: string }> {
  try {
    // GROQ_API_KEY와 GEMINI_API_KEY 환경변수명 둘 다 지원하여 호환성 보장
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("환경변수(GROQ_API_KEY 또는 GEMINI_API_KEY)에 Groq API 키가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.");
    }

    if (!clauseText || clauseText.trim().length < 5) {
      throw new Error("분석할 약관 본문 내용을 최소 5자 이상 입력해 주세요.");
    }

    // 1. RAG 지침 컨텍스트 수집 시도
    let contextGuideline = LOCAL_GOV_GUIDELINES;

    try {
      // Supabase RLS 및 DB가 구성된 경우, 벡터 기반 지침 검색 시도
      const { data: searchResults, error: rpcError } = await supabase.rpc('match_guidelines', {
        query_embedding: null, // 임베딩 연동 전 단계에선 빈 값 처리하여 fallback 유도
        match_threshold: 0.5,
        match_count: 2
      });

      if (!rpcError && searchResults && searchResults.length > 0) {
        const rows = searchResults as unknown as GovGuidelineRow[];
        contextGuideline = rows.map((r) => `[${r.agency}] ${r.title}\n내용: ${r.content}`).join('\n\n');
      }
    } catch {
      console.log("Supabase DB 연결 실패 또는 match_guidelines RPC 미세팅으로 로컬 RAG 지침을 컨텍스트로 사용합니다.");
    }

    // 2. Groq API 호출 진행 (Llama-3.3-70b 고성능 한글 분석 모델 및 JSON 출력 적용)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }, // JSON 출력 강제 지정
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `당사는 개인정보보호위원회(PIPC), 공정거래위원회(KFTC), 한국인터넷진흥원(KISA)의 규제 표준에 근거한 모바일 약관 감시 요약 AI입니다.
전달받은 [정부 규제 정책 및 지침]을 바탕으로, 사용자가 입력한 [약관 본문]을 사실 관계에 입각하여 심도 있게 팩트체크 분석하십시오.

[정부 규제 정책 및 지침 (RAG Context)]
${contextGuideline}

[요구사항]
약관 본문에 이용자에게 불리한 독소조항, 과도한 개인정보 유출, 일방적 의무 부과, 혹은 기기 오남용 위험이 도사리고 있는지 철저히 분석하십시오.
반드시 아래 스키마를 만족하는 하나의 JSON 객체로만 응답하십시오.

[JSON Output Schema]
{
  "title": "감지된 핵심 위협 요약 제목 (예: 국외 개인식별정보 유출 위험, 일방적 환불 불가 등)",
  "level": "danger(매우 심각한 불법/침해), warning(일반적인 사생활 침해/스팸 유발), safe(안전하고 표준적인 조항) 중 택1",
  "description": "일반 사용자가 이해하기 쉬운 핵심 위협 요약 (최대한 친절한 문투로 2문장 내외)",
  "fullClauseText": "전달받은 약관 본문 전체를 그대로 기입",
  "dangerSegment": "약관 본문 중에서 가장 유해하거나 독소조항의 원인이 되는 문구 어구 (반드시 약관 본문에 존재하는 정확한 어구여야 함, 매칭이 어려우면 핵심 위구 기입)",
  "aiAnalysisComment": "위의 [정부 규제 정책 및 지침]의 구체적인 명칭(예: PIPC 최소수집 원칙, KISA 수칙 등)과 판결례를 근거로 대조하여, 이 약관 조항이 왜 법적으로 유해하고 불합리한지 설명하는 논리적인 해설 코멘트 (존댓말로 2-3문장)",
  "remedyActionTip": "이용자가 이 약관에 대처하기 위해 취할 수 있는 구체적인 행동 행동 방침 제안 (예: 선택 동의 해제, 가입 취소 등)",
  "impactScore": 15
}`
          },
          {
            role: "user",
            content: clauseText
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API 응답 에러 (상태 코드 ${response.status}): ${errorText}`);
    }

    const resData = await response.json();
    const responseText = resData.choices[0].message.content;
    const resultJson = JSON.parse(responseText) as LLMAnalysisResult;

    return {
      success: true,
      data: resultJson
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("LLM API 약관 분석 오류:", errorMsg);
    return {
      success: false,
      error: errorMsg
    };
  }
}
