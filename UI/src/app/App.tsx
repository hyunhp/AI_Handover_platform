import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { HomeView } from './components/HomeView';
import { ArchiveView } from './components/ArchiveView';
import { HandoverSetup } from './components/HandoverSetup';
import { DocumentDashboard } from './components/DocumentDashboard';
import { AIEditingView } from './components/AIEditingView';

export default function App() {
  // --- 1. 초기 상태 설정 (새로고침 시 브라우저 저장소에서 데이터를 가져옴) ---
  
  // 로그인 여부
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mayi_isLoggedIn') === 'true';
  });

  // 현재 활성화된 메뉴
  const [activeMenu, setActiveMenu] = useState<'home' | 'agent' | 'archive'>(() => {
    return (localStorage.getItem('mayi_activeMenu') as any) || 'home';
  });

  // Agent 내 진행 단계
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return Number(localStorage.getItem('mayi_currentStep')) || 1;
  });

  // 입력된 기본 정보 (객체이므로 JSON 파싱 필요)
  const [setupData, setSetupData] = useState<any>(() => {
    const saved = localStorage.getItem('mayi_setupData');
    return saved ? JSON.parse(saved) : null;
  });

  // AI 분석 결과 (객체이므로 JSON 파싱 필요)
  const [analysisResult, setAnalysisResult] = useState<any>(() => {
    const saved = localStorage.getItem('mayi_analysisResult');
    return saved ? JSON.parse(saved) : null;
  });

  // 선택된 하위 프로젝트
  const [selectedSubProject, setSelectedSubProject] = useState<string>(() => {
    return localStorage.getItem('mayi_selectedSubProject') || "";
  });


  // --- 2. 상태 저장 (데이터가 바뀔 때마다 브라우저 저장소에 기록) ---
  
  useEffect(() => {
    localStorage.setItem('mayi_isLoggedIn', String(isLoggedIn));
    localStorage.setItem('mayi_activeMenu', activeMenu);
    localStorage.setItem('mayi_currentStep', String(currentStep));
    localStorage.setItem('mayi_selectedSubProject', selectedSubProject);
    
    if (setupData) localStorage.setItem('mayi_setupData', JSON.stringify(setupData));
    if (analysisResult) localStorage.setItem('mayi_analysisResult', JSON.stringify(analysisResult));
  }, [isLoggedIn, activeMenu, currentStep, setupData, analysisResult, selectedSubProject]);


  // --- 3. 핸들러 함수들 ---

  const handleMenuChange = (menu: 'home' | 'agent' | 'archive') => {
    setActiveMenu(menu);
    // 인수인계 Agent를 처음 누를 때만 Step 2로 이동
    if (menu === 'agent' && currentStep < 2) setCurrentStep(2);
  };

  // 로그아웃 (모든 저장 데이터 삭제 및 상태 초기화)
  const handleLogout = () => {
    localStorage.clear(); //
    setIsLoggedIn(false); //
    setActiveMenu('home'); //
    setCurrentStep(1); //
    // 페이지 강제 새로고침이 필요하다면 아래 주석을 해제하세요.
    // window.location.reload(); 
  };


  // --- 4. 화면 렌더링 로직 ---

  // 로그인이 안 되어 있으면 로그인 화면 노출
  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden font-sans">
      {/* 좌측 사이드바: 로그아웃 핸들러를 전달함 */}
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuChange={handleMenuChange} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 overflow-auto relative">
        {/* 홈 화면 */}
        {activeMenu === 'home' && (
          <HomeView onStartAgent={() => {
            setActiveMenu('agent');
            setCurrentStep(2);
          }} />
        )}

        {/* 인수인계 Agent 프로세스 */}
        {activeMenu === 'agent' && (
          <div className="size-full animate-in fade-in duration-500">
            {/* Step 2: 기본 정보 및 업로드 */}
            {currentStep === 2 && (
              <HandoverSetup 
                onComplete={(data, result) => {
                  setSetupData(data);
                  setAnalysisResult(result);
                  setCurrentStep(4);
                }}
              />
            )}
            
            {/* Step 4: 프로젝트 선택 대시보드 */}
            {currentStep === 4 && (
              <DocumentDashboard
                motherProjectName={setupData?.businessName || "새 인수인계"}
                projects={analysisResult}
                onNext={(selectedName: string) => {
                  setSelectedSubProject(selectedName);
                  setCurrentStep(5);
                }}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {/* Step 5: 3컬럼 통합 에디터 */}
            {currentStep === 5 && (
              <AIEditingView 
                motherFolderName={setupData?.businessName || "새 인수인계"}
                projectName={selectedSubProject}
                onBack={() => setCurrentStep(4)} 
              />
            )}
          </div>
        )}

        {/* 아카이브 화면 */}
        {activeMenu === 'archive' && <ArchiveView />}
      </main>
    </div>
  );
}