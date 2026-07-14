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
  AlertTriangle,
  Lock,
  ArrowLeft,
  Globe,
  Sparkles
} from "lucide-react";

export default function Home() {
  // 1. 현재 활성화된 시나리오 관리
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  
  // 2. 동의한 약관 ID 목록 관리
  const [agreedTermIds, setAgreedTermIds] = useState<Record<string, boolean>>({});

  // 3. 확장 프로그램 사이드바 오픈 여부
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 4. 가입 완료 상태
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  // 5. 약관 세부정보 모달에 노출할 약관 객체
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);

  // 6. 확장 프로그램 설치 안내 모달 상태
  const [showWelcomeMsg, setShowWelcomeMsg] = useState(true);

  // 시나리오 변경 시 초기 세팅
  useEffect(() => {
    const initialAgreed: Record<string, boolean> = {};
    currentScenario.terms.forEach(term => {
      initialAgreed[term.id] = true; // 기본적으로 모든 약관 동의로 시작하여 위험 감지를 체감하게 유도
    });
    setAgreedTermIds(initialAgreed);
    setIsSidebarOpen(true);
    setIsSignupComplete(false);
    setDetailTerm(null);
  }, [currentScenario]);

  // 체크박스 클릭 핸들러
  const handleTermToggle = (termId: string) => {
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
      if (allChecked) {
        nextAgreed[term.id] = term.required; // 필수만 남기고 선택은 해제
      } else {
        nextAgreed[term.id] = true;
      }
    });
    setAgreedTermIds(nextAgreed);
  };

  // 실시간 위험 점수 계산 로직
  const calculateScore = () => {
    let score = currentScenario.baseScore;
    currentScenario.terms.forEach(term => {
      if (!term.required && !agreedTermIds[term.id]) {
        score -= term.impactScore;
      }
    });
    return Math.max(0, score);
  };

  const currentScore = calculateScore();

  // 점수에 따른 위험 등급 분석
  const getRiskLevel = (score: number) => {
    if (score >= 71) return { label: "위험", color: "text-red-danger", bg: "bg-red-danger-light", border: "border-red-danger/25", fill: "#F04438", icon: ShieldAlert };
    if (score >= 36) return { label: "주의", color: "text-yellow-warn", bg: "bg-yellow-warn-light", border: "border-yellow-warn/25", fill: "#F79009", icon: AlertTriangle };
    return { label: "안전", color: "text-green-safe", bg: "bg-green-safe-light", border: "border-green-safe/25", fill: "#12B76A", icon: ShieldCheck };
  };

  const riskInfo = getRiskLevel(currentScore);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F2F4F6] relative overflow-x-hidden">
      
      {/* 1. 상단 GNB 및 시나리오 스위처 */}
      <header className="bg-white border-b border-gray-150 py-3 px-6 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-toss flex items-center justify-center text-white shadow-xs">
              <Globe size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-gray-900 tracking-tight">GuardTerms</span>
                <span className="text-[10px] text-blue-toss font-bold bg-blue-toss-light px-2 py-0.5 rounded-md">
                  Extension Prototype
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">크롬 확장 프로그램 시뮬레이터</p>
            </div>
          </div>

          {/* 시나리오 전환기 */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto max-w-md">
            {SCENARIOS.map((sc) => {
              const isActive = currentScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setCurrentScenario(sc)}
                  className={`flex-1 sm:flex-none py-1.5 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    isActive 
                      ? "bg-white text-blue-toss shadow-xs" 
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <span>{sc.emoji}</span>
                  <span>{sc.title}</span>
                </button>
              );
            })}
          </div>

          {/* 리셋 단추 */}
          <button 
            onClick={() => {
              const initialAgreed: Record<string, boolean> = {};
              currentScenario.terms.forEach(term => {
                initialAgreed[term.id] = true;
              });
              setAgreedTermIds(initialAgreed);
              setIsSignupComplete(false);
              setIsSidebarOpen(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={12} />
            시나리오 초기화
          </button>
        </div>
      </header>

      {/* 안내 알림 바 */}
      {showWelcomeMsg && (
        <div className="bg-blue-toss text-white py-2.5 px-6 relative z-30 flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="animate-spin" />
              <span>확장 프로그램 데모: 왼쪽 웹사이트에서 동의 체크를 해제하면, 우측 GuardTerms 확장 프로그램 패널이 실시간 분석합니다.</span>
            </span>
            <button onClick={() => setShowWelcomeMsg(false)} className="hover:opacity-75 pl-4">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. 메인 컨텐츠 영역 (좌측: 웹 페이지 전체 가입 양식, 우측: 확장 프로그램 사이드바) */}
      <div className={`flex-1 flex w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? "pr-[400px]" : "pr-4"}`}>
        
        {/* [좌] 가상 웹 회원가입 페이지 */}
        <main className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[680px]">
          
          {/* 가상 브라우저 상단 주소창 띠 */}
          <div className="bg-gray-50 border-b border-gray-150 py-3 px-6 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-danger/40 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-warn/40 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-safe/40 inline-block"></span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-xs text-gray-500 font-medium flex-1 max-w-lg flex items-center gap-1.5">
              <Lock size={12} className="text-green-safe" />
              <span>https://www.</span>
              <span className="text-gray-900 font-bold">{currentScenario.title.toLowerCase()}</span>
              <span>.com/signup</span>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold bg-gray-200 px-2 py-0.5 rounded-xs">가상 페이지</span>
          </div>

          {/* 가상 가입 화면 콘텐츠 */}
          <div className="flex-1 p-8 sm:p-12 max-w-2xl mx-auto w-full flex flex-col justify-between">
            {!isSignupComplete ? (
              <div className="space-y-8">
                
                {/* 헤더 */}
                <div className="space-y-3">
                  <span className="text-xl">{currentScenario.emoji}</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    {currentScenario.title} 회원가입
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    회원 정보를 기입하고 아래 약관에 동의하여 가입 절차를 마무리해 주세요.
                  </p>
                </div>

                {/* 계정 정보 폼 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">아이디 (이메일)</label>
                    <input 
                      type="email" 
                      placeholder="example@domain.com" 
                      disabled
                      value={currentScenario.id === "sns" ? "designer@toss.im" : "buyer@easy.co.kr"}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">비밀번호</label>
                    <input 
                      type="password" 
                      disabled
                      value="password1234"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 약관 동의 폼 영역 */}
                <div className="space-y-4 border border-gray-150 rounded-2xl p-5 bg-gray-50/50">
                  <div className="border-b border-gray-150 pb-4 mb-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900">이용 약관 및 필수/선택 동의</span>
                    <button 
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-blue-toss hover:text-blue-toss-dark transition-colors"
                    >
                      {currentScenario.terms.every(term => agreedTermIds[term.id]) ? "전체 해제" : "전체 동의"}
                    </button>
                  </div>

                  {/* 약관 리스트 */}
                  <div className="space-y-3.5">
                    {currentScenario.terms.map((term) => {
                      const isChecked = !!agreedTermIds[term.id];
                      return (
                        <div key={term.id} className="flex items-center justify-between bg-white border border-gray-150 rounded-xl p-3.5 shadow-2xs">
                          <div 
                            onClick={() => handleTermToggle(term.id)}
                            className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                          >
                            <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border mt-0.5 transition-all ${
                              isChecked
                                ? "bg-blue-toss border-blue-toss text-white"
                                : "border-gray-200 text-transparent"
                            }`}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold ${term.required ? "text-gray-900" : "text-gray-700"}`}>
                                  {term.title}
                                </span>
                                {term.required ? (
                                  <span className="text-[9px] font-bold bg-red-danger-light text-red-danger px-1 rounded-sm">필수</span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-gray-200 text-gray-700 px-1 rounded-sm">선택</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-700 mt-1">
                                {term.description}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setDetailTerm(term)}
                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <span>약관 보기</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 가입 버튼 */}
                <button
                  onClick={() => {
                    const hasRequired = currentScenario.terms.filter(t => t.required).every(t => agreedTermIds[t.id]);
                    if (!hasRequired) {
                      alert("가입하려면 모든 필수 약관에 동의하셔야 합니다.");
                      return;
                    }
                    setIsSignupComplete(true);
                  }}
                  className="w-full bg-blue-toss hover:bg-blue-toss-dark text-white font-extrabold py-4 rounded-xl text-sm transition-all shadow-xs active:scale-[0.99] select-none"
                >
                  동의하고 회원가입 완료
                </button>
              </div>
            ) : (
              /* 가입 완료 화면 */
              <div className="flex-1 flex flex-col justify-between items-center py-12">
                <div className="text-center space-y-6 flex-1 flex flex-col justify-center items-center">
                  <div className="w-20 h-20 bg-blue-toss-light rounded-full flex items-center justify-center text-blue-toss mb-2 shadow-inner">
                    <Check size={40} className="animate-bounce" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-extrabold text-gray-900">{currentScenario.title} 가입 성공</h3>
                    <p className="text-sm text-gray-700 max-w-sm mx-auto leading-relaxed">
                      회원 등록에 성공했습니다!<br />
                      우측 **GuardTerms Extension** 패널을 보시면 사용자님의 최종 정보 보호 등급이 
                      <span className={`font-bold ml-1 ${riskInfo.color}`}>{currentScore}점 ({riskInfo.label})</span> 상태로 맞춤 가입된 것을 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSignupComplete(false)}
                  className="w-full max-w-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3.5 rounded-xl text-xs transition-colors"
                >
                  가입 화면으로 다시 돌아가기
                </button>
              </div>
            )}
          </div>
        </main>

        {/* [우] Chrome Extension Sidebar (고정 사이드 패널) */}
        <aside className={`w-[380px] h-full fixed top-[69px] right-0 bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out z-30 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          
          {/* 사이드바 헤더 */}
          <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-toss" />
              <span className="font-extrabold text-xs text-gray-900 tracking-tight uppercase">GuardTerms Analyzer</span>
            </div>
            
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-700 hover:bg-gray-200 p-1 rounded-lg transition-colors"
              title="사이드바 숨기기"
            >
              <X size={16} />
            </button>
          </div>

          {/* 사이드바 본문 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-16">
            
            {/* 시나리오명 */}
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[10px] text-gray-700 font-bold">감지 대상 웹페이지</p>
                <p className="text-sm font-bold text-gray-900">{currentScenario.title}</p>
              </div>
              <span className="text-2xl">{currentScenario.emoji}</span>
            </div>

            {/* 게이지 및 점수 영역 */}
            <div className="bg-white border border-gray-150 rounded-2xl p-4 flex flex-col items-center justify-center">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="#F2F4F6"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke={riskInfo.fill}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="364.4"
                    strokeDashoffset={364.4 - (364.4 * currentScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                {/* 게이지 중앙 점수 */}
                <div className="absolute text-center">
                  <p className="text-[9px] text-gray-700 font-bold">보안 취약도</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tight">{currentScore}</p>
                  <div className="flex justify-center mt-0.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                      {riskInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* 신호등 가이드 */}
              <div className="flex gap-3 text-[9px] font-bold text-gray-500 mt-2">
                <span className="flex items-center gap-1 text-green-safe"><span className="w-1.5 h-1.5 rounded-full bg-green-safe"></span> 안전</span>
                <span className="flex items-center gap-1 text-yellow-warn"><span className="w-1.5 h-1.5 rounded-full bg-yellow-warn"></span> 주의</span>
                <span className="flex items-center gap-1 text-red-danger"><span className="w-1.5 h-1.5 rounded-full bg-red-danger"></span> 위험</span>
              </div>
            </div>

            {/* AI 3줄 요약 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Sparkles size={12} className="text-blue-toss animate-pulse" /> AI 실시간 3줄 요약
                </h4>
              </div>
              <ul className="space-y-2.5 bg-gray-50 border border-gray-150 p-3.5 rounded-2xl">
                {currentScenario.baseSummary.map((sum, index) => {
                  let displaySum = sum;
                  if (currentScenario.id === "sns") {
                    if (index === 1 && !agreedTermIds["sns-opt-thirdparty"]) {
                      displaySum = "🛡️ [차단됨] 국외 제3자 정보 제공이 거부되어 마케팅 데이터 유출 위험이 방지되었습니다.";
                    }
                    if (index === 2 && !agreedTermIds["sns-opt-location"]) {
                      displaySum = "🛡️ [차단됨] 위치 권한 배제로 동선 추적 광고 활용 경로가 폐쇄되었습니다.";
                    }
                  }
                  if (currentScenario.id === "shopping") {
                    if (index === 1 && !agreedTermIds["shop-opt-affiliate"]) {
                      displaySum = "🛡️ [차단됨] 제휴 카드 제공을 해제하여 부가 할인 발급 광고를 예방했습니다.";
                    }
                  }

                  const isProtected = displaySum.startsWith("🛡️");

                  return (
                    <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-gray-700">
                      <span className={`text-[9px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                        isProtected ? "bg-green-safe-light text-green-safe" : "bg-gray-200 text-gray-500"
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

            {/* 감지된 위협 분석 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <AlertTriangle size={12} className="text-yellow-warn" /> 위험 감지 조항 ({
                  currentScenario.riskFactors.filter(rf => agreedTermIds[rf.relatedTermId]).length
                }건)
              </h4>
              
              <div className="space-y-2">
                {currentScenario.riskFactors.map((rf) => {
                  const isActive = agreedTermIds[rf.relatedTermId];
                  return (
                    <div 
                      key={rf.id}
                      className={`p-3 rounded-xl border text-[11px] transition-all duration-200 ${
                        isActive 
                          ? "bg-white border-red-danger/15 shadow-2xs" 
                          : "bg-green-safe-light/5 border-green-safe/10 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs ${
                          !isActive
                            ? "bg-green-safe-light text-green-safe"
                            : rf.level === "danger" 
                              ? "bg-red-danger-light text-red-danger" 
                              : "bg-yellow-warn-light text-yellow-warn"
                        }`}>
                          {!isActive ? "보호됨" : rf.level === "danger" ? "심각" : "경고"}
                        </span>
                        <span className={`font-bold ${!isActive ? "text-gray-500 line-through" : "text-gray-950"}`}>
                          {rf.title}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-snug">
                        {isActive ? rf.description : rf.resolvedMessage}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 수집 데이터 내역 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <Lock size={12} className="text-blue-toss" /> 실시간 개인정보 수집 현황 ({
                  currentScenario.collectionItems.filter(item => !item.relatedTermId || agreedTermIds[item.relatedTermId]).length
                }개)
              </h4>

              <div className="bg-white border border-gray-150 rounded-2xl p-4 divide-y divide-gray-100 space-y-2.5">
                {currentScenario.collectionItems.map((item, idx) => {
                  const isCollected = !item.relatedTermId || agreedTermIds[item.relatedTermId];
                  return (
                    <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between text-[11px]">
                      <span className={`font-medium ${!isCollected ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {item.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs ${
                        !isCollected
                          ? "bg-gray-150 text-gray-400"
                          : item.required
                            ? "bg-red-danger-light text-red-danger"
                            : "bg-blue-toss-light text-blue-toss"
                      }`}>
                        {!isCollected ? "수집 안함" : item.required ? "필수" : "선택"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 사이드바 푸터 */}
          <div className="absolute bottom-0 left-0 right-0 py-3 bg-gray-50 border-t border-gray-150 text-center text-[10px] text-gray-500">
            GuardTerms Extension v1.0.0 (Toss Style)
          </div>
        </aside>
      </div>

      {/* 3. 우측 하단 플로팅 확장 프로그램 배지 버튼 (사이드바 닫혀있을 때) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-toss hover:bg-blue-toss-dark text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer z-50 animate-bounce"
          title="GuardTerms 확장 프로그램 열기"
        >
          <Shield size={24} />
          {/* 위협 인디케이터 배지 점 */}
          <span className={`absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold ${
            riskInfo.fill === "#12B76A" ? "bg-green-safe" : riskInfo.fill === "#F79009" ? "bg-yellow-warn" : "bg-red-danger"
          }`}>
            {currentScenario.riskFactors.filter(rf => agreedTermIds[rf.relatedTermId]).length}
          </span>
        </button>
      )}

      {/* 4. 약관 상세보기 팝업 모달 */}
      {detailTerm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900">{detailTerm.title}</h3>
              <button 
                onClick={() => setDetailTerm(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  detailTerm.required ? "bg-red-danger-light text-red-danger" : "bg-blue-toss-light text-blue-toss"
                }`}>
                  {detailTerm.required ? "필수 동의 조항" : "선택 동의 조항"}
                </span>
                {!detailTerm.required && (
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-yellow-warn-light text-yellow-warn ml-2 rounded-md">
                    동의 안 할 시 보안 위협도 {detailTerm.impactScore}점 차감
                  </span>
                )}
              </div>
              
              <div className="space-y-2 bg-gray-50 border border-gray-150 p-4 rounded-2xl">
                <p className="text-xs font-bold text-gray-900">독소 요약 정보</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {detailTerm.description}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-900">실제 약관 법적 원문 상세</p>
                <p className="text-[11px] text-gray-700 leading-relaxed bg-gray-50/30 p-4 rounded-xl border border-gray-100 font-medium">
                  {detailTerm.detailInfo}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-150">
              <button
                onClick={() => setDetailTerm(null)}
                className="w-full bg-blue-toss text-white font-bold py-3.5 rounded-xl text-sm transition-colors hover:bg-blue-toss-dark"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
