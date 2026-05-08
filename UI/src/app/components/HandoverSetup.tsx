import { useState, useRef, useEffect } from 'react';
import { Upload, Link as LinkIcon, Globe, FileText, Loader2, Check, ChevronRight, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';

interface HandoverSetupProps {
  onComplete: (setupData: any, analysisResult: any) => void;
}

export function HandoverSetup({ onComplete }: HandoverSetupProps) {
  // --- 상태 관리 (데이터 저장 변수들) ---
  const [subStep, setSubStep] = useState(1); // 현재 화면 단계 (1:정보, 2:업로드, 3:로딩)
  const [businessName, setBusinessName] = useState('');
  const [progress, setProgress] = useState('진행 중');
  const [externalLinks, setExternalLinks] = useState([{ url: '', id: '', pw: '' }]);
  const [instructions, setInstructions] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 8단계 로딩 메시지 설정 ---
  const [analysisSteps, setAnalysisSteps] = useState([
    { id: 1, label: '사용자의 로그인 정보를 파악 중입니다.', status: 'pending' },
    { id: 2, label: '사용자의 소속을 확인했습니다.', status: 'pending' },
    { id: 3, label: '소속된 팀의 업무 속성을 파악했습니다.', status: 'pending' },
    { id: 4, label: '업무 주제별로 그룹핑 중입니다.', status: 'pending' },
    { id: 5, label: '업무 주제 분석을 완료했습니다.', status: 'pending' },
    { id: 6, label: '업무 유형을 매핑 중입니다.', status: 'pending' },
    { id: 7, label: '맞춤형 스마트 업무 블록이 생성되었습니다.', status: 'pending' },
    { id: 8, label: '인수인계에 필요한 자료가 모두 준비되었습니다.', status: 'pending' },
  ]);

  // 외부 링크 입력칸 추가 함수
  const addLink = () => setExternalLinks([...externalLinks, { url: '', id: '', pw: '' }]);

  // --- 서버 전송 및 AI 분석 시작 함수 ---
  const handleStartAnalysis = async () => {
    setSubStep(3); // 화면을 8단계 로딩창으로 전환
    
    const formData = new FormData();
    formData.append("folderName", businessName);
    formData.append("progress", progress);
    formData.append("instructions", instructions);
    files.forEach((file) => formData.append("files", file));

    // 로딩바 애니메이션 시뮬레이션 (사용자에게 진행 상황을 보여줌)
    const runAnimation = async () => {
      for (let i = 0; i < analysisSteps.length; i++) {
        await new Promise(r => setTimeout(r, 1200)); // 각 단계마다 약 1.2초 대기
        setAnalysisSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
      }
    };

    try {
      // 애니메이션과 서버 요청을 동시에 시작
      const animationPromise = runAnimation();
      const response = await fetch("http://3.39.11.5:8000/api/upload-and-analyze", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      
      await animationPromise; // 애니메이션이 다 끝날 때까지 기다림
      
      if (result.status === "success") {
        onComplete({ businessName, progress, instructions }, result.analysis_result);
      }
    } catch (error) {
      alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setSubStep(2); // 에러 발생 시 업로드 화면으로 복귀
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 font-sans">
      {/* 화면 상단 단계 표시 (스테퍼) */}
      <div className="flex items-center gap-12 mb-16 border-b pb-6">
        <div className={`flex items-center gap-3 font-bold text-lg ${subStep === 1 ? 'text-red-500' : 'text-slate-300'}`}>
          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${subStep === 1 ? 'border-red-500' : 'border-slate-200'}`}>1</span>
          인수인계 기본 정보
        </div>
        <div className={`flex items-center gap-3 font-bold text-lg ${subStep >= 2 ? 'text-red-500' : 'text-slate-300'}`}>
          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${subStep >= 2 ? 'border-red-500' : 'border-slate-200'}`}>2</span>
          자료 업로드
        </div>
      </div>

      {/* --- 단계 1: 기본 정보 입력 --- */}
      {subStep === 1 && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">인수인계 기본 정보</h2>
            <div className="grid gap-8">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-3 block">업무명 (선택)</label>
                <input 
                  value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="예: 2024 상반기 신규 앱 런칭 마케팅"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 ring-red-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-3 block">업무 진척도 (선택)</label>
                <div className="flex gap-3">
                  {['시작 전', '진행 중', '완료/유지보수'].map(t => (
                    <button 
                      key={t} onClick={() => setProgress(t)}
                      className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                        progress === t ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <label className="text-sm font-bold text-slate-600 mb-3 block">외부 자료 연동 (선택)</label>
            <div className="space-y-3">
              {externalLinks.map((link, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in">
                  <input placeholder="https:// 연동할 사이트 주소" className="flex-[2] p-4 border border-slate-100 rounded-2xl outline-none focus:border-red-200" />
                  <input placeholder="ID" className="flex-1 p-4 border border-slate-100 rounded-2xl outline-none focus:border-red-200" />
                  <input placeholder="PW" className="flex-1 p-4 border border-slate-100 rounded-2xl outline-none focus:border-red-200" />
                  <Button onClick={addLink} variant="outline" className="rounded-2xl w-14 h-14 border-slate-200 text-slate-400 hover:text-red-500"><Plus /></Button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <label className="text-sm font-bold text-slate-600 mb-3 block">그 외 지시사항 (선택)</label>
            <Textarea 
              value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="AI 인수인계서에 특별히 강조하거나 포함하고 싶은 내용을 적어주세요."
              className="h-40 rounded-2xl border-slate-100 focus:ring-red-50 p-4 resize-none"
            />
          </section>

          <Button onClick={() => setSubStep(2)} className="w-full py-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-red-100 transition-all">다음 단계로</Button>
        </div>
      )}

      {/* --- 단계 2: 파일 업로드 --- */}
      {subStep === 2 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">자료 업로드</h2>
            <Card 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 p-20 text-center cursor-pointer hover:bg-red-50/30 hover:border-red-300 transition-all rounded-[40px] group"
            >
              <input type="file" multiple hidden ref={fileInputRef} onChange={e => setFiles([...files, ...Array.from(e.target.files || [])])} />
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">파일을 이곳에 업로드하세요</h3>
              <p className="text-slate-400">pdf, images, docs, audio 등 업무 관련 모든 파일</p>
            </Card>

            {/* 업로드된 파일 목록 표시 */}
            {files.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="bg-white border border-slate-100 px-4 py-2 rounded-full text-sm text-slate-600 flex items-center gap-2 shadow-sm">
                    <FileText className="w-4 h-4 text-red-400" /> {f.name}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">기타 자료 추가</h3>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 rounded-3xl gap-3 text-slate-600 border-slate-100 hover:bg-slate-50"><Globe className="w-5 h-5 text-blue-400" /> 웹사이트</Button>
              <Button variant="outline" className="h-20 rounded-3xl gap-3 text-slate-600 border-slate-100 hover:bg-slate-50"><LinkIcon className="w-5 h-5 text-green-400" /> 드라이브</Button>
              <Button variant="outline" className="h-20 rounded-3xl gap-3 text-slate-600 border-slate-100 hover:bg-slate-50"><FileText className="w-5 h-5 text-amber-400" /> 직접 입력</Button>
            </div>
          </section>

          <div className="flex gap-4 pt-4">
            <Button onClick={() => setSubStep(1)} variant="outline" className="flex-1 py-8 rounded-2xl border-slate-200 text-slate-500 font-bold">이전</Button>
            <Button onClick={handleStartAnalysis} disabled={files.length === 0} className="flex-[2.5] py-8 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-red-100">
              인수인계서 생성 <ChevronRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* --- 단계 3: 8단계 분석 로딩 --- */}
      {subStep === 3 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-1000">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              AI Agent <span className="text-red-500">Mayi</span>가 자료를 분석 중입니다
            </h2>
            <p className="text-slate-500 text-lg">전달해주신 자료를 바탕으로 최적의 인수인계 구조를 설계하고 있습니다.</p>
          </div>

          <div className="w-full max-w-lg space-y-4">
            {analysisSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-6 p-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  step.status === 'done' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-300'
                }`}>
                  {step.status === 'done' ? <Check className="w-5 h-5 stroke-[3px]" /> : <span className="text-xs font-bold">{step.id}</span>}
                </div>
                <span className={`text-base transition-all duration-500 ${step.status === 'done' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {step.status === 'pending' && analysisSteps[step.id-2]?.status === 'done' && (
                  <Loader2 className="w-4 h-4 animate-spin text-red-500 ml-auto" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-16">
            <div className="flex items-center gap-3 text-red-500 font-bold animate-pulse">
              <Loader2 className="animate-spin" />
              <span>Analyzing contextual data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}