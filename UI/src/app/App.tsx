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

// 💡 수정된 프로젝트 선택 핸들러
  const handleSelectProjectFromList = async (motherFolderName: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      // 1. 서버에 해당 마더 폴더의 상세 구조 요청
      const res = await fetch(`${baseUrl}/api/load-project-details`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        // 2. 마더 폴더 이름과 내부 하위 프로젝트 리스트를 상태에 저장
        setSetupData({ businessName: data.motherFolderName });
        setAnalysisResult(data.analysis_result); // 👈 여기서 하위 프로젝트들이 세팅됨
        
        // 3. 화면을 분석 결과 대시보드(Step 4)로 전환
        setActiveMenu('agent');
        setCurrentStep(4);
      } else {
        alert("프로젝트 데이터를 불러오지 못했습니다.");
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
    window.location.reload();
  };

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden font-sans text-slate-900">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-auto relative">
        {/* 홈 화면에 프로젝트 선택 기능 전달  */}
        {activeMenu === 'home' && (
          <HomeView 
            onStartAgent={() => { setActiveMenu('agent'); setCurrentStep(2); }} 
            onProjectSelect={handleSelectProjectFromList}
          />
        )}

        {activeMenu === 'agent' && (
          <div className="size-full animate-in fade-in duration-500">
            {currentStep === 2 && <HandoverSetup onComplete={(data, res) => { setSetupData(data); setAnalysisResult(res); setCurrentStep(4); }} />}
            {currentStep === 4 && (
              <DocumentDashboard 
                motherProjectName={setupData?.businessName || "인수인계"} 
                projects={analysisResult} 
                onNext={(name) => { setSelectedSubProject(name); setCurrentStep(5); }} 
                onBack={() => setCurrentStep(2)} 
              />
            )}
            {currentStep === 5 && (
              <AIEditingView 
                motherFolderName={setupData?.businessName || "인수인계"} 
                projectName={selectedSubProject} 
                onBack={() => setCurrentStep(4)} 
              />
            )}
          </div>
        )}

        {/* 아카이브 화면에 프로젝트 선택 기능 전달  */}
        {activeMenu === 'archive' && (
          <ArchiveView onProjectSelect={handleSelectProjectFromList} />
        )}
      </main>
    </div>
  );
}