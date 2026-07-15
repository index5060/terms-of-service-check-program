'use server';

import { supabase } from '@/utils/supabase';

// DCAT API로부터 반환받을 데이터셋 분포(URL 정보) 구조 타입 정의
interface DcatDistribution {
  identifier: string;
  accessURL: string;
  title: string;
  issued: string;
}

interface DcatRawItem {
  caseNo?: string;
  caseNm?: string;
  decisionDe?: string;
  url?: string;
  decisionContsUrl?: string;
  id?: string;
  title?: string;
}

/**
 * 공공데이터포털 DCAT API와 연동하여 신규 지침 및 심결례 API URL을 감지하고 DB에 등록하는 함수
 */
export async function syncDcatAndDetectNewUrl() {
  try {
    const apiKey = process.env.PUBLIC_DATA_API_KEY;
    
    // 만약 플레이스홀더 상태이거나 아예 비어있으면 목업(Mock) 데이터 경고를 반환하여 데모가 작동하도록 함
    if (!apiKey || apiKey === 'your-public-data-api-key-here') {
      console.warn("PUBLIC_DATA_API_KEY가 비어있거나 플레이스홀더 상태입니다. 모의(Mock) 경고 데이터를 반환합니다.");
      return {
        success: true,
        newUrlsCount: 2,
        warnings: [
          {
            title: "[모의 테스트] 2026년 개인정보 유출 방지 및 위반 심결 처리 지침 v3.1",
            url: "https://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList-v3.1",
            reason: "데이터베이스에 등록되지 않은 신규 API 엔드포인트 URL이 DCAT 카탈로그 수집 중에 발견되었습니다."
          },
          {
            title: "[모의 테스트] 공정위 불공정 가맹거래 계약 시정 가이드 API v1.2",
            url: "https://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList-v1.2",
            reason: "검증되지 않은 신규 가맹계약 독소조항 탐지 표준약관 API URL이 수집되었습니다."
          }
        ]
      };
    }

    // 1. 공공데이터포털 DCAT API 호출 (JSON 포맷 요구)
    // 공정거래위원회 심결서 목록 조회 Open API를 기본 타겟으로 설정합니다.
    const url = `http://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList?serviceKey=${encodeURIComponent(apiKey)}&resultType=json&numOfRows=10&pageNo=1`;

    const res = await fetch(url, {
      next: { revalidate: 1800 } // 30분 캐싱
    });

    if (!res.ok) {
      throw new Error(`공공데이터 API 서버 응답 오류: 상태 코드 ${res.status}`);
    }

    const data = await res.json();
    const rawItems = (data.response?.body?.items?.item || []) as DcatRawItem[];

    // 2. 응답 데이터에서 API URL 정보(accessURL)와 메타데이터 추출
    const detectedDistributions: DcatDistribution[] = rawItems.map((item: DcatRawItem, idx: number) => {
      // 심결 내용 조회가 가능한 공문서 다운로드 URL 혹은 상세 URL을 accessURL로 매핑합니다.
      // (각 사건별 심결 정보 조회용 고유 엔드포인트 생성)
      const mockAccessUrl = `https://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoDetail?serviceKey=API_KEY&caseNo=${item.caseNo || ''}`;
      return {
        identifier: item.caseNo || `ftc-case-${idx}`,
        accessURL: mockAccessUrl,
        title: item.caseNm || `공정위 불공정 약관 심결 - ${item.caseNo || idx}`,
        issued: item.decisionDe || new Date().toISOString()
      };
    });

    const newUrlWarnings = [];

    // 3. 루프를 돌며 DB에 등록되지 않은 신규 API URL 감시 및 적재
    for (const dist of detectedDistributions) {
      if (!dist.accessURL) continue;

      // DB에 이미 존재하는 source_url인지 확인 (API Key 노출되지 않은 base 형태로 체크)
      const cleanUrl = dist.accessURL.replace(/serviceKey=[^&]*/, 'serviceKey=KEY');
      
      const { data: existingGuideline, error } = await supabase
        .from('government_guidelines')
        .select('id')
        .eq('source_url', cleanUrl)
        .maybeSingle();

      if (error) {
        console.error("DB 조회 오류 (guideline 검색):", error.message);
        continue;
      }

      // 존재하지 않는 새로운 URL이라면 경고 목록에 추가하고 DB에 자동 적재
      if (!existingGuideline) {
        newUrlWarnings.push({
          title: dist.title,
          url: cleanUrl,
          reason: "데이터베이스 검증에 등록되지 않은 공정위 심결례 신규 API Endpoint가 DCAT 동기화 중 감지되었습니다."
        });

        // PGVector 임베딩을 제외한 기본 데이터 적재 (추후 백그라운드 스케줄러로 벡터 적재 유도)
        await supabase
          .from('government_guidelines')
          .insert([
            {
              agency: 'KFTC',
              category: '심결례',
              title: `[신규 감지] ${dist.title}`,
              content: `${dist.title} 사건 관련 불공정 약관 심결 정보입니다. 사건번호: ${dist.identifier}`,
              source_url: cleanUrl,
              metadata: {
                dcat_identifier: dist.identifier,
                is_unverified: true,
                detected_at: new Date().toISOString(),
                decision_date: dist.issued
              }
            }
          ]);
      }
    }

    return {
      success: true,
      newUrlsCount: newUrlWarnings.length,
      warnings: newUrlWarnings
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("DCAT 동기화 에러:", errorMsg);
    return { 
      success: false, 
      error: errorMsg,
      // 오류 상황 시에도 테스트용 목업 경고 데이터를 반환하여 동작 여부를 브라우저 상에서 시뮬레이션할 수 있게 보완
      warnings: [
        {
          title: "[임시 경고] 2026년 개인정보 유출 방지 및 위반 심결 처리 지침 v3.1 (로컬 테스트)",
          url: "https://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList-v3.1",
          reason: "Supabase DB 연결이 구성되지 않았거나 API Key 오류로 로컬 가상 검증 데이터를 노출합니다."
        }
      ]
    };
  }
}
