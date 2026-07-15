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
        mode: 'MOCK' as const,
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

    // 1. 공공데이터포털 DCAT API 호출
    const url = `http://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList?serviceKey=${encodeURIComponent(apiKey)}&resultType=json&numOfRows=10&pageNo=1`;

    const res = await fetch(url, {
      next: { revalidate: 1800 } // 30분 캐싱
    });

    if (!res.ok) {
      throw new Error(`공공데이터 API 서버 응답 오류: 상태 코드 ${res.status}`);
    }

    // 공공데이터포털은 API 인증 오류 시 XML 형식으로 에러를 뱉는 특성이 있음
    const responseText = await res.text();
    if (responseText.includes('<OpenAPI_ServiceResponse>') || responseText.includes('<errMsg>')) {
      // 에러 메시지 내용 파싱 시도
      const errCodeMatch = responseText.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/);
      const errMsgMatch = responseText.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
      const code = errCodeMatch ? errCodeMatch[1] : '인증 실패';
      const msg = errMsgMatch ? errMsgMatch[1] : '승인되지 않은 인증키이거나 호출 권한이 없습니다.';
      throw new Error(`공공 API 인증 에러 (${code}): ${msg}`);
    }

    const data = JSON.parse(responseText);
    const rawItems = (data.response?.body?.items?.item || []) as DcatRawItem[];

    // 2. 응답 데이터에서 API URL 정보(accessURL)와 메타데이터 추출
    const detectedDistributions: DcatDistribution[] = rawItems.map((item: DcatRawItem, idx: number) => {
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

      if (!existingGuideline) {
        newUrlWarnings.push({
          title: dist.title,
          url: cleanUrl,
          reason: "데이터베이스 검증에 등록되지 않은 공정위 심결례 신규 API Endpoint가 DCAT 동기화 중 감지되었습니다."
        });

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
      mode: 'REAL' as const,
      newUrlsCount: newUrlWarnings.length,
      warnings: newUrlWarnings
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("DCAT 동기화 에러:", errorMsg);
    return { 
      success: false, 
      mode: 'ERROR' as const,
      error: errorMsg,
      warnings: [
        {
          title: "[임시 가상 데이터] 2026년 개인정보 유출 방지 및 위반 심결 처리 지침 v3.1",
          url: "https://apis.data.go.kr/1130000/FtcDecsnInfoService/getFtcDecsnInfoList-v3.1",
          reason: `API 연동 중 오류 발생: ${errorMsg}`
        }
      ]
    };
  }
}
