export interface Term {
  id: string;
  title: string;
  required: boolean;
  description: string;
  impactScore: number; // 동의 해제 시 감점되는 위험 점수 (필수 약관도 감점 적용)
  detailInfo: string;
}

export interface RiskFactor {
  id: string;
  title: string;
  description: string;
  level: "danger" | "warning" | "safe";
  relatedTermId: string; // 이 위험이 해결되기 위해 해제해야 하는 선택/필수 약관 ID
  resolvedMessage?: string; // 해제되었을 때 보여줄 안전 메시지
  
  // 상세 분석용 필드
  fullClauseText: string;     
  dangerSegment: string;      
  aiAnalysisComment: string;  
  remedyActionTip: string;    
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
  baseScore: number; // 전체 동의 시 기본 위험 점수
  terms: Term[];
  riskFactors: RiskFactor[];
  baseSummary: string[];
  collectionItems: CollectionItem[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "sns",
    title: "ConnectX",
    category: "해외 무료 소셜 미디어 (SNS)",
    emoji: "💬",
    baseScore: 89, // 위험 (Red)
    terms: [
      {
        id: "sns-req-use",
        title: "[필수] ConnectX 서비스 이용 약관",
        required: true,
        description: "서비스 기본 기능 이용 및 계정 관리를 위한 필수 동의입니다.",
        impactScore: 20, // 해제 시 -20점
        detailInfo: "본 약관은 회원이 ConnectX 서비스를 이용함에 있어 필요한 기본적인 사항을 규정합니다. 회원은 가입과 동시에 본 서비스의 약관에 동의한 것으로 간주되며, 회원의 기본적인 서비스 이용 프로필이 분석 대상에 포함됩니다."
      },
      {
        id: "sns-req-privacy",
        title: "[필수] 개인정보 수집 및 이용 동의",
        required: true,
        description: "이름, 이메일, 생년월일 등 계정 생성을 위한 필수 정보 수집 동의입니다.",
        impactScore: 24, // 해제 시 -24점
        detailInfo: "회사는 서비스 제공을 위해 아래와 같은 개인정보를 필수 수집합니다. 수집 정보: 이메일 주소, 이름, 생년월일, 프로필 이미지. 보관 기간: 회원 탈퇴 시까지."
      },
      {
        id: "sns-opt-thirdparty",
        title: "[선택] 개인정보 국외 이전 및 제3자 제공 동의",
        required: false,
        description: "맞춤형 피드 구성을 위해 전 세계 광고 파트너사에게 개인 데이터를 제공합니다.",
        impactScore: 20, // 해제 시 -20점
        detailInfo: "수집된 행동 데이터(클릭 로그, 포스팅 내용, 친구 목록 등)는 맞춤형 콘텐츠 및 광고 제공을 목적으로 당사의 해외 계열사 및 제3자 마케팅 대행사에 제공 및 이전됩니다."
      },
      {
        id: "sns-opt-marketing",
        title: "[선택] 광고성 정보 수신 및 마케팅 활용 동의",
        required: false,
        description: "신규 기능 소개 및 스폰서 광고 목적의 푸시 알림과 이메일 수신 동의입니다.",
        impactScore: 15, // 해제 시 -15점
        detailInfo: "회사는 회원이 동의한 마케팅 정보를 바탕으로 이메일, SMS, 앱 푸시 알림 등을 통해 스폰서 광고 및 맞춤 이벤트 홍보 자료를 전송할 수 있습니다."
      },
      {
        id: "sns-opt-location",
        title: "[선택] 위치 기반 정보 수집 및 이용 동의",
        required: false,
        description: "내 주변 친구 추천 및 인근 매장 맞춤 마케팅을 위한 실시간 위치 수집 동의입니다.",
        impactScore: 10, // 해제 시 -10점
        detailInfo: "회원의 GPS 정보 및 IP 주소를 통해 현재 위치 정보를 주기적으로 전송받아 인근 서비스 제휴사 광고 및 지역 기반 네트워크 피드를 구성하는 데 사용합니다."
      }
    ],
    riskFactors: [
      {
        id: "sns-risk-1",
        title: "행동 데이터 국외 무단 공유",
        description: "사용자가 클릭한 포스트, 좋아요 흔적, 채팅 검색어 등이 국외 마케팅 에이전시로 암호화 없이 이전될 위험이 있습니다.",
        level: "danger",
        relatedTermId: "sns-opt-thirdparty",
        resolvedMessage: "제3자 제공 거부로 사용자의 행동 데이터 국외 이전 위험이 원천 차단되었습니다.",
        fullClauseText: "제7조 (개인정보의 이전 및 위탁) 회사는 서비스 안정성 및 맞춤형 피드 최적화 광고 알고리즘 분석을 위해 사용자의 모든 서비스 활동 로그(좋아요 흔적, 메신저 키워드, 페이지 체류 시간 등)를 전 세계 다국적 광고 제휴 에이전시 및 국외 마케팅 대행 파트너 사에게 무단 및 암호화 없이 이전 및 제공할 수 있으며, 회원은 본 약관 동의로써 이에 동의합니다.",
        dangerSegment: "사용자의 모든 서비스 활동 로그(좋아요 흔적, 메신저 키워드, 페이지 체류 시간 등)를 전 세계 다국적 광고 제휴 에이전시 및 국외 마케팅 대행 파트너 사에게 무단 및 암호화 없이 이전 및 제공할 수 있으며",
        aiAnalysisComment: "사용자가 남기는 모든 민감한 활동 기록(클릭 경로, 채팅 키워드 등)이 국외 광고 연합체에게 무제한 전송된다는 무서운 조항입니다. 정보 주체의 관심사나 사생활이 데이터 분석용으로 도용 및 영구 프로파일링 될 우려가 큽니다.",
        remedyActionTip: "회원 가입 폼에서 '[선택] 개인정보 국외 이전 및 제3자 제공 동의' 체크박스를 즉시 해제하시면 행동 데이터의 상업 목적 유출을 법적으로 원천 차단합니다."
      },
      {
        id: "sns-risk-2",
        title: "실시간 위치 추적 및 광고 악용",
        description: "앱이 백그라운드에 있을 때도 GPS 좌표를 수집하여 방문하는 장소에 따른 표적 광고에 활용할 위험이 있습니다.",
        level: "warning",
        relatedTermId: "sns-opt-location",
        resolvedMessage: "위치 수집 거부로 사용자의 이동 동선 노출 및 실시간 추적 우려가 해소되었습니다.",
        fullClauseText: "제12조 (위치정보의 수집) 당사는 실시간 인근 네트워크 친구 매칭 및 위치 특화 제휴 할인 광고 서비스의 제공을 위하여 사용자의 GPS 모듈 신호 및 기지국 IP 주소를 주기적으로 백서버로 수집합니다. 특히 앱이 활성화되어 있지 않은 백그라운드 상태나 기기가 꺼지지 않은 모든 작동 상태에서도 위치 정보 조회가 무작동으로 상시 백그라운드 구동될 수 있습니다.",
        dangerSegment: "앱이 활성화되어 있지 않은 백그라운드 상태나 기기가 꺼지지 않은 모든 작동 상태에서도 위치 정보 조회가 무작동으로 상시 백그라운드 구동될 수 있습니다",
        aiAnalysisComment: "어플리케이션을 적극적으로 사용하지 않는 오프라인 일상 시간에도 GPS 좌표가 상시 수집되어 기록된다는 뜻입니다. 방문지 목록이나 물리적 행동 동선 정보가 고스란히 유출될 수 있습니다.",
        remedyActionTip: "가입 폼에서 '[선택] 위치 기반 정보 수집 및 이용 동의' 체크를 해제하시면 상시 위치 트래킹 엔진을 격리시킬 수 있습니다."
      },
      {
        id: "sns-risk-3",
        title: "무차별 광고성 스팸 노출",
        description: "개인 프로필 분석을 기반으로 하루 10회 이상의 맞춤 타겟 이메일과 푸시 알림이 발송될 수 있습니다.",
        level: "warning",
        relatedTermId: "sns-opt-marketing",
        resolvedMessage: "마케팅 활용 동의를 해제하여 불필요한 스팸 및 타겟 마케팅 알림이 차단되었습니다.",
        fullClauseText: "제9조 (광고 전송) 회사는 마케팅 및 광고 수집 정보에 동의한 회원에 대하여 서비스 이용에 부합하는 타겟 메일링, 문자 스팸, 일일 10회 이상의 푸시 마케팅 알림 등 다채로운 스폰서 광고 매체를 무제한 발송할 수 있으며, 이로 인해 통신 요금이 청구될 수 있습니다.",
        dangerSegment: "일일 10회 이상의 푸시 마케팅 알림 등 다채로운 스폰서 광고 매체를 무제한 발송할 수 있으며",
        aiAnalysisComment: "서버가 사용자의 행동 성향을 판독하여 하루에도 몇 번씩 원하지 않는 스폰서 알림이나 이메일 광고 폭탄을 유발할 수 있습니다. 쾌적한 모바일 사용 환경을 심각하게 훼손할 수 있는 양식입니다.",
        remedyActionTip: "가입 폼에서 '[선택] 광고성 정보 수신 및 마케팅 활용 동의'의 동의 체크를 꺼두시면 광고 스팸이 오지 않습니다."
      }
    ],
    baseSummary: [
      "서비스 가입 즉시 대부분의 개인 행동 데이터(좋아요, 검색)가 수집됩니다.",
      "마케팅 선택 약관 동의 시, 해외 다수 파트너사에게 프로필 데이터가 공유되어 맞춤형 스폰서 광고에 노출됩니다.",
      "위치 기반 동의 시, 실시간 GPS 및 IP 추적을 통해 물리적인 동선이 지속적으로 서버에 누적됩니다."
    ],
    collectionItems: [
      { name: "이메일 주소 및 계정 정보", required: true, type: "로그인용 필수", relatedTermId: "sns-req-privacy" },
      { name: "생년월일 및 성별", required: true, type: "프로필용 필수", relatedTermId: "sns-req-privacy" },
      { name: "웹 브라우저 쿠키 및 방문 정보", required: false, type: "마케팅용 선택", relatedTermId: "sns-opt-thirdparty" },
      { name: "앱 서비스 내 채팅 및 활동 로그", required: false, type: "빅데이터용 선택", relatedTermId: "sns-opt-thirdparty" },
      { name: "GPS 실시간 위치 좌표", required: false, type: "위치 서비스용 선택", relatedTermId: "sns-opt-location" },
      { name: "전화번호 및 기기 연락처 목록", required: false, type: "친구 매칭용 선택", relatedTermId: "sns-opt-marketing" }
    ]
  },
  {
    id: "shopping",
    title: "BuyEasy",
    category: "국내 대형 온라인 쇼핑몰",
    emoji: "🛍️",
    baseScore: 55, // 주의 (Yellow)
    terms: [
      {
        id: "shop-req-use",
        title: "[필수] BuyEasy 회원 약관 동의",
        required: true,
        description: "회원 등급 혜택, 주문 결제 및 배송을 위한 기본 이용 약관입니다.",
        impactScore: 15, // 해제 시 -15점
        detailInfo: "본 약관은 회원이 쇼핑몰에서 상품을 주문하고 결제하며 배송 처리를 받는 과정의 권리와 의무를 규정합니다."
      },
      {
        id: "shop-req-privacy",
        title: "[필수] 필수 개인정보 수집 및 배송 대행 동의",
        required: true,
        description: "결제 완료 후 상품을 배송지 주소로 송부하기 위한 필수 동의입니다.",
        impactScore: 10, // 해제 시 -10점
        detailInfo: "회사는 구매 완료 시 원활한 배송 서비스 제공을 위해 구매자의 성명, 연락처, 주소를 판매자 및 택배업체에 제공합니다."
      },
      {
        id: "shop-opt-marketing",
        title: "[선택] 마케팅 광고 및 이벤트 수신 동의",
        required: false,
        description: "이벤트 특가 쿠폰 발송 및 맞춤형 상품 추천 푸시 알림 수신 동의입니다.",
        impactScore: 12, // 해제 시 -12점
        detailInfo: "회원은 당사가 제공하는 할인 쿠폰 알림, 타임세일 이벤트 메일 및 SMS 메시지를 선택적으로 수신할 수 있습니다."
      },
      {
        id: "shop-opt-affiliate",
        title: "[선택] 제휴 제3자 제휴 카드사 정보 제공 동의",
        required: false,
        description: "간편결제 연동 및 포인트 추가 적립을 위한 제휴 카드사 데이터 전송 동의입니다.",
        impactScore: 18, // 해제 시 -18점
        detailInfo: "당사와 파트너십을 맺은 금융사 및 카드사에 회원의 구매 카테고리 선호도 데이터를 이전하여 특화 할인 혜택 매칭에 활용합니다."
      }
    ],
    riskFactors: [
      {
        id: "shop-risk-1",
        title: "제휴 금융사의 카드 가입 권유",
        description: "선호 구매 정보가 제휴 카드사로 넘어가, 연동 할인 카드 발급 광고 및 상담 전화를 받게 될 우려가 있습니다.",
        level: "warning",
        relatedTermId: "shop-opt-affiliate",
        resolvedMessage: "제휴사 동의를 차단하여 금융 제휴 카드의 표적 아웃바운드 텔레마케팅 가능성을 방지했습니다.",
        fullClauseText: "제14조 (제휴 서비스 활성화) 회사는 회원 맞춤형 혜택 정보 매칭을 위하여 BuyEasy 회원 중 제휴 제3자 동의를 마친 회원의 구매 빈도, 주소지 연령대, 선호 상품 카테고리를 당사 제휴 카드사에 전송합니다. 카드사는 이를 신용카드 발급 권유, 통합 보험 가입 텔레마케팅 아웃바운드 영업 목적으로 활용할 수 있습니다.",
        dangerSegment: "카드사는 이를 신용카드 발급 권유, 통합 보험 가입 텔레마케팅 아웃바운드 영업 목적으로 활용할 수 있습니다",
        aiAnalysisComment: "사용자의 동의 하에 금융 제휴사(카드, 보험)에 정보가 이전되어 대출이나 카드 가입 관련 원치 않는 홍보 전화(아웃바운드 TM) 폭탄을 받을 수 있게 됩니다.",
        remedyActionTip: "가입 폼에서 '[선택] 제휴 제3자 제휴 카드사 정보 제공 동의' 체크박스를 해제하시면 금융사로의 정보 전달이 거절되어 안심하실 수 있습니다."
      },
      {
        id: "shop-risk-2",
        title: "쇼핑 정보 기반 스팸 문자",
        description: "특가 상품 판매 유도를 위한 장바구니 리마인드 알림 및 일일 쿠폰 SMS 스팸이 잦아질 수 있습니다.",
        level: "warning",
        relatedTermId: "shop-opt-marketing",
        resolvedMessage: "광고 마케팅 수신 거부로 일일 쇼핑 알림 및 문자 스팸 유입 경로를 차단했습니다.",
        fullClauseText: "제18조 (이벤트 정보 수신) BuyEasy는 회원의 마케팅 광고 동의를 활용하여 장바구니에 담아둔 상품의 할인 기한 리마인드, 관심 브랜드의 일일 타임세일 관련 광고 메일 및 타겟 단문 메시지(SMS)를 24시간 동안 수시로 발송할 수 있습니다.",
        dangerSegment: "타겟 단문 메시지(SMS)를 24시간 동안 수시로 발송할 수 있습니다",
        aiAnalysisComment: "할인 기한 알림이나 장바구니 리마인드라는 핑계로, 사실상 24시간 내내 실시간 문자나 광고 메세지를 사용자 핸드폰에 누적 전송하게 유도하는 악용 여지가 있습니다.",
        remedyActionTip: "가입 폼에서 '[선택] 마케팅 광고 및 이벤트 수신 동의'를 끄고 가입하시면 필수 영수증 안내 문자 외의 일체 광고 문자가 오지 않습니다."
      }
    ],
    baseSummary: [
      "국내 전자상거래법에 근거한 비교적 안전한 약관 체계를 유지하고 있습니다.",
      "제3자 제휴 정보 제공 동의 시, 제휴 금융사의 신용카드 가입 마케팅 대상자로 분류될 수 있습니다.",
      "선택 약관을 해제할 경우 배송 및 결제 본연의 기능만 안전하게 보장받습니다."
    ],
    collectionItems: [
      { name: "수령인 성명, 배송 주소, 전화번호", required: true, type: "배송 처리용 필수", relatedTermId: "shop-req-privacy" },
      { name: "신용카드번호 및 결제 인증 정보", required: true, type: "결제용 필수", relatedTermId: "shop-req-privacy" },
      { name: "구매 이력 및 자주 본 카테고리 데이터", required: false, type: "맞춤 쇼핑용 선택", relatedTermId: "shop-opt-affiliate" },
      { name: "SMS 및 이메일 수신 여부", required: false, type: "이벤트 광고용 선택", relatedTermId: "shop-opt-marketing" }
    ]
  },
  {
    id: "finance",
    title: "SecurePay",
    category: "국내 1금융권 기반 간편결제 서비스",
    emoji: "🛡️",
    baseScore: 15, // 안전 (Green)
    terms: [
      {
        id: "fin-req-use",
        title: "[필수] 전자금융거래 기본 약관 동의",
        required: true,
        description: "안전하고 투명한 금융 거래 체계 이용을 위한 법적 필수 약관입니다.",
        impactScore: 5, // 해제 시 -5점
        detailInfo: "본 약관은 여신금융협회 및 금융위원회 규정에 따라 전자금융거래의 안정성과 신뢰성을 확보하는 데 목적이 있습니다."
      },
      {
        id: "fin-req-identity",
        title: "[필수] 본인 확인 및 신용 정보 조회 동의",
        required: true,
        description: "본인 거래 보장 및 비대면 계좌 연동을 위한 필수 본인 인증 동의입니다.",
        impactScore: 5, // 해제 시 -5점
        detailInfo: "주민등록번호 및 휴대폰 본인 인증 등을 통해 타인의 도용을 방지하고 본인 명의 계좌 연동만을 허용하기 위한 개인식별정보 조회 프로세스입니다."
      },
      {
        id: "fin-opt-benefit",
        title: "[선택] 자산 관리 및 자산 추천 혜택 알림 동의",
        required: false,
        description: "카드 혜택 정렬 및 계좌 잔액 모니터링 관련 유용한 금융 팁 알림 동의입니다.",
        impactScore: 5, // 해제 시 -5점
        detailInfo: "회원이 동의할 시 주기적인 연동 자산의 통합 리포트를 발급하고, 소비 패턴을 기반으로 유용한 금융 상식을 알려주는 비마케팅성 혜택 안내입니다."
      }
    ],
    riskFactors: [
      {
        id: "fin-risk-1",
        title: "개인 금융 데이터 모니터링",
        description: "자산 관리 리포트 제공을 위해 계좌 잔액 변동 추이가 안전하게 분석되지만, 민감한 개인 금융 현황이 서비스 데이터베이스에 일시적으로 축적됩니다.",
        level: "safe",
        relatedTermId: "fin-opt-benefit",
        resolvedMessage: "자산 관리 알림 해제로 계좌 모니터링 분석 및 관련 DB 누적 가능성을 원천 차단했습니다.",
        fullClauseText: "제5조 (자산 현황 정보 활용) SecurePay는 자산 관리 혜택 및 소비 가이드 기능을 연동한 사용자에 한하여 연동된 전 은행 잔고 추이, 실시간 소비 대행 내역, 변동 금리 상환 상태를 지속적으로 모니터링하고 분석용 데이터베이스에 저장합니다.",
        dangerSegment: "은행 잔고 추이, 실시간 소비 대행 내역, 변동 금리 상환 상태를 지속적으로 모니터링하고 분석용 데이터베이스에 저장",
        aiAnalysisComment: "금융 자산 관리 추천을 제공하기 위한 목적으로, 모든 수입/지출 내역과 실시간 계좌 잔고 데이터를 주기적으로 감시하고 DB에 로깅하는 개인 자산 모니터링 현상이 유발됩니다.",
        remedyActionTip: "가입 폼에서 '[선택] 자산 관리 및 자산 추천 혜택 알림 동의' 체크박스를 끄고 가입하시면 모니터링 수집이 정지되어 안전합니다."
      }
    ],
    baseSummary: [
      "금융 보안 규정 및 가이드라인을 엄격히 준수하여 불필요한 제3자 제공이 일체 없습니다.",
      "마케팅 활용 범위가 매우 제한적이며, 필수 수집 정보 역시 금융 거래를 위한 필수 데이터에만 한정됩니다.",
      "1차 MVP 시나리오 중 가장 이상적이고 안전한 정보 보호 정책 모델을 갖고 있습니다."
    ],
    collectionItems: [
      { name: "CI/DI 본인 인증 고유식별 값", required: true, type: "본인 인증용 필수", relatedTermId: "fin-req-identity" },
      { name: "연동 계좌번호 및 은행 식별 정보", required: true, type: "송금/결제용 필수", relatedTermId: "fin-req-identity" },
      { name: "통합 계좌 잔액 및 자산 변동 정보", required: false, type: "자산 관리 추천용 선택", relatedTermId: "fin-opt-benefit" }
    ]
  }
];
