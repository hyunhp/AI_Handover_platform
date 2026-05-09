import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { HomeView } from './components/HomeView';
import { ArchiveView } from './components/ArchiveView';
import { HandoverSetup } from './components/HandoverSetup';
import { DocumentDashboard } from './components/DocumentDashboard';
import { AIEditingView } from './components/AIEditingView';
// 💡 신규 데모 뷰 임포트
import { SharedDemoView } from './components/SharedDemoView';

export default function App() {
  // --- 상태 관리 및 로컬 스토리지 동기화 ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('mayi_isLoggedIn') === 'true');
  const [activeMenu, setActiveMenu] = useState<'home' | 'agent' | 'archive'>(() => (localStorage.getItem('mayi_activeMenu') as any) || 'home');
  const [currentStep, setCurrentStep] = useState<number>(() => Number(localStorage.getItem('mayi_currentStep')) || 1);
  const [setupData, setSetupData] = useState<any>(() => JSON.parse(localStorage.getItem('mayi_setupData') || 'null'));
  const [analysisResult, setAnalysisResult] = useState<any>(() => JSON.parse(localStorage.getItem('mayi_analysisResult') || 'null'));
  const [selectedSubProject, setSelectedSubProject] = useState<string>(() => localStorage.getItem('mayi_selectedSubProject') || "");
  
  // 💡 공유 문서 데모 화면 상태 추가
  const [isSharedDemo, setIsSharedDemo] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('mayi_isLoggedIn', String(isLoggedIn));
    localStorage.setItem('mayi_activeMenu', activeMenu);
    localStorage.setItem('mayi_currentStep', String(currentStep));
    localStorage.setItem('mayi_selectedSubProject', selectedSubProject);
    if (setupData) localStorage.setItem('mayi_setupData', JSON.stringify(setupData));
    if (analysisResult) localStorage.setItem('mayi_analysisResult', JSON.stringify(analysisResult));
  }, [isLoggedIn, activeMenu, currentStep, setupData, analysisResult, selectedSubProject]);

  // --- [핸들러] 아카이브 및 홈 화면 공통: 업무 주제 선택 시 분기 처리 ---
  const handleSelectThemeFromArchive = (motherName: string, projectName: string) => {
    // 1. 프로젝트명 보관
    setSelectedSubProject(projectName);
    setSetupData({ businessName: motherName });

    // 💡 [핵심] 공유받은 문서(SHARED)인 경우 데모 화면으로 유도
    if (projectName.includes("(SHARED)")) {
      setIsSharedDemo(true);
      setActiveMenu('agent'); // 내부 UI 구성을 위해 agent 메뉴 상태로 둡니다.
      return;
    }

    // 2. 일반 문서인 경우 에디터(Step 5)로 직행
    setIsSharedDemo(false);
    setActiveMenu('agent');
    setCurrentStep(5); 
  };

  const handleSelectProjectFromList = async (motherFolderName: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/load-project-details`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setSetupData({ businessName: data.motherFolderName });
        setAnalysisResult(data.analysis_result);
        
        const projectNames = data.analysis_result ? Object.keys(data.analysis_result) : [];
        if (projectNames.length > 0) {
          handleSelectThemeFromArchive(data.motherFolderName, projectNames[0]);
        } else {
          setActiveMenu('agent');
          setCurrentStep(4);
        }
      }
    } catch (e) {
      console.error("Load Project Details Error:", e);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setActiveMenu('home');
    setCurrentStep(1);
    setIsSharedDemo(false);
    window.location.reload();
  };

  // 메뉴 변경 시 데모 상태 리셋 (다른 메뉴 클릭 시 데모 화면에서 빠져나옴)
  const handleMenuChange = (menu: 'home' | 'agent' | 'archive') => {
    setActiveMenu(menu);
    setIsSharedDemo(false);
  };

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden font-sans text-slate-900">
      <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-auto relative">
        
        {/* 💡 데모 화면 활성화 시 최우선 렌더링 */}
        {isSharedDemo ? (
          <SharedDemoView 
            motherFolderName={setupData?.businessName || "인수인계 진행"} 
            projectName={selectedSubProject}
            onBack={() => setIsSharedDemo(false)} 
          />
        ) : (
          <>
            {/* [1] 홈 화면 */}
            {activeMenu === 'home' && (
              <HomeView 
                onStartAgent={() => { setActiveMenu('agent'); setCurrentStep(2); }} 
                onProjectSelect={handleSelectThemeFromArchive} 
                onViewArchive={() => setActiveMenu('archive')} 
              />
            )}

            {/* [2] 인수인계 Agent 서비스 영역 */}
            {activeMenu === 'agent' && (
              <div className="size-full animate-in fade-in duration-500">
                {/* Step 2: 신규 파일 업로드 및 분석 */}
                {currentStep === 2 && (
                  <HandoverSetup 
                    onComplete={(data, res) => { 
                      setSetupData(data); 
                      setAnalysisResult(res); 
                      const projectNames = res ? Object.keys(res) : [];
                      if (projectNames.length > 0) {
                        handleSelectThemeFromArchive(data.businessName, projectNames[0]);
                      } else {
                        setCurrentStep(4);
                      }
                    }} 
                  />
                )}
                
                {/* Step 4: 프로젝트 대시보드 */}
                {currentStep === 4 && (
                  <DocumentDashboard 
                    motherProjectName={setupData?.businessName || "인수인계"} 
                    projects={analysisResult} 
                    onNext={(name) => handleSelectThemeFromArchive(setupData.businessName, name)} 
                    onBack={() => setCurrentStep(2)} 
                  />
                )}
                
                {/* Step 5: AI 에디터 (개별 업무 매뉴얼 편집) */}
                {currentStep === 5 && (
                  <AIEditingView 
                    motherFolderName={setupData?.businessName || "인수인계"} 
                    projects={analysisResult} 
                    initialProjectName={selectedSubProject} 
                    onProjectChange={setSelectedSubProject} 
                    onBack={() => setCurrentStep(2)} 
                  />
                )}
              </div>
            )}

            {/* [3] 아카이브 화면 */}
            {activeMenu === 'archive' && (
              <ArchiveView onProjectSelect={handleSelectThemeFromArchive} />
            )}
          </>
        )}
      </main>
    </div>
  );
}