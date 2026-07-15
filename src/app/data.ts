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
        impactScore: 10,
        detailInfo: "본 약관은 회원이 SK플래닛(주)이 제공하는 OK캐쉬백 서비스를 이용함에 있어 회원과 회사 간의 권리, 의무 및 책임 사항을 규정합니다."
      },
      {
        id: "ok-req-privacy",
        title: "[필수] 개인정보 수집 및 활용 동의",
        required: true,
        description: "이름, 전화번호, 생년월일 등 서비스 본인 확인 및 계정 생성을 위한 수집 동의입니다.",
        impactScore: 15,
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
        description: "개인식별정보가 제휴 보험사로 이전되어 개인정보보호위원회(PIPC) 가이드라인을 우회하여 마케팅 목적 아웃바운드 영업 전화를 유입시킵니다.",
        level: "danger",
        relatedTermId: "ok-opt-thirdparty-ins",
        resolvedMessage: "보험사 제공 동의 거부로 원치 않는 텔레마케팅(TM) 보험 영업 전화를 원천 차단했습니다.",
        fullClauseText: "제14조 (제3자 금융 제공) 당사는 무료 안심 상해 보험 가입 및 부가 혜택 연계를 위해 사용자의 실명, 전화번호, 생년월일을 당사 제휴 보험사인 DB손해보험 및 신한라이프생명에 이전하며, 보험사는 이를 활용해 신규 보장성 상품 가입 권유 텔레마케팅 영업 및 아웃바운드 전화 상담 용도로 상시 사용할 수 있습니다.",
        dangerSegment: "보험사는 이를 활용해 신규 보장성 상품 가입 권유 텔레마케팅 영업 및 아웃바운드 전화 상담 용도로 상시 사용할 수 있습니다",
        aiAnalysisComment: "개인정보보호위원회(PIPC)의 개인정보 보호법 위반 및 과징금 부과 심결례에 따르면, 서비스 본래의 기능과 전혀 무관하게 '안심 보험 무료 제공'을 미끼로 가입자의 민감 정보를 외부 금융 영업사에 노출하고 표적 TM 전화를 유도하는 조항은 전형적인 정보주체 권리 침해 사례에 속합니다.",
        remedyActionTip: "개인정보보호위원회 권고에 따라, 가입 화면에서 '[선택] 개인정보 제3자 제공 동의 (SK플래닛 -> DB손해보험, 신한라이프생명)' 체크박스를 해제하시면 보험 마케팅 영업 전화의 유입 경로를 원천 차단합니다."
      },
      {
        id: "ok-risk-2",
        title: "다수 대기업/계열사 간 전방위 데이터 재제공",
        description: "공정거래위원회(KFTC) 표준약관과 상이하게, 계열사 연합체 전방위로 내 소비 패턴 및 마일리지 행동 로그를 이전 및 가공하는 불공정 데이터 결합 조항입니다.",
        level: "danger",
        relatedTermId: "ok-opt-reprovide",
        resolvedMessage: "제3자 재제공 동의 해제로 대기업 연합체 내부의 개인 구매 프로필 연계 위험을 방지했습니다.",
        fullClauseText: "제19조 (행동 데이터 재제공) SK플래닛은 회원이 적립/사용한 가맹점명, 사용 시간, 구매 품목 내역 및 라이프스타일 정보를 SK텔레콤, 11번가, ADT캡스, 드림어스컴퍼니 등 10개 이상의 전 대기업 파트너 연맹에 공유 및 재제공하여, 각 회사의 마케팅 프로필 데이터와 결합한 맞춤 타겟 광고에 활용합니다.",
        dangerSegment: "10개 이상의 전 대기업 파트너 연맹에 공유 및 재제공하여, 각 회사의 마케팅 프로필 데이터와 결합한 맞춤 타겟 광고에 활용합니다",
        aiAnalysisComment: "공정거래위원회(KFTC)의 불공정 약관 시정 사례 및 심결 데이터에 비추어 볼 때, 서비스 본연의 목적을 넘어선 대기업 및 다수 계열사 연합체 간의 무제한 행동 데이터 전송 및 가공은 약관법 상 고객에게 부당하게 불리한 불공정 조항으로 시정 권고를 받은 전례와 매우 유사합니다.",
        remedyActionTip: "공정거래위원회의 표준약관 가이드라인에 기초하여, 폰 화면에서 '[선택] 혜택 제공을 위한 제3자 재제공 동의'를 비활성화하시면 연맹사 간의 연쇄 데이터 결합을 방지하고 프라이버시를 안전하게 확보할 수 있습니다."
      },
      {
        id: "ok-risk-3",
        title: "주기적인 타겟 쇼핑 스팸 SMS 폭탄",
        description: "한국인터넷진흥원(KISA)의 불법스팸 방지 가이드라인과 달리, 실시간 마케팅 알림이 24시간 동안 수시로 발송되어 사생활을 침해할 소지가 큽니다.",
        level: "warning",
        relatedTermId: "ok-opt-benefit",
        resolvedMessage: "혜택 문자 수신을 해제하여 일상 스팸 SMS를 예방했습니다.",
        fullClauseText: "제9조 (광고 발송 권한) 회사는 이벤트 수신 동의를 거친 회원에게 타겟 할인 딜 및 신규 모바일 카드 출시를 촉진하는 유료 SMS 및 이메일, 앱 푸시 마케팅 알림을 시간 제한 없이 실시간 전송할 수 있습니다.",
        dangerSegment: "이메일, 앱 푸시 마케팅 알림을 시간 제한 없이 실시간 전송할 수 있습니다",
        aiAnalysisComment: "한국인터넷진흥원(KISA)의 개인정보보호 수칙 및 스팸 광고 전송 규정에 비추어 볼 때, 야간 발송 등의 구체적인 제어 없이 수시로 광고성 유료 메시지와 앱 푸시를 유도하는 구조는 불필요한 스팸 스트레스와 피로도를 크게 유발합니다.",
        remedyActionTip: "KISA의 스팸 예방 안내에 따라 '[선택] OK캐쉬백 혜택수신 및 알림 SMS 수신 동의'를 체크 해제하시면 마일리지 본연의 용도로만 쾌적하게 사용 가능합니다."
      }
    ],
    baseSummary: [
      "국내 최대의 제3자 제공 범위를 보유하고 있어 선택 약관 전체 동의 시 스팸 유발 가능성이 매우 높습니다.",
      "무료 가입 제휴 보험사를 통한 보험 강권 텔레마케팅 전화 유입 조항이 포함되어 있습니다.",
      "선택 항목을 3개 이상 해제할 시 위협도가 50점 이하의 '주의' 수준으로 낮아져 마일리지 적립 본연의 기능만 안전하게 쓸 수 있습니다."
    ],
    collectionItems: [
      { name: "이름, 생년월일, 성별, 휴대폰 번호", required: true, type: "본인인증 필수", relatedTermId: "ok-req-privacy" },
      { name: "CI/DI 암호화 고유 식별 값", required: true, type: "본인인증 필수", relatedTermId: "ok-req-privacy" },
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
        impactScore: 10,
        detailInfo: "본 약관은 회원이 통신사가 제공하는 PASS 간편인증 및 전자서명 서비스를 이용함에 있어 권리와 책임 한계를 명시합니다."
      },
      {
        id: "pass-req-privacy",
        title: "[필수] 개인정보 수집 및 이용 동의",
        required: true,
        description: "통신사 본인 명의 개통 여부 대조를 위해 필수 수집되는 항목입니다.",
        impactScore: 15,
        detailInfo: "수집 항목: 성명, 휴대폰번호, 통신사, 생년월일, 성별, 내외국인 정보. 이용 목적: PASS 인증 거래 서명 검증."
      },
      {
        id: "pass-req-trust",
        title: "[필수] 개인정보의 취급위탁 동의",
        required: true,
        description: "금융결제원 및 외부 신용평가기관과의 정보 중계를 위한 필수 동의입니다.",
        impactScore: 12,
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
        description: "한국인터넷진흥원(KISA)의 최근 개인정보 침해사고 동향 보고서에 따르면, 프로모션 핑계의 다수 대행사 위탁은 2차 스팸 노출 경로로 악용될 우려가 있습니다.",
        level: "warning",
        relatedTermId: "pass-opt-event-trust",
        resolvedMessage: "이벤트 대행 위탁 해제로 타사 마케팅 대행업체로의 우회성 유출 경로를 격리했습니다.",
        fullClauseText: "제11조 (마케팅 위탁) PASS는 이벤트 참여 및 경품 대행 서비스를 위해 회원의 전화번호를 당사 외부 프로모션 제휴 위탁사인 젤리블루 및 다수의 소규모 마케팅 대행 파트너사들에 이전하여 가공 및 문자 전송 업무를 수행하게 합니다.",
        dangerSegment: "외부 프로모션 제휴 위탁사인 젤리블루 및 다수의 소규모 마케팅 대행 파트너사들에 이전하여",
        aiAnalysisComment: "한국인터넷진흥원(KISA)의 서비스 분야별 개인정보보호 수칙에 근거할 때, 가입자가 필수 인증을 목적으로 이용하려는 상황에서 우회적인 룰렛/경품 혜택 동의를 거쳐 다수의 외주 마케팅 대행사에 개인정보 위탁 처리를 이관하는 구조는 추후 광고성 보이스피싱 및 스미싱 침해 위협의 도화선으로 작용하기 쉽습니다.",
        remedyActionTip: "KISA 침해 예방 가이드에 따라, 모바일 화면에서 '[선택] 이벤트 대행을 위한 개인정보 처리위탁 동의'를 선택 해제하여 정보 오남용의 통로를 격리해 주시기 바랍니다."
      },
      {
        id: "pass-risk-2",
        title: "인증서 홈 화면의 금융 광고 표적 노출",
        description: "공정거래위원회(KFTC) 표준 권고사항인 '사용자 식별에 필요한 기능 본연 제공'과 무관하게 신용 및 금융 상품 마케팅을 강권적으로 앱 전면에 노출합니다.",
        level: "warning",
        relatedTermId: "pass-opt-marketing",
        resolvedMessage: "광고성 정보 수신 거부로 앱 내 무분별한 팝업 배너 광고 침투를 비활성화했습니다.",
        fullClauseText: "제17조 (앱 푸시 광고) 통신 3사는 광고 마케팅 활용 동의를 완료한 사용자에 한하여 간편인증 성공 페이지 하단 및 PASS 앱 홈 화면 전체 팝업 형태로 고금리 저축 상품 대출 알림 및 신용카드 가입 유도 마케팅을 실시간 팝업할 수 있습니다.",
        dangerSegment: "간편인증 성공 페이지 하단 및 PASS 앱 홈 화면 전체 팝업 형태로 고금리 저축 상품 대출 알림 및 신용카드 가입 유도 마케팅을 실시간 팝업",
        aiAnalysisComment: "공정위 불공정 시정 기준 및 이용 권한 적합성 기준에 비추어 보았을 때, 인증 서비스 이용 동선(인증 성공 하단 및 홈화면 전체 팝업)을 교란하여 소비와 대출을 유도하는 방식은 소비자 선택의 자유를 과도하게 제한하여 시정이 요구되는 조항입니다.",
        remedyActionTip: "공정거래위원회 약관 권고사항을 참조하여 '[선택] 광고성 정보 수신동의 및 혜택 알림'의 체크를 비활성화하시면 금융 결합 스팸이 차단됩니다."
      }
    ],
    baseSummary: [
      "본인 인증 서비스를 위한 필수 조항은 금융 보안 가이드라인에 맞춰 비교적 투명합니다.",
      "하지만 이벤트 참여 및 경품 추천에 동의할 시 외부 마케팅 대행사로 번호 위탁이 이루어집니다.",
      "선택 약관을 해제하면 안전 등급(22점)으로 크게 떨어져 순수 인증용 메커니즘으로만 격리 작동시킬 수 있습니다."
    ],
    collectionItems: [
      { name: "성명, 생년월일, 성별, 통신사 및 휴대폰 번호", required: true, type: "본인인증 필수", relatedTermId: "pass-req-privacy" },
      { name: "NICE/KCB 통신 신용정보 조회 로그", required: true, type: "인증대조 필수", relatedTermId: "pass-req-trust" },
      { name: "경품 지급용 휴대폰 연락처 정보", required: false, type: "이벤트 선택", relatedTermId: "pass-opt-event-privacy" },
      { name: "대행사 모바일 광고 트래킹식별자", required: false, type: "마케팅 위탁 선택", relatedTermId: "pass-opt-event-trust" }
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
        impactScore: 10,
        detailInfo: "본 약관은 아성다이소(주)가 운영하는 다이소 멤버십 회원이 오프라인 및 온라인 샵 다이소에서 상품 구매에 따른 마일리지를 환산하는 권리를 명시합니다."
      },
      {
        id: "daiso-req-privacy",
        title: "[필수] 필수 개인정보 수집 및 이용 동의서",
        required: true,
        description: "회원 식별 및 포인트 적립 한도 관리를 위한 최소한의 데이터 수집 동의입니다.",
        impactScore: 15,
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
        description: "공정거래위원회(KFTC)가 금지하는 '끼워팔기식 우회 동시 가입' 형태로, 멤버십 가입 시 타사 신용정보 통합 조회 및 가입 동의를 강제 연동합니다.",
        level: "warning",
        relatedTermId: "daiso-opt-solpay",
        resolvedMessage: "동시 가입 선택 해제로 불필요한 타사 금융 플랫폼 일괄 가입을 방지했습니다.",
        fullClauseText: "제15조 (동시 가입의 이관) 당사 멤버십 가입과 함께 다이소-SOL페이 동시 가입에 동의한 회원의 경우, 신한카드 간편결제 구동을 위한 주민등록번호 및 신용 연동 식별 데이터를 해당 금융사에 지체 없이 제공하며, 해당 금융사의 전자금융거래 약관에 자동 동의된 회원으로 일괄 위탁 등록됩니다.",
        dangerSegment: "주민등록번호 및 신용 연동 식별 데이터를 해당 금융사에 지체 없이 제공하며, 해당 금융사의 전자금융거래 약관에 자동 동의된 회원으로 일괄 위탁 등록",
        aiAnalysisComment: "공정거래위원회(KFTC) 불공정 약관 시정 사례 및 공정거래법에 비추어 볼 때, 단순 포인트 적립 기능 가입을 미끼로 제3자 금융 연동 결제 서비스의 일괄 가입을 체결시키고 금융 데이터 이관을 자동 유도하는 구조는 명백히 소비자 선택권을 구속하는 독소 형태입니다.",
        remedyActionTip: "공정거래위원회 시정안에 기초하여, 폰 체크리스트에서 '[선택] 다이소-SOL페이 동시 가입하기 동의'를 선택 해제하시면 외부 금융 가입이 차단됩니다."
      },
      {
        id: "daiso-risk-2",
        title: "오프라인 매장 방문 및 쇼핑 성향 유출",
        description: "개인정보보호위원회(PIPC)의 목적 외 과도한 행동 수집 방지 기준에 어긋나며, 소비 정보가 마케팅 광고 대행 파트너사에 포괄 제공될 우려가 있습니다.",
        level: "warning",
        relatedTermId: "daiso-opt-thirdparty",
        resolvedMessage: "제3자 제공 거부로 내 장바구니 품목 및 라이프스타일 유출을 차단했습니다.",
        fullClauseText: "제18조 (쇼핑 데이터 제공) 회사는 제3자 제공 동의 회원에 한하여, 전국 매장에서 구매된 일일 적립 상품의 SKU(바코드 품목), 결제 시간대 및 매장 주소 데이터를 제휴 광고 분석 기관에 이전하여 쇼핑 성향 분석 마케팅에 제공합니다.",
        dangerSegment: "바코드 품목, 결제 시간대 및 매장 주소 데이터를 제휴 광고 분석 기관에 이전하여",
        aiAnalysisComment: "개인정보보호위원회(PIPC) 처리 가이드라인에 명시된 개인정보 오남용 방지 기준에 비추어 볼 때, 구매한 상품들의 바코드 상세 품목(SKU) 및 영수증 단위 데이터를 제3자 광고 제휴사에 넘겨 내 소비 동선과 라이프스타일을 상업적으로 영구 프로파일링하도록 내버려 두는 조항은 가급적 거절하는 것이 바람직합니다.",
        remedyActionTip: "개인정보보호법에 의거하여, '[선택] 제3자 정보 제공 동의'의 체크박스를 꺼 두시면 영수증 단위 상세 쇼핑 품목의 무단 외부 이전이 정지되어 안전합니다."
      }
    ],
    baseSummary: [
      "국내 오프라인 멤버십 특성상 기본 약관은 다소 무난하게 보호됩니다.",
      "단, 제휴 카드사 결제 솔루션과의 '동시 가입' 유도 조항이 있어 무분별한 금융사 정보 이관이 유발될 수 있습니다.",
      "체크를 해제하면 20점의 완벽한 '안전 등급' 마일리지 계정으로 운용할 수 있습니다."
    ],
    collectionItems: [
      { name: "성명, 휴대전화번호, 성별", required: true, type: "식별정보 필수", relatedTermId: "daiso-req-privacy" },
      { name: "구매 금액 및 포인트 적립 포인트 이력", required: true, type: "마일리지 필수", relatedTermId: "daiso-req-use" },
      { name: "다이소 매장 방문 위치 및 구매 품목", required: false, type: "성향분석 선택", relatedTermId: "daiso-opt-thirdparty" },
      { name: "주민등록번호 기반 신용 연동 값", required: false, type: "금융 연동 선택", relatedTermId: "daiso-opt-solpay" }
    ]
  },
  {
    id: "kkuldeal",
    title: "꿀딜아울렛",
    category: "초특가 해외 직구 쇼핑몰 (미검증 신생 서비스)",
    emoji: "🚨",
    brandColor: "#FF5A5F", // 피싱 위협 경고용 코랄 레드
    textColor: "text-white",
    baseScore: 95, // 극도로 위험한 상태 (Red)
    terms: [
      {
        id: "kkul-req-use",
        title: "[필수] 꿀딜아울렛 서비스 기본 이용약관",
        required: true,
        description: "신생 미검증 쇼핑몰 가입 및 주문 처리를 위한 기본 약관입니다.",
        impactScore: 10,
        detailInfo: "본 약관은 회원이 꿀딜아울렛(중국 소재 대리인)이 운영하는 초특가 쇼핑몰 서비스를 이용함에 있어 권리, 의무를 명시합니다. 법적 분쟁 시 중국 선전 소재 중재 법원을 유일한 관할 법원으로 지정합니다."
      },
      {
        id: "kkul-req-privacy",
        title: "[필수] 회원 본인 확인 및 결제 정보 수집 동의",
        required: true,
        description: "성명, 생년월일, 휴대전화번호 및 초특가 상품 결제를 위한 카드 고유 번호 수집 동의입니다.",
        impactScore: 15,
        detailInfo: "회사는 본인 확인 및 간편 해외 결제를 위해 성명, 성별, 연령대, 신용카드 번호, 유효기간, CVC 고유 비밀 키를 필수 수집 및 영구 보관합니다."
      },
      {
        id: "kkul-opt-abroad",
        title: "[선택] 초특가 혜택 분석 목적 국외 제3자 이전 동의",
        required: false,
        description: "해외 마케팅 분석 및 표적 프로모션 광고 전송 대행을 위해 국외 파트너사에 개인정보를 공유합니다.",
        impactScore: 35,
        detailInfo: "개인정보를 제공받는 자: 중국 선전 소재 마케팅 대행 파트너사. 제공 목적: 맞춤 타겟 이벤트 및 아웃바운드 푸시 전송. 제공 항목: 이름, 전화번호, 쇼핑 구매 이력, 카드 번호 일부."
      },
      {
        id: "kkul-opt-device",
        title: "[선택] 기기 제어 권한 일괄 획득 동의 (백그라운드)",
        required: false,
        description: "사이즈 추천 및 모바일 최적화 목적의 백그라운드 GPS, 주소록, 사진첩 일괄 접근 권한을 획득합니다.",
        impactScore: 35,
        detailInfo: "사용자는 모바일 최적화 편의기능 사용을 위해 스마트폰 백그라운드 구동 중에도 GPS 실시간 동선, 연락처 목록, 갤러리 미디어 사진 정보 일체에 앱이 접근하여 조회 및 외부 전송하는 것을 동의합니다."
      }
    ],
    riskFactors: [
      {
        id: "kkul-risk-1",
        title: "도메인 생성 10일 이내의 미검증 피싱 위협",
        description: "공공 데이터(KISA) 침해사고 도메인 DB와 연계한 결과, 도메인 등록일(2026-07-10) 기준 생성된 지 10일이 경과하지 않은 미인증 신생 서비스입니다. 가입 및 결제 카드 번호 입력 시 정보가 국외로 유출될 확률이 매우 높습니다.",
        level: "danger",
        relatedTermId: "kkul-opt-abroad",
        resolvedMessage: "국외 제3자 정보 제공 동의를 거부하여, 신규 생성 도메인을 통한 중국 선전 대행사로의 결제 카드 정보 영구 이전을 사전에 방어했습니다.",
        fullClauseText: "제12조 (국외 이전 및 위탁) 회사는 사용자가 동의한 경우, 구매 패턴 분석을 명목으로 수집된 회원명, 휴대전화번호, 결제 카드 번호 일체를 당사 해외 협력사(중국 선전 소재 마케팅 대행사)에 영구 이전 및 위탁 보관할 수 있습니다.",
        dangerSegment: "수집된 회원명, 휴대전화번호, 결제 카드 번호 일체를 당사 해외 협력사(중국 선전 소재 마케팅 대행사)에 영구 이전 및 위탁 보관",
        aiAnalysisComment: "한국인터넷진흥원(KISA)의 신종 스미싱/피싱 사이트 분석 동향 보고서에 비추어 볼 때, 개설된 지 10일 이내인 미검증 해외 쇼핑몰에서 '초특가 아울렛' 배너를 유포한 뒤 결제 수단 정보 및 개인 식별 정보를 수집해 국외(중국 등)로 전송시키는 조항은 전형적인 보이스피싱 및 카드 복제 사기 위험 수법에 속합니다.",
        remedyActionTip: "KISA 침해 예방 수칙에 근거하여, 스마트폰 체크박스에서 '[선택] 국외 제3자 이전 동의'를 절대 선택하지 마시고, 가급적 해당 신생 쇼핑몰 가입을 피해주시기 바랍니다."
      },
      {
        id: "kkul-risk-2",
        title: "백그라운드 기기 권한 일괄 통제 요구",
        description: "공정거래위원회 및 개인정보보호위원회의 과도한 기기 권한 요구 금지 원칙을 위반하여, 앱 비구동 시에도 실시간 위치 및 연락처, 사진첩 전체를 조회하여 외부로 유출할 위험이 있습니다.",
        level: "danger",
        relatedTermId: "kkul-opt-device",
        resolvedMessage: "기기 권한 일괄 동의를 해제하여 백그라운드 GPS 및 사적인 갤러리 미디어 사진 훔쳐보기 접근 권한을 원천 격리하였습니다.",
        fullClauseText: "제17조 (접근 권한 취득) 사용자는 모바일 최적화 편의기능 사용을 위해 스마트폰 백그라운드 구동 중에도 GPS 실시간 동선, 연락처 목록, 갤러리 미디어 사진 정보 일체에 앱이 접근하여 조회 및 외부 전송하는 것을 동의합니다.",
        dangerSegment: "GPS 실시간 동선, 연락처 목록, 갤러리 미디어 사진 정보 일체에 앱이 접근하여 조회 및 외부 전송하는 것을 동의",
        aiAnalysisComment: "개인정보보호위원회(PIPC)의 최소 개인정보 수집 원칙 및 모바일 앱 접근 권한 규정에 의거할 때, 서비스 목적(쇼핑)과 무관하게 백그라운드 상시 위치 추적 및 사용자 갤러리 미디어 파일 전체를 강제 탈취해 전송하겠다는 조항은 매우 심각한 프라이버시 침해이며 구글 플레이 등 스토어에서 영구 제재 대상에 속하는 불법 약관 형태입니다.",
        remedyActionTip: "가입 화면의 체크리스트에서 '[선택] 기기 제어 권한 일괄 획득 동의'를 즉각 비활성화하여 스마트폰 보안 해킹의 교두보를 차단하십시오."
      }
    ],
    baseSummary: [
      "KISA 도메인 추적 API 분석 결과, 개설 10일 미만의 위험도가 극도로 높은 해외 신생 피싱 도메인 의심 사이트입니다.",
      "구매자의 신용카드 결제 번호 및 비밀 고유 CVC 값을 국외로 이전하여 카드 부정 복제 위험을 초래합니다.",
      "선택 약관을 전체 해제할 시 위협 점수가 25점 안전 등급 수준으로 낮아져 카드/기기 해킹 위험을 차단하고 격리시킬 수 있습니다."
    ],
    collectionItems: [
      { name: "성명, 생년월일, 휴대전화 연락처", required: true, type: "본인인증 필수", relatedTermId: "kkul-req-privacy" },
      { name: "신용카드 카드번호, 유효기간, CVC 값", required: true, type: "카드결제 필수", relatedTermId: "kkul-req-privacy" },
      { name: "국외 제3자 결제 마케팅 이전 정보", required: false, type: "금융 유출 선택", relatedTermId: "kkul-opt-abroad" },
      { name: "백그라운드 스마트폰 GPS 및 사진첩 미디어 파일", required: false, type: "해킹 위협 선택", relatedTermId: "kkul-opt-device" }
    ]
  }
];
