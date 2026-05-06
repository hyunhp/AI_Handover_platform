import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { PredecessorDashboard } from './components/PredecessorDashboard';
import { UploadInterface } from './components/UploadInterface';
import { DocumentDashboard } from './components/DocumentDashboard';
import { AIEditingView } from './components/AIEditingView';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [folderName, setFolderName] = useState(""); // 마더 프로젝트 이름
  const [analysisResult, setAnalysisResult] = useState<any>(null); // AI 분류 결과
  const [selectedSubProject, setSelectedSubProject] = useState(""); // 선택된 하위 프로젝트명

  return (
    <div className="size-full">
      {/* Step 1: 랜딩 페이지 */}
      {currentStep === 1 && <LandingPage onNext={() => setCurrentStep(2)} />}
      
      {/* Step 2: 프로젝트 이름 입력 */}
      {currentStep === 2 && (
        <PredecessorDashboard 
          onCreateHandover={(name) => {
            setFolderName(name);
            setCurrentStep(3);
          }} 
        />
      )}

      {/* Step 3: 파일 업로드 및 AI 분류 */}
      {currentStep === 3 && (
        <UploadInterface
          folderName={folderName}
          onNext={(result: any) => {
            setAnalysisResult(result);
            setCurrentStep(4);
          }}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* Step 4: 하위 프로젝트 선택 */}
      {currentStep === 4 && (
        <DocumentDashboard
          motherProjectName={folderName}
          projects={analysisResult}
          onNext={(selectedName: string) => {
            setSelectedSubProject(selectedName);
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {/* Step 5: AI 편집 및 매뉴얼 생성 */}
      {currentStep === 5 && (
        <AIEditingView 
          motherFolderName={folderName} // 👈 마더 폴더 이름 추가 전달        
          projectName={selectedSubProject}
          onBack={() => setCurrentStep(4)} 
        />
      )}
    </div>
  );
}