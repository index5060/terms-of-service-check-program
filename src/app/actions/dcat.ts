'use server';

import { supabase } from '@/utils/supabase';

// DCAT API로부터 반환받을 데이터셋 분포(URL 정보) 구조 타입 정의
interface DcatDistribution {
  identifier: string;
  accessURL: string;
  title: string;
  issued: string;
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
            title: "[모의 테스트] KISA 인터넷진흥원 도메인 검증 정보",
            url: "https://apis.data.go.kr/B551505/whois/domain_name?serviceKey=KEY&query=kisa.or.kr",
            reason: "데이터베이스에 등록되지 않은 KISA 공식 도메인 WHOIS 정보가 수집 과정에서 감지되었습니다."
          },
          {
            title: "[모의 테스트] 공정거래위원회 도메인 검증 정보",
            url: "https://apis.data.go.kr/B551505/whois/domain_name?serviceKey=KEY&query=ftc.go.kr",
            reason: "검증되지 않은 KFTC 공식 도메인 WHOIS 정보가 수집되었습니다."
          }
        ]
      };
    }

    // 1. 공공데이터포털 WHOIS API 호출
    // 이미 인코딩된 서비스 키인 경우(% 문자 포함) 추가 인코딩을 하지 않고, 디코딩된 키일 때만 encodeURIComponent 처리
    const isAlreadyEncoded = apiKey.includes('%');
    const serviceKeyParam = isAlreadyEncoded ? apiKey : encodeURIComponent(apiKey);
    
    const targetDomains = [
      { domain: 'kisa.or.kr', agency: 'KISA', name: '한국인터넷진흥원' },
      { domain: 'ftc.go.kr', agency: 'KFTC', name: '공정거래위원회' },
      { domain: 'pipc.go.kr', agency: 'PIPC', name: '개인정보보호위원회' }
    ];

    const detectedDistributions: DcatDistribution[] = [];

    for (const target of targetDomains) {
      const url = `https://apis.data.go.kr/B551505/whois/domain_name?serviceKey=${serviceKeyParam}&query=${target.domain}&answer=json`;
      
      const res = await fetch(url, {
        next: { revalidate: 1800 } // 30분 캐싱
      });

      if (!res.ok) {
        throw new Error(`공공데이터 API 서버 응답 오류 (도메인: ${target.domain}): 상태 코드 ${res.status}`);
      }

      // 공공데이터포털은 API 인증 오류 시 XML 형식으로 에러를 뱉는 특성이 있음
      const responseText = await res.text();
      if (responseText.includes('<OpenAPI_ServiceResponse>') || responseText.includes('<errMsg>')) {
        const errCodeMatch = responseText.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/);
        const errMsgMatch = responseText.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
        const code = errCodeMatch ? errCodeMatch[1] : '인증 실패';
        const msg = errMsgMatch ? errMsgMatch[1] : '승인되지 않은 인증키이거나 호출 권한이 없습니다.';
        throw new Error(`공공 API 인증 에러 (${code}): ${msg}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr: unknown) {
        const parseErrMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`WHOIS API JSON 파싱 오류: ${parseErrMsg}`);
      }

      const whoisData = data.response?.whois?.krdomain;
      if (whoisData) {
        detectedDistributions.push({
          identifier: `whois-${target.domain}`,
          accessURL: `https://apis.data.go.kr/B551505/whois/domain_name?serviceKey=KEY&query=${target.domain}`,
          title: `[WHOIS] ${whoisData.regName} (${whoisData.name})`,
          issued: whoisData.regDate || new Date().toISOString()
        });
      }
    }

    const newUrlWarnings = [];

    // 2. 루프를 돌며 DB에 등록되지 않은 신규 API URL 감시 및 적재
    for (const dist of detectedDistributions) {
      const cleanUrl = dist.accessURL;
      
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
        const isKisa = dist.title.includes('인터넷진흥원');
        const isFtc = dist.title.includes('공정거래');
        const agencyCode = isKisa ? 'KISA' : (isFtc ? 'KFTC' : 'PIPC');

        newUrlWarnings.push({
          title: dist.title,
          url: cleanUrl,
          reason: `보안 안전망 검증에 등록되지 않은 ${agencyCode} 공식 기관 도메인 주소가 실시간 WHOIS 조회를 통해 새로 감지되었습니다.`
        });

        await supabase
          .from('government_guidelines')
          .insert([
            {
              agency: agencyCode,
              category: '도메인정보',
              title: `[신규 감지] ${dist.title}`,
              content: `${dist.title} 도메인의 WHOIS 정보입니다. 등록일: ${dist.issued}`,
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
    console.error("WHOIS API 동기화 에러:", errorMsg);
    return { 
      success: false, 
      mode: 'ERROR' as const,
      error: errorMsg,
      warnings: [
        {
          title: "[임시 가상 데이터] KISA 인터넷진흥원 도메인 검증 정보",
          url: "https://apis.data.go.kr/B551505/whois/domain_name?serviceKey=KEY&query=kisa.or.kr",
          reason: `API 연동 중 오류 발생: ${errorMsg}`
        }
      ]
    };
  }
}
