"use client";

import React, { useState, useEffect } from "react";
import { 
  SCENARIOS, 
  Scenario, 
  Term, 
  RiskFactor, 
  CollectionItem 
} from "./data";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  ChevronRight, 
  X, 
  RefreshCw, 
  Info, 
  Smartphone, 
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Lock,
  ArrowLeft
} from "lucide-react";

export default function Home() {
  // 1. 현재 활성화된 시나리오 관리
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  
  // 2. 동의한 약관 ID 목록 관리 (각 시나리오의 약관 상태)
  const [agreedTermIds, setAgreedTermIds] = useState<Record<string, boolean>>({});

  // 3. 바텀 시트 열림 상태 (가상 폰 내부에서 약관 동의 팝업)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  
  // 4. 가상 가입 완료 상태
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  // 5. 약관 세부정보 모달에 노출할 약관 객체
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);

  // 시나리오 변경 시 초기 세팅
  useEffect(() => {
    // 기본적으로 모든 약관(필수 및 선택)이 동의된 상태에서 시작하여 위험도를 보여줌
    const initialAgreed: Record<string, boolean> = {};
    currentScenario.terms.forEach(term => {
      initialAgreed[term.id] = true;
    });
    setAgreedTermIds(initialAgreed);
    setIsBottomSheetOpen(true);
    setIsSignupComplete(false);
    setDetailTerm(null);
  }, [currentScenario]);

  // 체크박스 클릭 핸들러
  const handleTermToggle = (termId: string) => {
    // 필수 약관은 체크 해제 불가하도록 처리 가능하나, 시뮬레이션을 위해 필수 약관은 해제 불가능하게 하거나 경고
    const term = currentScenario.terms.find(t => t.id === termId);
    if (!term) return;
    
    if (term.required && agreedTermIds[termId]) {
      alert("필수 약관은 가입을 위해 반드시 동의해야 합니다.");
      return;
    }

    setAgreedTermIds(prev => ({
      ...prev,
      [termId]: !prev[termId]
    }));
  };

  // 전체 동의 토글 핸들러
  const handleSelectAll = () => {
    const allChecked = currentScenario.terms.every(term => agreedTermIds[term.id]);
    const nextAgreed: Record<string, boolean> = {};
    
    currentScenario.terms.forEach(term => {
      // 이미 모두 동의되어 있다면 필수만 남기고 선택은 해제, 그렇지 않다면 전부 동의
      if (allChecked) {
        nextAgreed[term.id] = term.required; // 필수만 true, 선택은 false
      } else {
        nextAgreed[term.id] = true; // 전부 true
      }
    });
    setAgreedTermIds(nextAgreed);
  };

  // 실시간 위험 점수 계산 로직
  const calculateScore = () => {
    let score = currentScenario.baseScore;
    currentScenario.terms.forEach(term => {
      // 선택 약관이 동의 해제(false)되었을 때 그 영향 점수만큼 차감
      if (!term.required && !agreedTermIds[term.id]) {
        score -= term.impactScore;
      }
    });
    return Math.max(0, score);
  };

  const currentScore = calculateScore();

  // 점수에 따른 위험 등급 분석
  const getRiskLevel = (score: number) => {
    if (score >= 71) return { label: "위험", color: "text-red-danger", bg: "bg-red-danger-light", border: "border-red-danger/20", fill: "#F04438", icon: ShieldAlert };
    if (score >= 36) return { label: "주의", color: "text-yellow-warn", bg: "bg-yellow-warn-light", border: "border-yellow-warn/20", fill: "#F79009", icon: AlertTriangle };
    return { label: "안전", color: "text-green-safe", bg: "bg-green-safe-light", border: "border-green-safe/20", fill: "#12B76A", icon: ShieldCheck };
  };

  const riskInfo = getRiskLevel(currentScore);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* 1. 상단 GNB (GuardTerms 로고) */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-toss flex items-center justify-center text-white font-bold text-lg">
              G
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900">GuardTerms</span>
              <span className="text-xs text-blue-toss font-semibold ml-2 bg-blue-toss-light px-1.5 py-0.5 rounded-sm">1차 MVP 데모</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            약관 요약 및 개인정보 탈취 위험 진단 서비스
          </div>
        </div>
      </header>

      {/* 2. 메인 바디 컨테이너 */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* 안내 배너 */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-lg text-gray-900">💡 약관 동의 조절에 따른 위험도 시뮬레이션</h1>
            <p className="text-sm text-gray-700">
              상단 탭에서 가상 서비스 시나리오를 고르고, 왼쪽 스마트폰 프레임 내부에서 <b>선택 약관을 끄고 켜보세요</b>.
              오른쪽 리포트에 위험 요소와 개인정보 수집 목록이 실시간으로 동기화됩니다.
            </p>
          </div>
          <button 
            onClick={() => {
              // 초기화
              const initialAgreed: Record<string, boolean> = {};
              currentScenario.terms.forEach(term => {
                initialAgreed[term.id] = true;
              });
              setAgreedTermIds(initialAgreed);
              setIsBottomSheetOpen(true);
              setIsSignupComplete(false);
            }} 
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={14} />
            상태 초기화
          </button>
        </div>

        {/* 시나리오 선택기 */}
        <div className="flex bg-gray-200/60 p-1.5 rounded-2xl gap-1">
          {SCENARIOS.map((sc) => {
            const isActive = currentScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setCurrentScenario(sc)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                  isActive 
                    ? "bg-white text-blue-toss shadow-xs" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <span className="text-xl">{sc.emoji}</span>
                <span className="hidden sm:inline">{sc.title}</span>
                <span className="text-xs font-normal text-gray-400">({sc.category.split(" ")[0]})</span>
              </button>
            );
          })}
        </div>

        {/* 메인 레이아웃 (좌: 가상폰 시뮬레이터, 우: GuardTerms 대시보드) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* [좌] 가상폰 시뮬레이터 */}
          <section className="lg:col-span-5 flex flex-col items-center">
            <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
              <Smartphone size={12} /> 가상 서비스 가입 시나리오 폰
            </span>

            {/* 스마트폰 프레임 */}
            <div className="w-full max-w-[360px] bg-white border-[8px] border-gray-900 rounded-[44px] shadow-2xl relative overflow-hidden aspect-[9/19] flex flex-col">
              
              {/* 폰 상단 상태바 (iOS 스타일) */}
              <div className="h-10 bg-white px-6 flex items-center justify-between text-[11px] font-bold text-gray-900 select-none z-10">
                <span>1:32</span>
                {/* 노치 디자인 구멍 */}
                <div className="w-24 h-4 bg-gray-900 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
                <div className="flex items-center gap-1.5">
                  <span>SKT</span>
                  <div className="w-4 h-2 bg-gray-900 rounded-xs"></div>
                </div>
              </div>

              {/* 가상 앱 콘텐츠 영역 */}
              <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-white px-6 pb-6 pt-2">
                {/* 가상 서비스 탑 헤더 */}
                <div className="flex items-center py-2 mb-6">
                  <ArrowLeft size={20} className="text-gray-900 cursor-pointer" />
                  <span className="ml-4 font-bold text-sm text-gray-500">{currentScenario.category}</span>
                </div>

                {!isSignupComplete ? (
                  /* 가입 폼 화면 */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                          {currentScenario.title}에<br />
                          가입을 환영합니다
                        </h2>
                        <p className="text-xs text-gray-700">
                          간단한 이메일 인증으로 가입할 수 있어요.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">이메일 주소</label>
                          <input 
                            type="email" 
                            placeholder="example@email.com" 
                            disabled
                            value={currentScenario.id === "sns" ? "designer@toss.im" : "buyer@easy.co.kr"}
                            className="w-full bg-gray-150 border-0 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:ring-2 focus:ring-blue-toss"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">비밀번호</label>
                          <input 
                            type="password" 
                            value="••••••••••••" 
                            disabled
                            className="w-full bg-gray-150 border-0 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-toss"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      {/* GuardTerms 요약 미리보기 플로팅 카드 */}
                      <div className="bg-blue-toss-light/70 border border-blue-toss/10 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ backgroundColor: riskInfo.fill }}>
                            <riskInfo.icon size={18} className="text-white animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-toss">GuardTerms 분석 진단</p>
                            <p className="text-xs font-bold text-gray-900">
                              위험 지수 <span className={riskInfo.color}>{currentScore}점</span> ({riskInfo.label})
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsBottomSheetOpen(true)}
                          className="bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-2xs transition-colors"
                        >
                          약관 분석 조절
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          const hasRequired = currentScenario.terms.filter(t => t.required).every(t => agreedTermIds[t.id]);
                          if (!hasRequired) {
                            alert("필수 약관에 동의하셔야 가입이 진행됩니다.");
                            setIsBottomSheetOpen(true);
                            return;
                          }
                          setIsSignupComplete(true);
                        }}
                        className="w-full bg-blue-toss text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-xs hover:bg-blue-toss-dark active:scale-[0.98]"
                      >
                        가입 완료하기
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 가입 완료 화면 */
                  <div className="flex-1 flex flex-col justify-between items-center py-10">
                    <div className="text-center space-y-6 flex-1 flex flex-col justify-center items-center">
                      <div className="w-20 h-20 bg-blue-toss-light rounded-full flex items-center justify-center text-blue-toss mb-2 shadow-inner">
                        <UserCheck size={40} className="animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">가입이 완료되었습니다!</h3>
                        <p className="text-xs text-gray-700 max-w-[240px] mx-auto leading-relaxed">
                          {currentScenario.title} 회원가입을 축하드립니다.<br />
                          GuardTerms 진단 결과 사용자님은 
                          <span className={`font-bold ml-1 ${riskInfo.color}`}>{currentScore}점 ({riskInfo.label})</span>의 위험도로 안전하게 개인정보 설정을 최적화하여 가입했습니다.
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsSignupComplete(false)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3.5 rounded-2xl text-sm transition-colors"
                    >
                      다시 동의 조절해보기
                    </button>
                  </div>
                )}

                {/* [TOSS STYLE] 약관 동의 바텀 시트 (BottomSheet) */}
                {isBottomSheetOpen && !isSignupComplete && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-20 flex flex-col justify-end transition-opacity duration-300">
                    
                    {/* 뒷배경 클릭 시 닫기 */}
                    <div className="absolute inset-0" onClick={() => setIsBottomSheetOpen(false)}></div>

                    {/* 바텀 시트 컨테이너 */}
                    <div className="bg-white rounded-t-[28px] max-h-[85%] overflow-hidden flex flex-col relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up">
                      
                      {/* 드래그 핸들러 목업 */}
                      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3 flex-shrink-0"></div>

                      <div className="px-6 pb-6 overflow-y-auto no-scrollbar flex-1 flex flex-col justify-between">
                        <div>
                          {/* 타이틀 영역 */}
                          <div className="mb-6 space-y-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-snug">
                              {currentScenario.title} 가입을 위해<br />
                              동의가 필요해요
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium">
                              선택 약관을 해제하면 개인정보 탈취 지수가 하락합니다.
                            </p>
                          </div>

                          {/* 전체 동의 영역 */}
                          <div 
                            onClick={handleSelectAll}
                            className="flex items-center gap-3 py-4 border-b border-gray-100 cursor-pointer select-none"
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                              currentScenario.terms.every(term => agreedTermIds[term.id])
                                ? "bg-blue-toss border-blue-toss text-white"
                                : "border-gray-300 text-transparent"
                            }`}>
                              <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="font-bold text-sm text-gray-900">약관 전체 동의하기</span>
                          </div>

                          {/* 개별 약관 리스트 */}
                          <div className="py-4 space-y-4">
                            {currentScenario.terms.map((term) => {
                              const isChecked = !!agreedTermIds[term.id];
                              return (
                                <div key={term.id} className="flex items-center justify-between">
                                  <div 
                                    onClick={() => handleTermToggle(term.id)}
                                    className="flex items-center gap-3 flex-1 cursor-pointer select-none py-1"
                                  >
                                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${
                                      isChecked
                                        ? "bg-blue-toss border-blue-toss text-white"
                                        : "border-gray-200 text-transparent"
                                    }`}>
                                      <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-xs font-semibold ${term.required ? "text-gray-900" : "text-gray-700"}`}>
                                        {term.title}
                                      </span>
                                      <span className="text-[10px] text-gray-700 mt-0.5">
                                        {term.description}
                                      </span>
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => setDetailTerm(term)}
                                    className="text-gray-700 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 시트 하단 버튼 */}
                        <div className="pt-4 flex gap-2">
                          <button
                            onClick={() => {
                              const hasRequired = currentScenario.terms.filter(t => t.required).every(t => agreedTermIds[t.id]);
                              if (!hasRequired) {
                                alert("필수 약관에 동의하셔야 가입이 진행됩니다.");
                                return;
                              }
                              setIsBottomSheetOpen(false);
                            }}
                            className="flex-1 bg-blue-toss text-white font-bold py-4 rounded-xl text-sm transition-colors hover:bg-blue-toss-dark"
                          >
                            확인 완료
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 폰 하단 홈 바 목업 */}
              <div className="h-6 bg-white flex items-center justify-center select-none pb-2">
                <div className="w-32 h-1 bg-gray-900 rounded-full"></div>
              </div>
            </div>
          </section>

          {/* [우] GuardTerms AI 실시간 위협 대시보드 */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* 대시보드 타이틀 */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-toss bg-blue-toss-light px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Real-time Guard Report
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">GuardTerms AI 분석 보고서</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-700">분석 대상 서비스</p>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                  <span>{currentScenario.emoji}</span>
                  <span>{currentScenario.title}</span>
                </p>
              </div>
            </div>

            {/* 메인 리포트 카드 (위험도 점수 게이지 + 요약) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* 왼쪽: 게이지 차트 */}
              <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  
                  {/* 도넛형 SVG 게이지 */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="#F2F4F6"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke={riskInfo.fill}
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="408.4"
                      strokeDashoffset={408.4 - (408.4 * currentScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>

                  {/* 게이지 내부 점수 */}
                  <div className="absolute text-center space-y-0.5">
                    <p className="text-[11px] text-gray-700 font-bold tracking-wider">개인정보 탈취도</p>
                    <p className="text-4xl font-extrabold tracking-tight text-gray-900">{currentScore}</p>
                    <div className="flex justify-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                        {riskInfo.label} 등급
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-[10px] font-bold text-gray-500 mt-4">
                  <span className="flex items-center gap-1 text-green-safe"><span className="w-2 h-2 rounded-full bg-green-safe"></span> 안전 0~35</span>
                  <span className="flex items-center gap-1 text-yellow-warn"><span className="w-2 h-2 rounded-full bg-yellow-warn"></span> 주의 36~70</span>
                  <span className="flex items-center gap-1 text-red-danger"><span className="w-2 h-2 rounded-full bg-red-danger"></span> 위험 71~100</span>
                </div>
              </div>

              {/* 오른쪽: 실시간 AI 요약 */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield size={16} className="text-blue-toss" /> AI 실시간 3줄 정리
                </h3>
                <ul className="space-y-3">
                  {currentScenario.baseSummary.map((sum, index) => {
                    // SNS 시나리오의 경우 선택 정보 차단에 따른 대체 요약 렌더링
                    let displaySum = sum;
                    if (currentScenario.id === "sns") {
                      if (index === 1 && !agreedTermIds["sns-opt-thirdparty"]) {
                        displaySum = "✅ [보호됨] 국외 제3자 데이터 제공 거부로, 글로벌 에이전시로의 빅데이터 전송이 완전 중지되었습니다.";
                      }
                      if (index === 2 && !agreedTermIds["sns-opt-location"]) {
                        displaySum = "✅ [보호됨] 위치 권한을 배제하여 물리 동선 추적 및 장소 기반 광고 타겟팅에서 차단되었습니다.";
                      }
                    }
                    // 쇼핑몰 시나리오의 경우
                    if (currentScenario.id === "shopping") {
                      if (index === 1 && !agreedTermIds["shop-opt-affiliate"]) {
                        displaySum = "✅ [보호됨] 제휴 카드사 마케팅 제공을 거부하여 불필요한 금융 발급 권유 노출이 해소되었습니다.";
                      }
                    }

                    const isProtected = displaySum.startsWith("✅");

                    return (
                      <li key={index} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                        <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isProtected ? "bg-green-safe-light text-green-safe font-bold" : "bg-gray-100 text-gray-500 font-bold"
                        }`}>
                          {index + 1}
                        </span>
                        <span className={isProtected ? "text-green-safe font-semibold" : ""}>
                          {displaySum}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* 주요 감지된 위험 요소 카드 리스트 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-yellow-warn" /> 감지된 개인정보 위험 요소 ({
                  currentScenario.riskFactors.filter(rf => agreedTermIds[rf.relatedTermId]).length
                }건)
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {currentScenario.riskFactors.map((rf) => {
                  const isRiskActive = agreedTermIds[rf.relatedTermId]; // 위험이 여전히 활성화(체크되어 있음)
                  return (
                    <div 
                      key={rf.id} 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        isRiskActive 
                          ? "bg-white border-red-danger/10 shadow-xs" 
                          : "bg-green-safe-light/10 border-green-safe/10 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              !isRiskActive
                                ? "bg-green-safe-light text-green-safe"
                                : rf.level === "danger" 
                                  ? "bg-red-danger-light text-red-danger" 
                                  : "bg-yellow-warn-light text-yellow-warn"
                            }`}>
                              {!isRiskActive ? "해결됨" : rf.level === "danger" ? "심각" : "경고"}
                            </span>
                            <h4 className={`text-sm font-bold ${!isRiskActive ? "text-gray-500 line-through" : "text-gray-900"}`}>
                              {rf.title}
                            </h4>
                          </div>
                          <p className={`text-xs leading-relaxed ${!isRiskActive ? "text-gray-700" : "text-gray-700"}`}>
                            {isRiskActive ? rf.description : rf.resolvedMessage}
                          </p>
                        </div>
                        
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          !isRiskActive ? "bg-green-safe text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          {!isRiskActive ? <Check size={16} strokeWidth={3} /> : <Info size={16} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 수집 대상 개인정보 목록 */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Lock size={16} className="text-blue-toss" /> 수집되는 내 개인정보 목록 ({
                  currentScenario.collectionItems.filter(item => !item.relatedTermId || agreedTermIds[item.relatedTermId]).length
                }개)
              </h3>
              
              <div className="divide-y divide-gray-100">
                {currentScenario.collectionItems.map((item, idx) => {
                  const isCollected = !item.relatedTermId || agreedTermIds[item.relatedTermId];
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs transition-opacity duration-300">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${
                          !isCollected 
                            ? "bg-gray-300"
                            : item.required 
                              ? "bg-red-danger" 
                              : "bg-blue-toss"
                        }`}></span>
                        <span className={`font-semibold ${!isCollected ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {item.name}
                        </span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        !isCollected
                          ? "bg-gray-100 text-gray-400"
                          : item.required 
                            ? "bg-red-danger-light text-red-danger" 
                            : "bg-blue-toss-light text-blue-toss"
                      }`}>
                        {!isCollected ? "미수집" : item.required ? "필수 수집" : item.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>
        </div>
      </main>

      {/* 3. 푸터 */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-500">
        <p>© 2026 GuardTerms. All rights reserved.</p>
        <p className="mt-1">Toss Style UX Guide / Tailwind CSS v4 / Next.js 15+ 적용</p>
      </footer>

      {/* 4. 약관 상세보기 모달 (바텀시트에서 화살표 눌렀을 때 실행) */}
      {detailTerm && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">{detailTerm.title}</h3>
              <button 
                onClick={() => setDetailTerm(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  detailTerm.required ? "bg-red-danger-light text-red-danger" : "bg-blue-toss-light text-blue-toss"
                }`}>
                  {detailTerm.required ? "필수 약관" : "선택 약관"}
                </span>
                {!detailTerm.required && (
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-yellow-warn-light text-yellow-warn ml-2 rounded-md">
                    동의 해제 시 위험 점수 {detailTerm.impactScore}점 감소
                  </span>
                )}
              </div>
              
              <div className="space-y-2 bg-gray-100 p-4 rounded-2xl">
                <p className="text-xs font-bold text-gray-900">핵심 내용 설명</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {detailTerm.description}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-900">전체 약관 조항 원문 요약</p>
                <p className="text-[11px] text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {detailTerm.detailInfo}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setDetailTerm(null)}
                className="w-full bg-blue-toss text-white font-bold py-3.5 rounded-2xl text-sm transition-colors hover:bg-blue-toss-dark"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
