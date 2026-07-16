"use client";

import React, { useState, useEffect } from "react";
import { 
  SCENARIOS, 
  Scenario, 
  Term, 
  RiskFactor
} from "./data";
import { syncDcatAndDetectNewUrl } from "./actions/dcat";
import { analyzeTermWithLLM, LLMAnalysisResult } from "./actions/analyze";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  ChevronRight, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Lock,
  Search,
  HelpCircle,
  Smartphone,
  Monitor,
  Wifi,
  Battery
} from "lucide-react";

interface DcatWarning {
  title: string;
  url: string;
  reason: string;
}

// 0. 실시간 약관 심사 가상 시나리오 정의
const CUSTOM_SCENARIO: Scenario = {
  id: "custom",
  title: "실시간 약관 심사기",
  category: "임의의 모든 모바일 약관 심사",
  emoji: "🔍",
  brandColor: "#1E293B", // 다크 네이비 테마로 시각적 통일
  textColor: "text-white",
  baseScore: 15,
  terms: [],
  riskFactors: [],
  baseSummary: [
    "왼쪽 입력 폼에 분석하고자 하는 기업의 약관 본문을 복사해서 입력해 주세요.",
    "공공데이터 지침 DB 및 판례를 바탕으로 독소 조항 위협 수준을 정밀 스캔합니다.",
    "가입 전 치명적인 결제 정보 해외 유출이나 과도한 기기 권한 위험을 예방하세요."
  ],
  collectionItems: []
};

