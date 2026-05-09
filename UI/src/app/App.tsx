// src/app/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { HomeView } from './components/HomeView';
import { ArchiveView } from './components/ArchiveView';
import { HandoverSetup } from './components/HandoverSetup';
import { DocumentDashboard } from './components/DocumentDashboard';
import { AIEditingView } from './components/AIEditingView';

export default function App() {
  // --- 상태 관리 및 로컬 스토리지 동기화 ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('mayi_isLoggedIn') === 'true');
  const [activeMenu, setActiveMenu] = useState<'home' | 'agent' | 'archive'>(() => (localStorage.getItem('mayi_activeMenu') as any) || 'home');
  const [currentStep, setCurrentStep] = useState<number>(() => Number(localStorage.getItem('mayi_currentStep')) || 1);
  const [setupData, setSetupData] = useState<any>(() => JSON.parse(localStorage.getItem('mayi_setupData') || 'null'));
  const [analysisResult, setAnalysisResult] = useState<any>(() => JSON.parse(localStorage.getItem('mayi_analysisResult') || 'null'));
  const [selectedSubProject, setSelectedSubProject] = useState<string>(() => localStorage.getItem('mayi_selectedSubProject') || "");

  useEffect(() => {
    localStorage.setItem('mayi_isLoggedIn', String(isLoggedIn));
    localStorage.setItem('mayi_activeMenu', activeMenu);
    localStorage.setItem('mayi_currentStep', String(currentStep));
    localStorage.setItem('mayi_selectedSubProject', selectedSubProject);
    if (setupData) localStorage.setItem('mayi_setupData', JSON.stringify(setupData));
    if (analysisResult) localStorage.setItem('mayi_analysisResult', JSON.stringify(analysisResult));
  }, [isLoggedIn, activeMenu, currentStep, setupData, analysisResult, selectedSubProject]);

  // --- [핸들러 1] 홈 화면용: 마더 폴더 선택 시 바로 에디터(Step 5)로 직행 ---
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
        
        // 💡 대시보드를 건너뛰기 위해 첫 번째 프로젝트를 자동 선택합니다.
        const projectNames = data.analysis_result ? Object.keys(data.analysis_result) : [];
        if (projectNames.length > 0) {
          setSelectedSubProject(projectNames[0]);
          setActiveMenu('agent');
          setCurrentStep(5); // 바로 에디터 화면으로 이동
        } else {
          setActiveMenu('agent');
          setCurrentStep(4); // 분석 결과가 없을 경우 예외적으로 대시보드로 이동
        }
      }
    } catch (e) {
      console.error("Load Project Details Error:", e);
    }
  };

  // --- [핸들러 2] 아카이브용: 업무 주제 선택 시 에디터(Step 5)로 직행 ---
  const handleSelectThemeFromArchive = (motherName: string, projectName: string) => {
    setSetupData({ businessName: motherName });
    setSelectedSubProject(projectName);
    setActiveMenu('agent');
    setCurrentStep(5); 
  };
  
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setActiveMenu('home');
    setCurrentStep(1);
    window.location.reload();
  };

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden font-sans text-slate-900">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-auto relative">
        {/* [1] 홈 화면 */}
        {activeMenu === 'home' && (
          <HomeView 
            onStartAgent={() => { setActiveMenu('agent'); setCurrentStep(2); }} 
            // 💡 아카이브와 동일하게 에디터로 직행하도록 핸들러 변경
            onProjectSelect={handleSelectThemeFromArchive} 
            // 💡 아카이브 메뉴로 이동하는 함수 추가
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
                  
                  // 💡 분석 완료 후 첫 번째 주제명을 가져와 자동으로 에디터로 진입합니다.
                  const projectNames = res ? Object.keys(res) : [];
                  
                  if (projectNames.length > 0) {
                    setSelectedSubProject(projectNames[0]); 
                    setCurrentStep(5); // 대시보드를 건너뛰고 바로 에디터로 이동
                  } else {
                    setCurrentStep(4); // 결과가 없을 경우를 대비한 폴백
                  }
                }} 
              />
            )}
            
            {/* Step 4: 프로젝트 대시보드 (하위 업무 리스트 확인 - 필요 시 수동 진입용으로 유지) */}
            {currentStep === 4 && (
              <DocumentDashboard 
                motherProjectName={setupData?.businessName || "인수인계"} 
                projects={analysisResult} 
                onNext={(name) => { 
                  setSelectedSubProject(name); 
                  setCurrentStep(5); 
                }} 
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
                onBack={() => {
                  // 💡 에디터에서 '뒤로 가기' 클릭 시 대시보드가 아닌 업로드 단계로 이동합니다.
                  setCurrentStep(2); 
                }} 
              />
            )}
          </div>
        )}

        {/* [3] 아카이브 화면 */}
        {activeMenu === 'archive' && (
          <ArchiveView onProjectSelect={handleSelectThemeFromArchive} />
        )}
      </main>
    </div>
  );
}