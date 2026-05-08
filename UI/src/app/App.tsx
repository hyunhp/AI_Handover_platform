// src/app/App.tsx 전체 수정
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView'; // 신규 추가
import { HomeView } from './components/HomeView';
import { ArchiveView } from './components/ArchiveView';
import { HandoverSetup } from './components/HandoverSetup';
import { DocumentDashboard } from './components/DocumentDashboard';
import { AIEditingView } from './components/AIEditingView';

export default function App() {
  // --- 로그인 상태 관리 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 👈 로그인 여부 상태 추가

  // --- 기존 상태들 ---
  const [activeMenu, setActiveMenu] = useState<'home' | 'agent' | 'archive'>('home');
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedSubProject, setSelectedSubProject] = useState("");

  // 로그인이 안 되어 있으면 로그인 화면만 보여줌
  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  // 로그인이 완료되면 기존의 전체 레이아웃을 보여줌
  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden font-sans">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuChange={(menu) => {
          setActiveMenu(menu);
          if (menu === 'agent' && currentStep < 2) setCurrentStep(2);
        }} 
      />

      <main className="flex-1 overflow-auto relative">
        {activeMenu === 'home' && (
          <HomeView onStartAgent={() => {
            setActiveMenu('agent');
            setCurrentStep(2);
          }} />
        )}

        {activeMenu === 'agent' && (
          <div className="size-full animate-in fade-in duration-500">
            {currentStep === 2 && (
              <HandoverSetup 
                onComplete={(data, result) => {
                  setSetupData(data);
                  setAnalysisResult(result);
                  setCurrentStep(4);
                }}
              />
            )}
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
            {currentStep === 5 && (
              <AIEditingView 
                motherFolderName={setupData?.businessName || "새 인수인계"}
                projectName={selectedSubProject}
                onBack={() => setCurrentStep(4)} 
              />
            )}
          </div>
        )}

        {activeMenu === 'archive' && <ArchiveView />}
      </main>
    </div>
  );
}