export default function Home() {
  // 1. 현재 활성화된 시나리오 관리
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  
  // 2. 동의한 약관 ID 목록 관리 (지연 초기화 함수를 제공하여 useEffect의 동기 setState 방지)
  const [agreedTermIds, setAgreedTermIds] = useState<Record<string, boolean>>(() => {
    const initialAgreed: Record<string, boolean> = {};
    SCENARIOS[0].terms.forEach(term => {
      initialAgreed[term.id] = true;
    });
    return initialAgreed;
  });
  
  // 3. 가입 완료 상태
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  // 4. 약관 세부정보 모달
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);

  // 5. 위험 조항 상세 현미경 분석 모달
  const [detailRisk, setDetailRisk] = useState<RiskFactor | null>(null);

  // 6. 위험도 점수 산정 기준 모달
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // 8. 임의 약관 직접 검사기 상태 관리
  const [customInputText, setCustomInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customAnalysisResult, setCustomAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [customAnalysisError, setCustomAnalysisError] = useState<string | null>(null);

  // 10. 직전 고정 시나리오 상태 백업 (뒤로가기 시 복구용)
  const [lastFixedScenario, setLastFixedScenario] = useState<Scenario>(SCENARIOS[0]);

  // 11. 모바일 앱 / 웹 브라우저 뷰 모드 상태 관리
  const [viewMode, setViewMode] = useState<'mobile' | 'web'>('mobile');

  // 9. LLM 실시간 API 분석 핸들러
  const handleLLMAnalysis = async () => {
    if (!customInputText.trim() || customInputText.trim().length < 5) {
      alert("분석할 약관 본문을 최소 5자 이상 기입해 주세요.");
      return;
    }
    setIsAnalyzing(true);
    setCustomAnalysisError(null);
    const result = await analyzeTermWithLLM(customInputText);
    if (result.success && result.data) {
      const analysis = result.data;
      setCustomAnalysisResult(analysis);
      
      // 동적 시나리오 생성 및 적용 (임의 약관 심사는 점수 고정식 보고서 형태로 terms를 빈 배열 지정)
      const updatedCustomScenario: Scenario = {
        id: "custom",
        title: "실시간 약관 심사기",
        category: "임의의 모든 모바일 약관 심사",
        emoji: "🔍",
        brandColor: "#1E293B",
        textColor: "text-white",
        baseScore: analysis.level === 'danger' ? 95 : analysis.level === 'warning' ? 60 : 15,
        terms: [],
        riskFactors: [
          {
            id: "custom-risk-factor",
            title: analysis.title,
            description: analysis.description,
            level: analysis.level,
            relatedTermId: "custom-opt-term",
            resolvedMessage: "동의 해제하여 감지된 위험 조항을 안전하게 차단하였습니다.",
            fullClauseText: analysis.fullClauseText,
            dangerSegment: analysis.dangerSegment,
            aiAnalysisComment: analysis.aiAnalysisComment,
            remedyActionTip: analysis.remedyActionTip
          }
        ],
        baseSummary: [
          `💡 분석 요약: ${analysis.description}`,
          `🎓 근거 분석: ${analysis.aiAnalysisComment}`,
          `📌 대처 팁: ${analysis.remedyActionTip}`
        ],
        collectionItems: [
          { name: analysis.dangerSegment || "결제 수단 및 기기 권한 정보", required: false, type: "분석 수집", relatedTermId: "custom-opt-term" }
        ]
      };

      setCurrentScenario(updatedCustomScenario);
      
      // 동의 체크리스트 리셋
      setAgreedTermIds({});
    } else {
      setCustomAnalysisError(result.error || "Gemini/Groq API 분석에 실패했습니다.");
    }
    setIsAnalyzing(false);
  };

  // 7. DCAT 동기화 및 신규 URL 경고 목록 관리
  const [dcatWarnings, setDcatWarnings] = useState<DcatWarning[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState<'REAL' | 'MOCK' | 'ERROR'>('MOCK');
  const [apiError, setApiError] = useState<string | null>(null);

  // 페이지 진입 시 DCAT API 호출 및 신규 URL 감시
  useEffect(() => {
    async function fetchDcatStatus() {
      setIsSyncing(true);
      const result = await syncDcatAndDetectNewUrl();
      if (result.mode) setSyncMode(result.mode);
      if (result.success && result.warnings && result.warnings.length > 0) {
        setDcatWarnings(result.warnings as DcatWarning[]);
        setApiError(null);
      } else if (!result.success) {
        setApiError(result.error || "알 수 없는 API 에러");
        setDcatWarnings(result.warnings as DcatWarning[]); // 에러 발생 시에도 fallback warnings 노출
      }
      setIsSyncing(false);
    }
    fetchDcatStatus();
  }, []);

  // 시나리오 클릭 스위칭 시 모든 상태를 한 트랜잭션에서 일괄 초기화하여 useEffect 린트 에러 해소
  const handleScenarioChange = (sc: Scenario) => {
    if (sc.id !== "custom") {
      setLastFixedScenario(sc);
    }
    setCurrentScenario(sc);
    const initialAgreed: Record<string, boolean> = {};
    sc.terms.forEach(term => {
      initialAgreed[term.id] = true;
    });
    setAgreedTermIds(initialAgreed);
    setIsSignupComplete(false);
    setDetailTerm(null);
    setDetailRisk(null);
    setShowCriteriaModal(false);
  };



  // 체크박스 클릭 핸들러 (모바일 약관 동의 토글)
  const handleTermToggle = (termId: string) => {
    const term = currentScenario.terms.find(t => t.id === termId);
    if (!term) return;

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
        nextAgreed[term.id] = false; // 필수/선택 상관없이 모두 해제
      } else {
        nextAgreed[term.id] = true;
      }
    });
    setAgreedTermIds(nextAgreed);
  };

  // 실시간 위험 점수 계산
  const calculateScore = () => {
    let score = currentScenario.baseScore;
    currentScenario.terms.forEach(term => {
      if (!agreedTermIds[term.id]) {
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

  // 독소 조항 형광펜 하이라이팅
  const renderHighlightedText = (fullText: string, highlightText: string) => {
    if (!highlightText) return <span>{fullText}</span>;
    const parts = fullText.split(highlightText);
    if (parts.length === 1) return <span>{fullText}</span>;

    return (
      <span className="leading-relaxed">
        {parts[0]}
        <span className="bg-red-danger/15 text-red-danger font-extrabold px-1 py-0.5 rounded-md border-b-2 border-red-danger border-dashed select-text">
          {highlightText}
        </span>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F2F4F6] relative overflow-x-hidden font-sans">
      
      {/* 1. GNB 및 시나리오 스위처 */}
      <header className="bg-white border-b border-gray-150 py-3.5 px-6 sticky top-0 z-45 shadow-3xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-toss flex items-center justify-center text-white shadow-xs">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-gray-900 tracking-tight">GuardTerms Mobile</span>
                <span className="text-[10px] text-blue-toss font-bold bg-blue-toss-light px-2.5 py-0.5 rounded-md">
                  App SDK Simulator
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold">실제 모바일 앱 약관 동의 시뮬레이터</p>
            </div>
          </div>

          {/* 앱 전환 스위처 */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto max-w-lg">
            {SCENARIOS.map((sc) => {
              const isActive = currentScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioChange(sc)}
                  className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-white text-blue-toss shadow-xs" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span>{sc.emoji}</span>
                  <span>{sc.title}</span>
                </button>
              );
            })}
            
            {/* 꿀딜아울렛과 실시간 약관 심사 사이의 시각적 구분선 및 간격 추가 */}
            <div className="w-[1.5px] h-4 bg-gray-250 mx-2.5 self-center hidden sm:block shrink-0"></div>

            {/* 🔍 실시간 약관 심사 탭 */}
            <button
              onClick={() => {
                setCustomAnalysisResult(null);
                setCustomAnalysisError(null);
                handleScenarioChange(CUSTOM_SCENARIO);
              }}
              className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                currentScenario.id === "custom"
                  ? "bg-slate-800 text-white shadow-xs" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>🔍</span>
              <span>실시간 약관 심사</span>
            </button>
          </div>

          {/* 우측 도구 영역 (초기화 버튼) */}
          <div className="flex items-center">
            {/* 초기화 버튼 */}
            <button 
              onClick={() => {
                const initialAgreed: Record<string, boolean> = {};
                currentScenario.terms.forEach(term => {
                  initialAgreed[term.id] = true;
                });
                setAgreedTermIds(initialAgreed);
                setIsSignupComplete(false);
                // 커스텀 AI 검사 초기화
                if (currentScenario.id === "custom") {
                  setCustomAnalysisResult(null);
                  setCustomInputText("");
                  setCustomAnalysisError(null);
                  setCurrentScenario(CUSTOM_SCENARIO);
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              동의 초기화
            </button>
          </div>
        </div>
      </header>

      {/* 안내 알림 바 */}
      <div className="bg-blue-toss text-white py-2.5 px-6 relative z-30 flex items-center text-xs font-semibold shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield size={14} />
            <span>모바일 디바이스 내부의 체크박스를 해제하면 우측 SDK 분석판에서 실시간으로 감점 및 등급이 갱신됩니다.</span>
          </span>
          <button 
            onClick={async () => {
              setIsSyncing(true);
              const result = await syncDcatAndDetectNewUrl();
              if (result.mode) setSyncMode(result.mode);
              if (result.success && result.warnings) {
                setDcatWarnings(result.warnings as DcatWarning[]);
                setApiError(null);
              } else if (!result.success) {
                setApiError(result.error || "알 수 없는 API 에러");
                setDcatWarnings(result.warnings as DcatWarning[]);
              }
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20 text-[10px] px-2.5 py-1 rounded-md font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? "동기화 중..." : "DCAT 수집 갱신"}
          </button>
        </div>
      </div>

      {/* 신규 감지된 OpenAPI URL 경고창 (DCAT 연계) */}
      {dcatWarnings.length > 0 && currentScenario.id === 'kkuldeal' ? (
        <div className="bg-red-50/90 border-b border-red-100 py-3 px-6 relative z-25 shadow-3xs animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-red-700">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs tracking-tight">🚨 위험 감지: 등록되지 않은 신규 API URL이 감지되었습니다.</span>
                  {syncMode === 'REAL' && (
                    <span className="text-[9px] bg-green-safe-light text-green-safe border border-green-safe/25 font-black px-2 py-0.5 rounded-full">
                      ✓ 실시간 공공 API 연동 모드
                    </span>
                  )}
                  {syncMode === 'MOCK' && (
                    <span className="text-[9px] bg-yellow-warn-light text-yellow-warn border border-yellow-warn/25 font-black px-2 py-0.5 rounded-full">
                      ⚠ API 키 미입력 (가상 시뮬레이션)
                    </span>
                  )}
                  {syncMode === 'ERROR' && (
                    <span className="text-[9px] bg-red-danger-light text-red-danger border border-red-danger/25 font-black px-2 py-0.5 rounded-full" title={apiError || ''}>
                      ✗ API 연동 에러 (호출 오류)
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-red-600/80 font-medium mt-0.5">
                  {syncMode === 'ERROR' 
                    ? `[API 오류 발생] ${apiError || '공공 API 호출 권한 또는 인증키 오류가 감지되었습니다. .env.local을 재확인하세요.'}` 
                    : '해당 URL을 통한 비인가 동의 수집 위험이 있으므로 정밀 보안 검토가 완료될 때까지 주의바랍니다.'
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dcatWarnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white border border-red-200/50 px-2.5 py-1 rounded-lg shadow-4xs text-[9px] font-semibold text-gray-700">
                  <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-md font-bold">UNVERIFIED</span>
                  <span className="truncate max-w-[180px]">{w.title}</span>
                  <a 
                    href={w.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-toss hover:underline ml-1 font-bold"
                  >
                    보기
                  </a>
                </div>
              ))}
              <button 
                onClick={() => setDcatWarnings([])}
                className="text-red-700 hover:bg-red-100/50 p-1 rounded-lg transition-colors cursor-pointer"
                title="경고 닫기"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 안전한 실서비스 시나리오들을 보고 있을 때 노출할 공공 안전망 검증 배너 */
        (syncMode === 'REAL' || syncMode === 'MOCK') && currentScenario.id !== 'custom' && (
          <div className="bg-green-50/90 border-b border-green-100 py-2.5 px-6 relative z-25 shadow-3xs animate-fade-in">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-green-800">
                <ShieldCheck size={16} className="text-green-600 shrink-0" />
                <span className="font-extrabold text-xs tracking-tight">
                  ✓ 공공 안전망 검증 완료: 해당 서비스의 도메인(WHOIS) 정보와 통신 규격이 안전하게 등록 승인된 상태입니다.
                </span>
              </div>
              <span className="text-[9px] bg-green-safe-light text-green-safe border border-green-safe/25 font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                SECURE
              </span>
            </div>
          </div>
        )
      )}

      {/* 2. 메인 화면 구성 (중앙: 가상 스마트폰 디바이스 목업, 우측: 분석기 SDK 대시보드) */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row justify-center items-start gap-8">
        
        {/* [좌/중앙] 가상 디바이스 목업 (모바일 프레임 / 웹 브라우저 프레임 스위칭) */}
        <div className={`transition-all duration-350 flex flex-col items-center py-4 ${
          viewMode === 'mobile' 
            ? "w-full lg:w-[380px] shrink-0" 
            : "flex-1 min-w-[320px] lg:max-w-3xl"
        }`}>
          {/* 기기 상단 뷰 모드 세그먼트 컨트롤 */}
          <div className="flex bg-gray-150 p-0.5 rounded-lg border border-gray-200/60 mb-3.5 select-none shrink-0 w-fit">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? "bg-white text-blue-toss shadow-3xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Smartphone size={11} />
              <span>모바일 앱 뷰</span>
            </button>
            <button
              onClick={() => setViewMode('web')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'web'
                  ? "bg-white text-blue-toss shadow-3xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Monitor size={11} />
              <span>웹 브라우저 뷰</span>
            </button>
          </div>

          <div className={`transition-all duration-350 overflow-hidden flex flex-col select-none bg-white ${
            viewMode === 'mobile'
              ? "relative w-[360px] h-[720px] border-[10px] border-gray-900 rounded-[50px] shadow-2xl shrink-0"
              : "relative w-full h-[720px] border border-gray-200 rounded-3xl shadow-xl"
          }`}>
            
            {/* 상단 기기 프레임 데코레이션 */}
            {viewMode === 'mobile' ? (
              /* 폰 상단 데코레이션 (다이내믹 아일랜드 / 수화기) */
              <div className="absolute top-0 left-0 right-0 h-9 bg-transparent z-40 flex justify-between items-center px-6">
                <span className="text-[11px] font-bold text-gray-600">16:19</span>
                <div className="w-[100px] h-5 bg-black rounded-full flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-800 absolute left-[138px]"></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Wifi size={11} strokeWidth={2.5} />
                  <Battery size={13} strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              /* 맥OS 스타일 웹 브라우저 헤더 데코레이션 (이모티콘 자제, 얇은 실선 위주) */
              <div className="h-9 bg-gray-50 border-b border-gray-150 px-4 flex items-center justify-between z-40 select-none shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                </div>
                <div className="bg-white border border-gray-200 text-gray-500 text-[10px] font-semibold py-0.5 px-4 rounded-md w-[320px] text-center truncate select-none shadow-3xs font-mono">
                  {currentScenario.id === "okcashbag" && "https://www.okcashbag.com/register"}
                  {currentScenario.id === "pass" && "https://www.passcert.co.kr/register"}
                  {currentScenario.id === "daiso" && "https://www.daisomall.co.kr/register"}
                  {currentScenario.id === "kkuldeal" && "https://www.gguldeal-outlet.co.kr/register"}
                  {currentScenario.id === "custom" && "https://guardterms.co.kr/analyze"}
                </div>
                <div className="w-12 shrink-0"></div>
              </div>
            )}

            {/* 디바이스 바디 콘텐츠 */}
            {!isSignupComplete ? (
              <div className={`flex-1 min-h-0 flex flex-col justify-between bg-white ${
                viewMode === 'mobile' ? 'pt-9' : 'pt-0'
              }`}>
                
                {/* 앱 상단 헤더 */}
                <div 
                  className="py-4.5 px-5 flex flex-col justify-center items-center shadow-xs shrink-0 relative"
                  style={{ backgroundColor: currentScenario.brandColor }}
                >
                  {/* 가상 뒤로가기 버튼 */}
                  {currentScenario.id === "custom" ? (
                    <button
                      onClick={() => {
                        if (customAnalysisResult) {
                          // 결과 화면이면 입력 폼으로 뒤로가기
                          setCustomAnalysisResult(null);
                          setCustomInputText("");
                          setCustomAnalysisError(null);
                          setCurrentScenario(CUSTOM_SCENARIO);
                        } else {
                          // 입력 폼 화면이면 직전 고정 시나리오로 완전히 복구
                          handleScenarioChange(lastFixedScenario);
                        }
                      }}
                      className="absolute left-3 text-xs font-black text-white hover:text-gray-200 cursor-pointer bg-transparent border-none p-1 flex items-center z-50 transition-colors"
                    >
                      〈 뒤로
                    </button>
                  ) : (
                    <span className="absolute left-4 text-xs font-bold text-white opacity-85">〈</span>
                  )}
                  <h3 className={`font-black text-sm tracking-widest ${currentScenario.textColor}`}>
                    {currentScenario.title}
                  </h3>
                  <p className={`text-[9px] opacity-75 font-semibold mt-0.5 ${currentScenario.textColor}`}>
                    {currentScenario.category}
                  </p>
                </div>

                {/* 약관 리스트 본문 (스크롤) */}
                {currentScenario.id === "custom" && !customAnalysisResult ? (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-gray-50/50">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                        <Search size={14} className="text-slate-700" /> 약관 정밀 심사 (지침 대조)
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        검사하고 싶은 서비스의 약관 텍스트(동의서 조항)를 아래에 입력하시면 실시간으로 규제 지침과 대조 분석합니다.
                      </p>
                    </div>

                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3.5 text-center h-[320px]">
                        <RefreshCw size={32} className="text-slate-800 animate-spin" />
                        <div>
                          <p className="text-xs font-black text-gray-800">지침 대조 정밀 심사 중...</p>
                          <p className="text-[9px] text-gray-400 mt-1 max-w-[220px] leading-normal mx-auto font-medium">
                            정부(PIPC, KISA, KFTC) 규제 지침 문서와 대조하여 악성 약관 및 유출 권한을 스캔하고 있습니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={customInputText}
                          onChange={(e) => setCustomInputText(e.target.value)}
                          placeholder="여기에 분석할 약관 문장을 입력 또는 복사-붙여넣기 하세요. (예: 가입을 위해 신용카드 비밀번호와 CVC를 중국 서버로 이전하고, 앱이 꺼진 동안에도 실시간 위치를 무단 수집합니다...)"
                          className="w-full h-[280px] p-3.5 text-[11px] bg-white border border-gray-250 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent font-sans leading-relaxed text-gray-800 shadow-inner"
                        />
                        {customAnalysisError && (
                          <div className="bg-red-50 text-red-700 text-[9px] p-3 rounded-xl font-extrabold border border-red-150 leading-normal">
                            ⚠️ {customAnalysisError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : currentScenario.id === "custom" && customAnalysisResult ? (
                  // 약관 분석 완료 후 보고서 뷰 (체크박스 해제 리스트가 아니며, 순수 결과 리포트 출력)
                  <div className="flex-1 overflow-y-auto p-5 space-y-4.5 no-scrollbar bg-gray-50/50">
                    <div className="space-y-1.5 pb-2 border-b border-gray-200">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Shield size={13} className="text-slate-800" /> 정밀 심사 판정 보고서
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold leading-normal">
                        공공데이터 지침과 연계 대조한 최종 판정 리포트입니다.
                      </p>
                    </div>

                    {/* 위험 등급 카드 */}
                    <div className={`border rounded-2xl p-4 shadow-3xs space-y-2 bg-white ${riskInfo.border}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 font-bold">보안 안전 등급</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                          {riskInfo.label} ({currentScore}점)
                        </span>
                      </div>
                      <h5 className="text-[11px] font-black text-gray-900 leading-snug mt-1">
                        ⚠️ {customAnalysisResult.title}
                      </h5>
                      <p className="text-[9.5px] text-gray-500 leading-normal font-medium">
                        {customAnalysisResult.description}
                      </p>
                    </div>

                    {/* 정밀 해설 카드 */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs space-y-2.5">
                      <span className="text-[9px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                        🔍 정밀 분석 및 지침 대조
                      </span>
                      <p className="text-[9.5px] text-gray-700 leading-relaxed font-sans font-medium">
                        {renderHighlightedText(customAnalysisResult.aiAnalysisComment, customAnalysisResult.dangerSegment)}
                      </p>
                    </div>

                    {/* 대처 방안 카드 */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs space-y-2.5">
                      <span className="text-[9px] text-green-safe font-bold bg-green-50 px-2 py-0.5 rounded-md inline-block">
                        📌 피해 예방 대처 수칙
                      </span>
                      <p className="text-[9.5px] text-gray-600 leading-relaxed font-medium">
                        {customAnalysisResult.remedyActionTip}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar bg-gray-50/50">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-gray-900">약관 동의 및 가입</h4>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        서비스 가입 및 이용을 위해 아래 약관 내용을 확인하고 동의해주시기 바랍니다.
                      </p>
                    </div>

                    {/* 전체 동의 컴포넌트 */}
                    {currentScenario.terms.length > 0 && (
                      <div 
                        onClick={handleSelectAll}
                        className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-3xs cursor-pointer active:scale-[0.99] transition-transform"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          currentScenario.terms.every(term => agreedTermIds[term.id])
                            ? "bg-blue-toss border-blue-toss text-white"
                            : "border-gray-200 text-transparent"
                        }`}>
                          <Check size={11} strokeWidth={3.5} />
                        </div>
                        <span className="text-[11px] font-black text-gray-900">약관 전체 동의 (선택 포함)</span>
                      </div>
                    )}

                    {/* 약관 리스트 */}
                    <div className="space-y-2.5">
                      {currentScenario.terms.map((term) => {
                        const isChecked = !!agreedTermIds[term.id];
                        return (
                          <div key={term.id} className="flex items-center justify-between bg-white border border-gray-150 rounded-xl p-3 shadow-3xs">
                            <div 
                              onClick={() => handleTermToggle(term.id)}
                              className="flex items-start gap-2.5 flex-1 cursor-pointer select-none"
                            >
                              <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border mt-0.5 transition-all ${
                                isChecked
                                  ? "bg-blue-toss border-blue-toss text-white"
                                  : "border-gray-200 text-transparent"
                              }`}>
                                <Check size={10} strokeWidth={3.5} />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-bold ${term.required ? "text-gray-900" : "text-gray-700"}`}>
                                    {term.title}
                                  </span>
                                  {term.required ? (
                                    <span className="text-[8px] font-bold bg-red-danger-light text-red-danger px-1 rounded-sm shrink-0 whitespace-nowrap">필수</span>
                                  ) : (
                                    <span className="text-[8px] font-bold bg-gray-200 text-gray-700 px-1 rounded-sm shrink-0 whitespace-nowrap">선택</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">
                                  {term.description}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => setDetailTerm(term)}
                              className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex items-center text-[9px] font-bold shrink-0"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        );
                      })}
                      
                      {currentScenario.id === "custom" && currentScenario.terms.length === 0 && (
                        <div className="text-center py-20 text-gray-400 text-[10px]">
                          분석 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 하단 고정 버튼 영역 */}
                <div className="p-4 bg-white border-t border-gray-150 shrink-0">
                  {currentScenario.id === "custom" && !customAnalysisResult ? (
                    <button
                      onClick={handleLLMAnalysis}
                      disabled={isAnalyzing}
                      className="w-full text-white font-extrabold py-3.5 rounded-xl text-[12px] transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 hover:opacity-95"
                      style={{ backgroundColor: currentScenario.brandColor }}
                    >
                      {isAnalyzing ? "대조 심사 중..." : "실시간 약관 심사 개시"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const hasRequired = currentScenario.terms.filter(t => t.required).every(t => agreedTermIds[t.id]);
                        if (!hasRequired) {
                          alert("가입하려면 모든 필수 약관에 동의하셔야 합니다.");
                          return;
                        }
                        setIsSignupComplete(true);
                      }}
                      className="w-full text-white font-extrabold py-3.5 rounded-xl text-[12px] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                      style={{ backgroundColor: currentScenario.brandColor }}
                    >
                      {currentScenario.id === "okcashbag" ? "동의하고 인증하기" : "동의하고 계속하기"}
                    </button>
                  )}
                </div>

              </div>
            ) : (
              /* 모바일 앱 가입 완료 화면 */
              <div className={`flex-1 flex flex-col justify-between items-center bg-white h-full p-6 ${
                viewMode === 'mobile' ? 'pt-9' : 'pt-4'
              }`}>
                <div className="text-center space-y-5 flex-1 flex flex-col justify-center items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white mb-2 shadow-inner" style={{ backgroundColor: currentScenario.brandColor }}>
                    <Check size={32} className="animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-gray-900">{currentScenario.title} 가입 성공</h3>
                    <p className="text-[10px] text-gray-600 max-w-[240px] mx-auto leading-relaxed">
                      모바일 가입이 성공적으로 완료되었습니다!<br />
                      우측 **GuardTerms SDK Analyzer**에서 최종 보안 스코어 
                      <span className={`font-black ml-1 ${riskInfo.color}`}>{currentScore}점 ({riskInfo.label})</span>를 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSignupComplete(false)}
                  className="w-full max-w-[200px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                >
                  가입 화면으로 돌아가기
                </button>
              </div>
            )}

            {/* 가상 아이폰 하단 바 */}
            {viewMode === 'mobile' && (
              <div className="absolute bottom-1.5 left-0 right-0 h-1 flex justify-center z-40">
                <span className="w-28 h-1 bg-gray-800 rounded-full"></span>
              </div>
            )}
          </div>
        </div>

        {/* [우] GuardTerms Mobile SDK Analyzer (분석기 대시보드) */}
        <aside className="w-full lg:w-[460px] bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col p-6 space-y-6">
          
          {/* 분석기 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-blue-toss" />
              <div>
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">GuardTerms SDK Dashboard</span>
                <p className="text-[9px] text-gray-500 font-semibold mt-0.5">실시간 모바일 데이터 노출 분석 엔진</p>
              </div>
            </div>
            <span className="text-[9px] text-green-safe font-black bg-green-safe-light px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              ● SDK CONNECTED
            </span>
          </div>

          {/* 시나리오명 */}
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
            <div>
              <p className="text-[9px] text-gray-500 font-bold">연동 모바일 디바이스 앱</p>
              <p className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                <span>{currentScenario.title}</span>
                <span className="text-[9px] font-bold px-2 py-0.2 rounded-md bg-gray-200 text-gray-700 font-sans">
                  {currentScenario.category}
                </span>
              </p>
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
              <div className="absolute text-center flex flex-col items-center">
                <button 
                  onClick={() => setShowCriteriaModal(true)}
                  className="text-[9px] text-gray-500 hover:text-blue-toss font-bold flex items-center gap-0.5 transition-colors cursor-pointer border-none bg-transparent p-0"
                  title="산정 기준 보기"
                >
                  <span>보안 취약도</span>
                  <HelpCircle size={10} />
                </button>
                <p className="text-3xl font-black text-gray-900 tracking-tight leading-none my-0.5">{currentScore}</p>
                <div className="flex justify-center mt-0.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                    {riskInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 신호등 가이드 */}
            <div className="flex gap-3.5 text-[9px] font-bold text-gray-500 mt-2">
              <span className="flex items-center gap-1 text-green-safe"><span className="w-1.5 h-1.5 rounded-full bg-green-safe"></span> 안전</span>
              <span className="flex items-center gap-1 text-yellow-warn"><span className="w-1.5 h-1.5 rounded-full bg-yellow-warn"></span> 주의</span>
              <span className="flex items-center gap-1 text-red-danger"><span className="w-1.5 h-1.5 rounded-full bg-red-danger"></span> 위험</span>
            </div>
          </div>

          {/* 실시간 취약도 차감 내역 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <Shield size={12} className="text-blue-toss" /> 실시간 점수 차감 내역
              </h4>
              <button 
                onClick={() => setShowCriteriaModal(true)}
                className="text-[10px] font-bold text-blue-toss hover:text-blue-toss-dark transition-colors cursor-pointer border-none bg-transparent p-0 flex items-center gap-0.5"
              >
                <span>자세히 보기</span>
                <ChevronRight size={10} />
              </button>
            </div>
            <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3 shadow-3xs text-[11px]">
              <div className="flex justify-between items-center text-gray-700 font-medium">
                <span>기본 위험도 ({currentScenario.title} 전체 동의)</span>
                <span className="font-bold text-gray-900">+{currentScenario.baseScore}점</span>
              </div>
              
              {(() => {
                const inactiveTerms = currentScenario.terms.filter(term => !agreedTermIds[term.id]);
                if (inactiveTerms.length === 0) {
                  return (
                    <div className="bg-blue-toss-light/50 border border-blue-toss/10 p-3 rounded-xl text-[10px] text-blue-toss font-semibold text-center leading-relaxed">
                      💡 아래 모바일 선택 약관 동의를 해제하면 위험 점수가 감점 적용됩니다.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2 border-t border-b border-gray-100 py-2.5">
                    {inactiveTerms.map(term => (
                      <div key={term.id} className="flex justify-between items-center text-green-safe font-semibold font-sans">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-safe"></span>
                          {term.title.replace(/\[선택\]\s*/, "")} 해제
                        </span>
                        <span>-{term.impactScore}점</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-gray-200 font-sans">
                <span className="font-bold text-gray-900">최종 보안 취약도</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
                    {riskInfo.label}
                  </span>
                  <span className={`${riskInfo.color} text-base font-black`}>
                    {currentScore}점
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 실시간 핵심 약관 요약 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
              <Shield size={12} className="text-blue-toss" /> 실시간 핵심 약관 요약
            </h4>
            <ul className="space-y-2.5 bg-gray-50 border border-gray-150 p-3.5 rounded-2xl">
              {currentScenario.baseSummary.map((sum, index) => {
                let displaySum = sum;
                
                // 실시간 차단 상태에 따른 3줄 요약 텍스트 오버라이드
                if (currentScenario.id === "okcashbag") {
                  if (index === 0 && (!agreedTermIds["ok-req-use"] || !agreedTermIds["ok-req-privacy"])) {
                    displaySum = "🛡️ [차단됨] 필수 약관 및 정보 동의를 거부하여 기본 서비스 가입 및 적립 기능이 차단되었습니다.";
                  }
                  if (index === 1 && !agreedTermIds["ok-opt-thirdparty-ins"]) {
                    displaySum = "🛡️ [차단됨] 보험 제휴 제공을 해제하여 아웃바운드 TM 전화 영업을 차단했습니다.";
                  }
                  if (index === 2 && !agreedTermIds["ok-opt-reprovide"]) {
                    displaySum = "🛡️ [차단됨] 계열사 연합 제공 거부로 대기업 간 소비 프로필 결합 위협이 해결되었습니다.";
                  }
                }
                if (currentScenario.id === "pass") {
                  if (index === 0 && (!agreedTermIds["pass-req-use"] || !agreedTermIds["pass-req-privacy"] || !agreedTermIds["pass-req-trust"])) {
                    displaySum = "🛡️ [차단됨] 필수 본인확인 및 신용 위탁 거부로 인하여 간편인증 및 서명 발급이 정지되었습니다.";
                  }
                  if (index === 1 && !agreedTermIds["pass-opt-event-trust"]) {
                    displaySum = "🛡️ [차단됨] 외부 프로모션 젤리블루 위탁을 해제하여 우회적 노출 위험을 예방했습니다.";
                  }
                }
                if (currentScenario.id === "daiso") {
                  if (index === 0 && (!agreedTermIds["daiso-req-use"] || !agreedTermIds["daiso-req-privacy"])) {
                    displaySum = "🛡️ [차단됨] 필수 이용약관 및 정보 수집 거부로 다이소 포인트 적립 및 사용이 차단되었습니다.";
                  }
                  if (index === 1 && !agreedTermIds["daiso-opt-solpay"]) {
                    displaySum = "🛡️ [차단됨] SOL페이 연계 가입을 해제하여 타사 신용정보 통합 누적 위험을 방지했습니다.";
                  }
                }
                if (currentScenario.id === "kkuldeal") {
                  if (index === 0 && (!agreedTermIds["kkul-req-use"] || !agreedTermIds["kkul-req-privacy"])) {
                    displaySum = "🛡️ [차단됨] 필수 이용약관 및 결제 정보 수집을 거절하여 서비스 가입 및 초특가 상품 결제 기능이 정지되었습니다.";
                  }
                  if (index === 1 && !agreedTermIds["kkul-opt-abroad"]) {
                    displaySum = "🛡️ [차단됨] 국외 제3자 이전 동의를 거부하여 결제 카드 정보의 해외 서버 무단 이전을 차단했습니다.";
                  }
                  if (index === 2 && !agreedTermIds["kkul-opt-device"]) {
                    displaySum = "🛡️ [차단됨] 기기 접근 권한을 거부하여 실시간 위치/사진 갤러리 미디어 외부 전송 해킹을 예방했습니다.";
                  }
                }
                if (currentScenario.id === "custom") {
                  if (index === 0 && !agreedTermIds["custom-opt-term"]) {
                    displaySum = `🛡️ [차단됨] ${customAnalysisResult?.title || "위험 조항"} 동의를 거부하여 실시간 개인정보 침해 위협 요소를 차단하였습니다.`;
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
            
            <div className="space-y-2.5">
              {currentScenario.riskFactors.map((rf) => {
                const isActive = agreedTermIds[rf.relatedTermId];
                return (
                  <div 
                    key={rf.id}
                    className={`p-3.5 rounded-xl border text-[11px] transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                      isActive 
                        ? "bg-white border-red-danger/15 shadow-3xs" 
                        : "bg-green-safe-light/5 border-green-safe/10 opacity-70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-xs ${
                          !isActive
                            ? "bg-green-safe-light text-green-safe"
                            : rf.level === "danger" 
                              ? "bg-red-danger-light text-red-danger" 
                              : "bg-yellow-warn-light text-yellow-warn"
                        }`}>
                          {!isActive ? "보호됨" : rf.level === "danger" ? "심각" : "경고"}
                        </span>
                        <span className={`font-bold ${!isActive ? "text-gray-400 line-through" : "text-gray-950"}`}>
                          {rf.title}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-snug">
                        {isActive ? rf.description : rf.resolvedMessage}
                      </p>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => setDetailRisk(rf)}
                        className="self-end text-[9px] font-bold text-red-danger bg-red-danger-light hover:bg-red-danger/15 px-2.5 py-1.5 rounded-lg border border-red-danger/10 flex items-center gap-1 transition-colors select-none cursor-pointer"
                      >
                        <Search size={11} strokeWidth={2.5} />
                        <span>독소조항 정밀검사</span>
                      </button>
                    )}
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
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-xs ${
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

        </aside>
      </div>

      {/* 3. 약관 상세정보 팝업 모달 */}
      {detailTerm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900">{detailTerm.title}</h3>
              <button 
                onClick={() => setDetailTerm(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
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
                className="w-full bg-blue-toss text-white font-bold py-3.5 rounded-xl text-sm transition-colors hover:bg-blue-toss-dark cursor-pointer border-none"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 위험 조항 정밀 검사 상세 리포트 모달 */}
      {detailRisk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            
            {/* 상단 띠 배너 */}
            <div className="bg-red-danger/5 px-6 py-5 border-b border-gray-150 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-danger">
                <ShieldAlert size={20} />
                <h3 className="font-extrabold text-base text-gray-900">GuardTerms 약관 정밀 현미경 검사</h3>
              </div>
              <button 
                onClick={() => setDetailRisk(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* 바디 영역 */}
            <div className="p-6 space-y-5 max-h-[460px] overflow-y-auto no-scrollbar">
              
              {/* 위협 개요 */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h4 className="font-black text-lg text-gray-950">{detailRisk.title}</h4>
                  <p className="text-xs text-gray-700 font-medium">실시간 감지된 세부 보안 취약성 리포트</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-red-danger-light text-red-danger rounded-full flex items-center gap-1 shrink-0">
                  <AlertTriangle size={10} />
                  <span>{detailRisk.level === "danger" ? "심각 등급" : "경고 등급"}</span>
                </span>
              </div>

              {/* 형광펜 약관 원문 강조 영역 */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  📄 약관 조항 원문 및 유해 어구 (Highlight)
                </p>
                <div className="bg-gray-50 border border-gray-150 p-4.5 rounded-2xl text-xs text-gray-700 font-medium leading-relaxed">
                  {renderHighlightedText(detailRisk.fullClauseText, detailRisk.dangerSegment)}
                </div>
              </div>

              {/* 규제 가이드라인 상세 해석 */}
              <div className="space-y-2 bg-yellow-warn-light/30 border border-yellow-warn/15 p-4.5 rounded-2xl">
                <p className="text-xs font-bold text-yellow-warn flex items-center gap-1.5">
                  <Search size={14} /> 규제 가이드라인 상세 해석
                </p>
                <p className="text-xs text-gray-950 leading-relaxed font-semibold">
                  {detailRisk.aiAnalysisComment}
                </p>
              </div>

              {/* 대처 방안 제안 */}
              <div className="bg-blue-toss-light border border-blue-toss/15 p-4.5 rounded-2xl flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-toss text-white flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
                  📌
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-toss">권장 대처 행동 지침 (Action)</p>
                  <p className="text-xs text-gray-900 font-medium leading-relaxed">
                    {detailRisk.remedyActionTip}
                  </p>
                </div>
              </div>

            </div>

            {/* 하단 단추 영역 */}
            <div className="px-6 py-4 border-t border-gray-150 flex gap-3">
              <button
                onClick={() => setDetailRisk(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl text-sm transition-colors cursor-pointer border-none"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setAgreedTermIds(prev => ({
                    ...prev,
                    [detailRisk.relatedTermId]: false
                  }));
                  setDetailRisk(null);
                }}
                className="flex-[2] bg-red-danger text-white font-bold py-4 rounded-xl text-sm transition-colors hover:bg-red-danger/90 cursor-pointer border-none"
              >
                해당 약관 선택 해제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 위험도 점수 산정 기준 안내 모달 */}
      {showCriteriaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            
            {/* 헤더 */}
            <div className="bg-gray-50 px-6 py-5 border-b border-gray-150 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-toss">
                <Shield size={20} />
                <h3 className="font-extrabold text-base text-gray-900">GuardTerms 취약도 점수 산정 기준</h3>
              </div>
              <button 
                onClick={() => setShowCriteriaModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* 바디 */}
            <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto no-scrollbar font-sans">
              
              {/* 설명 */}
              <div className="space-y-1.5">
                <p className="text-xs text-blue-toss font-extrabold uppercase tracking-wider">Scoring Ground Truth</p>
                <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                  GuardTerms 취약도 점수는 **개인정보보호위원회(PIPC)**의 개인정보 처리방침 평가 기준, **공정거래위원회(KFTC)**의 분야별 표준약관 및 불공정 심결례, 그리고 **한국인터넷진흥원(KISA)**의 최근 개인정보 침해사고 동향 보고서 등 공신력 있는 공공기관 가이드라인을 근거로 삼아, 사용자의 개인정보 노출 및 권리 침해 요소를 공정하게 수치화한 신뢰도 지표입니다.
                </p>
              </div>

              {/* 산식 */}
              <div className="bg-blue-toss-light border border-blue-toss/10 p-4.5 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-blue-toss flex items-center gap-1">
                  💡 점수 산출 공식
                </p>
                <div className="text-xs text-gray-900 font-semibold leading-relaxed space-y-1.5">
                  <div className="flex justify-between border-b border-blue-toss/10 pb-1.5">
                    <span>기본 위험도 점수 (전체 동의 시)</span>
                    <span>서비스별 상이</span>
                  </div>
                  <div className="flex justify-between text-green-safe">
                    <span>선택/필수 약관 해제에 따른 차감 점수</span>
                    <span>개별 항목당 -8 ~ -28점</span>
                  </div>
                  <div className="pt-1.5 flex justify-between text-blue-toss font-extrabold border-t border-blue-toss/20">
                    <span>최종 취약도 점수</span>
                    <span>기본 위험도 - 차감 점수 합계</span>
                  </div>
                </div>
              </div>

              {/* 등급표 */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  📊 취약도 등급 기준 및 의미
                </p>
                <div className="space-y-2.5">
                  
                  {/* 안전 */}
                  <div className="flex gap-3.5 p-3.5 border border-green-safe/15 bg-green-safe-light/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-green-safe-light flex items-center justify-center text-green-safe shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">안전 등급</span>
                        <span className="text-[10px] font-bold text-green-safe bg-green-safe-light px-1.5 py-0.2 rounded-md">0 ~ 35점</span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                        개인정보보호위원회(PIPC)의 목적 외 과도한 정보 수집 제한 지침 및 최소 수집 원칙을 충실히 준수하는 상태입니다. 외부 제3자 무단 제공이나 GPS 실시간 동선 추적과 같이 스미싱/개인정보 오남용 우려가 큰 침해 조항이 차단된 최고 등급의 보안 상태입니다.
                      </p>
                    </div>
                  </div>

                  {/* 주의 */}
                  <div className="flex gap-3.5 p-3.5 border border-yellow-warn/15 bg-yellow-warn-light/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-yellow-warn-light flex items-center justify-center text-yellow-warn shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">주의 등급</span>
                        <span className="text-[10px] font-bold text-yellow-warn bg-yellow-warn-light px-1.5 py-0.2 rounded-md">36 ~ 70점</span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                        선택 마케팅 활용 동의, 제휴 카드 연동 등 개인 맞춤화 혜택 제공 조항이 일부 포함된 상태입니다. 실시간 사생활 위협은 낮지만 빈번한 타겟 문자 스팸이나 마케팅 전화를 유발할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* 위험 */}
                  <div className="flex gap-3.5 p-3.5 border border-red-danger/15 bg-red-danger-light/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-red-danger-light flex items-center justify-center text-red-danger shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">위험 등급</span>
                        <span className="text-[10px] font-bold text-red-danger bg-red-danger-light px-1.5 py-0.2 rounded-md">71 ~ 100점</span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                        백그라운드 상태의 무작동 GPS 실시간 위치 트래킹, 암호화되지 않은 해외 마케팅 제3자 데이터 무단 이전 등 매우 심각한 수준의 독소 조항이 작동 중인 상태입니다. 가급적 가입 전 선택 체크 해제를 적극 권장합니다.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
            
            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-150">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="w-full bg-blue-toss text-white font-bold py-4 rounded-xl text-sm transition-colors hover:bg-blue-toss-dark cursor-pointer select-none border-none"
              >
                기준 안내 확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
