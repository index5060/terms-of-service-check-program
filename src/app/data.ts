export interface Term {
  id: string;
  title: string;
  required: boolean;
  description: string;
  impactScore: number; // 동의 해제 시 감점되는 위험 점수
  detailInfo: string;
}

export interface RiskFactor {
  id: string;
  title: string;
  description: string;
  level: "danger" | "warning" | "safe";
  relatedTermId: string; // 이 위험이 해결되기 위해 해제해야 하는 선택 약관 ID
  resolvedMessage?: string; // 해제되었을 때 보여줄 안전 메시지
  
  // [상세 분석용 신규 필드]
  fullClauseText: string;     // 독소 조항이 포함된 실제 약관 법적 원문
  dangerSegment: string;      // 원문 내에서 형광펜으로 강조할 어구
  aiAnalysisComment: string;  // 해당 조항이 위험한 상세 보안 설명
  remedyActionTip: string;    // 사용자 대처 요령 가이드
}

export interface CollectionItem {
  name: string;
  required: boolean;
  type: string;
  relatedTermId?: string; // 이 정보 수집의 원인이 되는 약관 ID
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  emoji: string;
  brandColor: string; // 브랜드 대표 색상 (예: #E60012, #3182F6 등)
  textColor: string; // 브랜드 헤더의 글자 색상 (white 또는 black)
  baseScore: number; // 전체 동의 시 기본 위험 점수
  terms: Term[];
  riskFactors: RiskFactor[];
  baseSummary: string[];
  collectionItems: CollectionItem[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "okcashbag",
    title: "OK CASHBAG",
    category: "국내 최대 통합 마일리지 서비스",
    emoji: "💰",
    brandColor: "#E60012", // 레드
    textColor: "text-white",
    baseScore: 98, // 위험 (Red)
    terms: [
      {
        id: "ok-req-use",
        title: "[필수] OK캐쉬백 회원/카드 서비스 이용약관",
        required: true,
        description: "회원 가입 및 모바일 카드 발급, 마일리지 적립/사용을 위한 필수 이용약관입니다.",
        impactScore: 0,
        detailInfo: "본 약관은 회원이 SK플래닛(주)이 제공하는 OK캐쉬백 서비스를 이용함에 있어 회원과 회사 간의 권리, 의무 및 책임 사항을 규정합니다."
      },
      {
        id: "ok-req-privacy",
        title: "[필수] 개인정보 수집 및 활용 동의",
        required: true,
        description: "이름, 전화번호, 생년월일 등 서비스 본인 확인 및 계정 생성을 위한 수집 동의입니다.",
        impactScore: 0,
        detailInfo: "회사는 서비스 제공을 위해 최소한의 개인식별정보(이름, 휴대폰번호, 생년월일, 성별, CI/DI 고유값)를 필수적으로 수집 및 이용합니다."
      },
      {
        id: "ok-opt-thirdparty-m",
        title: "[선택] 상품추천서비스 제공 목적 제3자 제공 (SK m&service)",
        required: false,
        description: "맞춤 쇼핑 딜 추천 및 제휴 프로모션 연계를 위해 개인정보를 제공합니다.",
        impactScore: 18,
        detailInfo: "개인정보를 제공받는 자: SK엠앤서비스(주). 제공 목적: 제휴 서비스 마케팅 및 맞춤형 상품 정보 전송. 제공 항목: 이름, 성별, 연령대, 마일리지 보유 현황."
      },
      {
        id: "ok-opt-thirdparty-comm",
        title: "[선택] 개인정보 제3자 제공 동의 (SK플래닛 -> (주)커뮤니어스)",
        required: false,
        description: "광고주 대행 맞춤 타겟 이벤트 및 마일리지 부가 혜택 연동을 위해 정보를 제공합니다.",
        impactScore: 12,
        detailInfo: "개인정보를 제공받는 자: (주)커뮤니어스. 제공 목적: 맞춤 마케팅 광고 전송 대행 및 리워드 광고 연결. 제공 항목: 휴대폰번호, 앱 푸시 토큰, 기기식별값(ADID)."
      },
      {
        id: "ok-opt-benefit",
        title: "[선택] OK캐쉬백 혜택수신 및 알림 SMS 수신 동의",
        required: false,
        description: "다양한 제휴 가맹점 특가 쿠폰 정보 및 마케팅 SMS/이메일 알림을 수신합니다.",
        impactScore: 15,
        detailInfo: "회사는 회원이 동의한 범위 내에서 제휴사 할인 이벤트, 마일리지 추가 적립 딜, 금융 제휴 상품 소개 등 광고성 정보를 SMS 및 앱 푸시로 24시간 동안 수시 발송할 수 있습니다."
      },
      {
        id: "ok-opt-thirdparty-ins",
        title: "[선택] 개인정보 제3자 제공 동의 (SK플래닛 -> DB손해보험, 신한라이프생명)",
        required: false,
        description: "제휴 보험사 무료 가입 이벤트 및 금융 상담 전화를 위한 정보 공유 동의입니다.",
        impactScore: 25,
        detailInfo: "제공받는 자: DB손해보험(주), 신한라이프생명보험(주). 제공 목적: 보험 상품 소개, 무료 안심 보험 가입 서비스 안내 및 마케팅 아웃바운드 텔레마케팅(TM) 전화 발송. 제공 항목: 이름, 전화번호, 생년월일, 주소."
      },
      {
        id: "ok-opt-reprovide",
        title: "[선택] 혜택 제공을 위한 제3자 재제공 동의 (SKT, ADT캡스, 11번가 등)",
        required: false,
        description: "다수 계열사 및 제휴 대기업 파트너사에게 통합 맞춤형 쇼핑 혜택 분석 목적으로 개인정보를 제공합니다.",
        impactScore: 28,
        detailInfo: "제공받는 자: SK텔레콤, SK브로드밴드, ADT캡스, 11번가, 드림어스컴퍼니 등 10개 제휴 파트너사. 제공 목적: 계열사 통합 연계 마케팅 분석 및 표적 서비스 권유. 제공 항목: 온/오프라인 가맹점 마일리지 적립 이력, 쇼핑 구매 품목."
      }
    ],
    riskFactors: [
      {
        id: "ok-risk-1",
        title: "보험 가입 권유 TM 전화 스팸 유발",
        description: "개인 정보가 제휴 금융사(보험사)로 이전되어 무료 안심 가입이라는 명목하에 매일 아웃바운드 보험 권유 전화를 유입시킬 수 있습니다.",
        level: "danger",
        relatedTermId: "ok-opt-thirdparty-ins",
        resolvedMessage: "보험사 제공 동의 거부로 원치 않는 텔레마케팅(TM) 보험 영업 전화를 원천 차단했습니다.",
        fullClauseText: "제14조 (제3자 금융 제공) 당사는 무료 안심 상해 보험 가입 및 부가 혜택 연계를 위해 사용자의 실명, 전화번호, 생년월일을 당사 제휴 보험사인 DB손해보험 및 신한라이프생명에 이전하며, 보험사는 이를 활용해 신규 보장성 상품 가입 권유 텔레마케팅 영업 및 아웃바운드 전화 상담 용도로 상시 사용할 수 있습니다.",
        dangerSegment: "보험사는 이를 활용해 신규 보장성 상품 가입 권유 텔레마케팅 영업 및 아웃바운드 전화 상담 용도로 상시 사용할 수 있습니다",
        aiAnalysisComment: "금융 제휴사에 이름과 전화번호가 넘어가 '무료 보험 제공'을 빌미로 귀찮은 가입 권유 전화(아웃바운드 TM) 폭탄에 시달리게 만드는 전형적인 독소 조항입니다.",
        remedyActionTip: "약관 동의 화면에서 '[선택] 개인정보 제3자 제공 동의 (SK플래닛 -> DB손해보험, 신한라이프생명)' 체크박스를 반드시 해제하고 가입해 주세요."
      },
      {
        id: "ok-risk-2",
        title: "다수 대기업/계열사 간 전방위 데이터 재제공",
        description: "가입자의 오프라인 가맹점 이용 이력, 적립 품목 등 매우 민감한 행동 데이터가 다수 대기업 파트너사에 연쇄 공유될 위험이 큽니다.",
        level: "danger",
        relatedTermId: "ok-opt-reprovide",
        resolvedMessage: "제3자 재제공 동의 해제로 대기업 연합체 내부의 개인 구매 프로필 연계 위험을 방지했습니다.",
        fullClauseText: "제19조 (행동 데이터 재제공) SK플래닛은 회원이 적립/사용한 가맹점명, 사용 시간, 구매 품목 내역 및 라이프스타일 정보를 SK텔레콤, 11번가, ADT캡스, 드림어스컴퍼니 등 10개 이상의 전 대기업 파트너 연맹에 공유 및 재제공하여, 각 회사의 마케팅 프로필 데이터와 결합한 맞춤 타겟 광고에 활용합니다.",
        dangerSegment: "10개 이상의 전 대기업 파트너 연맹에 공유 및 재제공하여, 각 회사의 마케팅 프로필 데이터와 결합한 맞춤 타겟 광고에 활용합니다",
        aiAnalysisComment: "내 소비 동선과 구매 브랜드가 대기업 그룹사와 쇼핑 파트너사 전방위로 퍼져 나가 '통합 개인 프로필'로 상업적 가공 및 악용될 위험이 매우 큽니다.",
        remedyActionTip: "가입 폼 하단부의 '[선택] 혜택 제공을 위한 제3자 재제공 동의'를 비활성화하시면 연합사 간의 개인정보 도용을 방지합니다."
      },
      {
        id: "ok-risk-3",
        title: "주기적인 타겟 쇼핑 스팸 SMS 폭탄",
        description: "하루 수차례에 걸쳐 광고 문자 및 마케팅 알림이 전송될 수 있어 사생활 환경을 훼손할 수 있습니다.",
        level: "warning",
        relatedTermId: "ok-opt-benefit",
        resolvedMessage: "혜택 문자 수신을 해제하여 일상 스팸 SMS를 예방했습니다.",
        fullClauseText: "제9조 (광고 발송 권한) 회사는 이벤트 수신 동의를 거친 회원에게 타겟 할인 딜 및 신규 모바일 카드 출시를 촉진하는 유료 SMS 및 이메일, 앱 푸시 마케팅 알림을 시간 제한 없이 실시간 전송할 수 있습니다.",
        dangerSegment: "이메일, 앱 푸시 마케팅 알림을 시간 제한 없이 실시간 전송할 수 있습니다",
        aiAnalysisComment: "수시로 쇼핑 권유 딜이나 혜택 유도 알림이 전송되어 휴대폰 알림 피로도를 급증시킬 수 있는 마케팅 조항입니다.",
        remedyActionTip: "'[선택] OK캐쉬백 혜택수신 및 알림 SMS 수신 동의'를 끄고 진행하시면 광고 문자가 오지 않습니다."
      }
    ],
    baseSummary: [
      "국내 최대의 제3자 제공 범위를 보유하고 있어 선택 약관 전체 동의 시 스팸 유발 가능성이 매우 높습니다.",
      "무료 가입 제휴 보험사를 통한 보험 강권 텔레마케팅 전화 유입 조항이 포함되어 있습니다.",
      "선택 항목을 3개 이상 해제할 시 위협도가 50점 이하의 '주의' 수준으로 낮아져 마일리지 적립 본연의 기능만 안전하게 쓸 수 있습니다."
    ],
    collectionItems: [
      { name: "이름, 생년월일, 성별, 휴대폰 번호", required: true, type: "본인인증 필수" },
      { name: "CI/DI 암호화 고유 식별 값", required: true, type: "본인인증 필수" },
      { name: "OK캐쉬백 적립처 및 사용 포인트 내역", required: false, type: "행동분석 선택", relatedTermId: "ok-opt-reprovide" },
      { name: "보험 가입 추천용 전화번호 및 주소", required: false, type: "금융 제휴 선택", relatedTermId: "ok-opt-thirdparty-ins" },
      { name: "맞춤 타겟용 ADID (광고 기기 식별 값)", required: false, type: "마케팅 선택", relatedTermId: "ok-opt-thirdparty-comm" }
    ]
  },
  {
    id: "pass",
    title: "PASS 인증서",
    category: "이동통신 3사 통합 본인 확인 서비스",
    emoji: "🔐",
    brandColor: "#000000", // 블랙
    textColor: "text-white",
    baseScore: 62, // 주의 (Yellow)
    terms: [
      {
        id: "pass-req-use",
        title: "[필수] PASS 서비스 이용약관",
        required: true,
        description: "간편인증서 발급 및 본인식별 수단 제공을 위한 기본 약관 동의입니다.",
        impactScore: 0,
        detailInfo: "본 약관은 회원이 통신사가 제공하는 PASS 간편인증 및 전자서명 서비스를 이용함에 있어 권리와 책임 한계를 명시합니다."
      },
      {
        id: "pass-req-privacy",
        title: "[필수] 개인정보 수집 및 이용 동의",
        required: true,
        description: "통신사 본인 명의 개통 여부 대조를 위해 필수 수집되는 항목입니다.",
        impactScore: 0,
        detailInfo: "수집 항목: 성명, 휴대폰번호, 통신사, 생년월일, 성별, 내외국인 정보. 이용 목적: PASS 인증 거래 서명 검증."
      },
      {
        id: "pass-req-trust",
        title: "[필수] 개인정보의 취급위탁 동의",
        required: true,
        description: "금융결제원 및 외부 신용평가기관과의 정보 중계를 위한 필수 동의입니다.",
        impactScore: 0,
        detailInfo: "회사는 원활한 신원 검증 처리를 위해 NICE평가정보 및 코리아크레딧뷰로(KCB) 등 외부 평가 기관에 통신 신용 확인 위탁 처리를 진행합니다."
      },
      {
        id: "pass-opt-event-privacy",
        title: "[선택] 이벤트 참여를 위한 개인정보 수집 및 이용 동의",
        required: false,
        description: "인증 완료 후 제공되는 경품 룰렛 및 기프티콘 증정 이벤트 참여 용도입니다.",
        impactScore: 15,
        detailInfo: "수집 목적: PASS 브랜드 제휴 경품 응모 및 당첨 여부 고지. 수집 항목: 휴대폰 번호, 이름. 보관 기간: 이벤트 종료 후 3개월."
      },
      {
        id: "pass-opt-event-trust",
        title: "[선택] 이벤트 대행을 위한 개인정보 처리위탁 동의",
        required: false,
        description: "모바일 쿠폰 발송 및 마케팅 대행 외주사에게 위탁하기 위한 동의입니다.",
        impactScore: 13,
        detailInfo: "수탁자: 젤리블루, 대행 대행사 다수. 위탁 업무: 모바일 경품 기프티콘 MMS 발송 및 타겟 광고 집행 대행."
      },
      {
        id: "pass-opt-marketing",
        title: "[선택] 광고성 정보 수신동의 및 혜택 알림",
        required: false,
        description: "간편인증 시 제공되는 금융/쇼핑 연계 부가 혜택 및 특가 보험 제안 알림 수신 동의입니다.",
        impactScore: 12,
        detailInfo: "회원은 PASS 앱의 푸시 배너 및 팝업 화면을 통해 금융 제휴 신용카드 발급, 신용 리포트 무료 진단 등 다양한 상업적 광고 정보를 수신하는 데 동의합니다."
      }
    ],
    riskFactors: [
      {
        id: "pass-risk-1",
        title: "경품 응모를 위장한 대행사 정보 유출",
        description: "이벤트 참여 및 대행사 위탁 동의 시, 경품 응모와 기프티콘 발송이라는 명목으로 내 번호가 다수의 외부 마케팅 대행 외주사에 위탁 공유됩니다.",
        level: "warning",
        relatedTermId: "pass-opt-event-trust",
        resolvedMessage: "이벤트 대행 위탁 해제로 타사 마케팅 대행업체로의 우회성 유출 경로를 격리했습니다.",
        fullClauseText: "제11조 (마케팅 위탁) PASS는 이벤트 참여 및 경품 대행 서비스를 위해 회원의 전화번호를 당사 외부 프로모션 제휴 위탁사인 젤리블루 및 다수의 소규모 마케팅 대행 파트너사들에 이전하여 가공 및 문자 전송 업무를 수행하게 합니다.",
        dangerSegment: "외부 프로모션 제휴 위탁사인 젤리블루 및 다수의 소규모 마케팅 대행 파트너사들에 이전하여",
        aiAnalysisComment: "인증서를 쓰려고 할 뿐인데 복잡한 외부 광고 마케팅 대행사들에 전화번호가 유입되어 추후 타겟 광고 스팸에 간접 기여할 수 있는 통로가 됩니다.",
        remedyActionTip: "'[선택] 이벤트 대행을 위한 개인정보 처리위탁 동의' 체크를 해제하시면 내 번호가 타 마케팅 사로 이전되는 것을 차단합니다."
      },
      {
        id: "pass-risk-2",
        title: "인증서 홈 화면의 금융 광고 표적 노출",
        description: "PASS 앱을 켤 때마다 전체 화면 광고나 혜택 카드라는 명목으로 금융 대출, 신용 카드 가입 팝업 스팸이 자주 노출될 수 있습니다.",
        level: "warning",
        relatedTermId: "pass-opt-marketing",
        resolvedMessage: "광고성 정보 수신 거부로 앱 내 무분별한 팝업 배너 광고 침투를 비활성화했습니다.",
        fullClauseText: "제17조 (앱 푸시 광고) 통신 3사는 광고 마케팅 활용 동의를 완료한 사용자에 한하여 간편인증 성공 페이지 하단 및 PASS 앱 홈 화면 전체 팝업 형태로 고금리 저축 상품 대출 알림 및 신용카드 가입 유도 마케팅을 실시간 팝업할 수 있습니다.",
        dangerSegment: "간편인증 성공 페이지 하단 및 PASS 앱 홈 화면 전체 팝업 형태로 고금리 저축 상품 대출 알림 및 신용카드 가입 유도 마케팅을 실시간 팝업",
        aiAnalysisComment: "인증서 본연의 보안 기능 외에 사용자의 소비 패턴을 자극하는 금융성 카드 발급 스팸 배너를 인증 완료 화면에 집요하게 강제 노출하도록 허용하는 조항입니다.",
        remedyActionTip: "'[선택] 광고성 정보 수신동의 및 혜택 알림'의 체크를 끄면 인증 화면이 한결 깔끔하고 안전하게 유지됩니다."
      }
    ],
    baseSummary: [
      "본인 인증 서비스를 위한 필수 조항은 금융 보안 가이드라인에 맞춰 비교적 투명합니다.",
      "하지만 이벤트 참여 및 경품 추천에 동의할 시 외부 마케팅 대행사로 번호 위탁이 이루어집니다.",
      "선택 약관을 해제하면 안전 등급(34점)으로 크게 떨어져 순수 인증용 메커니즘으로만 격리 작동시킬 수 있습니다."
    ],
    collectionItems: [
      { name: "성명, 생년월일, 성별, 통신사 및 휴대폰 번호", required: true, type: "본인인증 필수" },
      { name: "NICE/KCB 통신 신용정보 조회 로그", required: true, type: "인증대조 필수" },
      { name: "경품 지급용 휴대폰 연락처 정보", required: false, type: "이벤트 선택", relatedTermId: "pass-opt-event-privacy" },
      { name: "대행사 모바일 광고 트래킹 식별자", required: false, type: "마케팅 위탁 선택", relatedTermId: "pass-opt-event-trust" }
    ]
  },
  {
    id: "daiso",
    title: "다이소 멤버십",
    category: "국내 대표 생활용품 브랜드 멤버십",
    emoji: "🛍️",
    brandColor: "#D11C23", // 다이소 레드
    textColor: "text-white",
    baseScore: 58, // 주의 (Yellow)
    terms: [
      {
        id: "daiso-req-use",
        title: "[필수] 다이소 멤버십 이용 약관",
        required: true,
        description: "다이소 매장 포인트 적립 및 사용, 멤버십 가입을 위한 기본 권리 의무 사항입니다.",
        impactScore: 0,
        detailInfo: "본 약관은 아성다이소(주)가 운영하는 다이소 멤버십 회원이 오프라인 및 온라인 샵 다이소에서 상품 구매에 따른 마일리지를 환산하는 권리를 명시합니다."
      },
      {
        id: "daiso-req-privacy",
        title: "[필수] 필수 개인정보 수집 및 이용 동의서",
        required: true,
        description: "회원 식별 및 포인트 적립 한도 관리를 위한 최소한의 데이터 수집 동의입니다.",
        impactScore: 0,
        detailInfo: "회사는 포인트 적립 처리를 위해 성명, 성별, 연령대, 휴대전화번호를 필수 보유하며, 동의하지 않을 시 멤버십 혜택을 이용할 수 없습니다."
      },
      {
        id: "daiso-opt-thirdparty",
        title: "[선택] 제3자 정보 제공 동의 (제휴 가맹점)",
        required: false,
        description: "다이소 제휴 패션/뷰티 브랜드 및 패밀리 서비스 매장 포인트 통합 적립용입니다.",
        impactScore: 18,
        detailInfo: "제공받는 자: 당사 패밀리 서비스 파트너사 및 제휴 뷰티 유통사. 제공 목적: 브랜드 연계 통합 프로모션 제공. 제공 항목: 구매 내역 및 매장 방문 선호 데이터."
      },
      {
        id: "daiso-opt-solpay",
        title: "[선택] 다이소-SOL페이 동시 가입하기 동의",
        required: false,
        description: "신용카드 결제 혜택 극대화 및 간편결제 자동 연동을 위해 금융 플랫폼을 동시 가입합니다.",
        impactScore: 20,
        detailInfo: "회원은 멤버십 가입과 동시에 신한카드(주)가 제공하는 SOL페이 간편결제 서비스의 회원 약관에 일괄 동의하며, 가입 승인을 금융사에 즉각 이관 요청하는 데 승인합니다."
      }
    ],
    riskFactors: [
      {
        id: "daiso-risk-1",
        title: "제휴 금융 플랫폼 우회성 동시 가입",
        description: "단순 포인트 적립을 위한 멤버십 가입 시, '동시 가입' 선택지에 동의하면 나도 모르게 제휴 카드사의 금융 페이 서비스에 일괄 회원 가입 처리될 수 있습니다.",
        level: "warning",
        relatedTermId: "daiso-opt-solpay",
        resolvedMessage: "동시 가입 선택 해제로 불필요한 타사 금융 플랫폼 일괄 가입을 방지했습니다.",
        fullClauseText: "제15조 (동시 가입의 이관) 당사 멤버십 가입과 함께 다이소-SOL페이 동시 가입에 동의한 회원의 경우, 신한카드 간편결제 구동을 위한 주민등록번호 및 신용 연동 식별 데이터를 해당 금융사에 지체 없이 제공하며, 해당 금융사의 전자금융거래 약관에 자동 동의된 회원으로 일괄 위탁 등록됩니다.",
        dangerSegment: "주민등록번호 및 신용 연동 식별 데이터를 해당 금융사에 지체 없이 제공하며, 해당 금융사의 전자금융거래 약관에 자동 동의된 회원으로 일괄 위탁 등록",
        aiAnalysisComment: "매장 포인트 적립만을 생각하고 가입했다가 외부 신용카드/금융사 간편결제 회원으로 중복 등록되어 민감한 주민번호 및 신용 데이터 연동이 유발되는 조항입니다.",
        remedyActionTip: "약관 목록 최하단의 '[선택] 다이소-SOL페이 동시 가입하기 동의' 체크박스를 꺼 주시면 안전합니다."
      },
      {
        id: "daiso-risk-2",
        title: "오프라인 매장 방문 및 쇼핑 성향 유출",
        description: "제3자 제공 동의 시, 내가 주로 어떤 매장을 방문해 어떤 생필품을 자주 구매하는지에 대한 구매 이력이 마케팅 분석용으로 공유될 위험이 있습니다.",
        level: "warning",
        relatedTermId: "daiso-opt-thirdparty",
        resolvedMessage: "제3자 제공 거부로 내 장바구니 품목 및 라이프스타일 유출을 차단했습니다.",
        fullClauseText: "제18조 (쇼핑 데이터 제공) 회사는 제3자 제공 동의 회원에 한하여, 전국 매장에서 구매된 일일 적립 상품의 SKU(바코드 품목), 결제 시간대 및 매장 주소 데이터를 제휴 광고 분석 기관에 이전하여 쇼핑 성향 분석 마케팅에 제공합니다.",
        dangerSegment: "바코드 품목, 결제 시간대 및 매장 주소 데이터를 제휴 광고 분석 기관에 이전하여",
        aiAnalysisComment: "마트나 매장에서 무엇을 샀는지 세세한 바코드 단위의 영수증 정보가 제휴사에 공유되어 관심사 프로파일링에 도용될 우려가 있습니다.",
        remedyActionTip: "'[선택] 제3자 정보 제공 동의' 체크를 해제하시면 구매 영수증 데이터의 외부 유출이 법적으로 차단됩니다."
      }
    ],
    baseSummary: [
      "국내 오프라인 멤버십 특성상 기본 약관은 다소 무난하게 보호됩니다.",
      "단, 제휴 카드사 결제 솔루션과의 '동시 가입' 유도 조항이 있어 무분별한 금융사 정보 이관이 유발될 수 있습니다.",
      "체크를 해제하면 20점의 완벽한 '안전 등급' 마일리지 계정으로 운용할 수 있습니다."
    ],
    collectionItems: [
      { name: "성명, 휴대전화번호, 성별", required: true, type: "식별정보 필수" },
      { name: "구매 금액 및 포인트 적립 포인트 이력", required: true, type: "마일리지 필수" },
      { name: "다이소 매장 방문 위치 및 구매 품목", required: false, type: "성향분석 선택", relatedTermId: "daiso-opt-thirdparty" },
      { name: "주민등록번호 기반 신용 연동 값", required: false, type: "금융 연동 선택", relatedTermId: "daiso-opt-solpay" }
    ]
  },
  {
    id: "starbucks",
    title: "STARBUCKS",
    category: "식음료 브랜드 모바일 오더 서비스",
    emoji: "☕",
    brandColor: "#00704A", // 스타벅스 그린
    textColor: "text-white",
    baseScore: 25, // 안전 (Green)
    terms: [
      {
        id: "star-req-use",
        title: "[필수] 스타벅스 회원 이용약관 동의",
        required: true,
        description: "모바일 사이렌오더, 카드 충전 및 전자 영수증 발행을 위한 기본 약관입니다.",
        impactScore: 0,
        detailInfo: "본 약관은 주식회사 에스씨케이컴퍼니가 제공하는 스타벅스 리워드 회원 서비스의 충전, 사이렌 오더 주문 및 리워드 별(Star) 적립 기준을 정의합니다."
      },
      {
        id: "star-req-privacy",
        title: "[필수] 개인정보 수집 및 이용동의",
        required: true,
        description: "닉네임, 생년월일, 모바일 결제 매칭을 위한 필수 계정 정보 수집 동의입니다.",
        impactScore: 0,
        detailInfo: "수집 항목: 이메일, 닉네임, 휴대폰 번호, 생년월일. 이용 목적: 사이렌오더 호출 닉네임 인식 및 모바일 카드 연동."
      },
      {
        id: "star-opt-marketing",
        title: "[선택] E-mail 및 SMS 광고성 정보 수신동의",
        required: false,
        description: "사이렌 오더 신제품 출시 알림, 무료 음료 e-쿠폰 증정 이벤트 소식 수신 동의입니다.",
        impactScore: 10,
        detailInfo: "회사는 동의한 회원을 대상으로 계절별 프로모션 음료 소개, 리워드 별 추가 이벤트 e-쿠폰 발송 마케팅 메일 및 광고 문자메시지를 전송합니다."
      }
    ],
    riskFactors: [
      {
        id: "star-risk-1",
        title: "프로모션 강권 마케팅 정보 유입",
        description: "신상품 출시 시 메일이나 광고 SMS가 주기적으로 발송될 수 있으나, 사생활 유출과 같은 치명적인 보안 리스크는 매우 낮습니다.",
        level: "safe",
        relatedTermId: "star-opt-marketing",
        resolvedMessage: "마케팅 수신동의를 해제하여 광고성 e-메일 및 불필요한 푸시 유입을 원천 방지했습니다.",
        fullClauseText: "제12조 (마케팅 및 프로모션 안내) 에스씨케이컴퍼니는 리워드 혜택 정보를 선택 수신에 동의한 회원에 한하여, 음료 쿠폰 증정, 별 추가 적립 특가 딜 및 시즌별 프로모션 굿즈(다이어리 등) 출시 소식 알림을 SMS 및 메일링으로 전송할 수 있습니다.",
        dangerSegment: "별 추가 적립 특가 딜 및 시즌별 프로모션 굿즈(다이어리 등) 출시 소식 알림을 SMS 및 메일링으로 전송",
        aiAnalysisComment: "금융 정보 연동이나 국외 제3자 이전 등이 전혀 없고, 순수한 스타벅스 매장 식음료 이벤트 마케팅 알림에 국한되어 유출 우려가 전혀 없는 매우 안전한 마케팅 조항입니다.",
        remedyActionTip: "광고성 문자가 귀찮으시다면 '[선택] E-mail 및 SMS 광고성 정보 수신동의'의 체크박스를 꺼 두시면 됩니다."
      }
    ],
    baseSummary: [
      "마케팅 활용 및 제3자 공유 범위가 국내 최고 수준으로 좁고 정직하게 보호됩니다.",
      "선택 항목을 해제하지 않더라도 최대 취약도 점수가 25점에 불과한 매우 모범적인 보안 등급 상태입니다.",
      "금융사 연동 등의 외부 유출 우려가 없어 사이렌오더와 선불 충전 카드를 안전하게 사용하셔도 무방합니다."
    ],
    collectionItems: [
      { name: "이메일 주소, 닉네임, 생년월일, 휴대전화번호", required: true, type: "사이렌오더 필수" },
      { name: "스타벅스 충전 금액 및 결제 수단 승인값", required: true, type: "결제처리 필수" },
      { name: "프로모션 쿠폰 및 혜택 발송 이력", required: false, type: "혜택알림 선택", relatedTermId: "star-opt-marketing" }
    ]
  }
];
