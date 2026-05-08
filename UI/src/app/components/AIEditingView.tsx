import React, { useState, useEffect } from 'react';
import { 
  Send, Sparkles, Download, FileText, Loader2, 
  ChevronDown, ChevronRight, Share2, Trash2, 
  Bold, Italic, List, ListOrdered, Type, Save, X, Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

interface AIEditingViewProps {
  motherFolderName: string; // 최상단 프로젝트 명 (예: test)
  projectName: string;      // 현재 하위 프로젝트 명 (예: 스크립트 프로젝트)
  onBack: () => void;       // 이전 화면(대시보드)으로 이동하는 함수
}

export function AIEditingView({ motherFolderName, projectName, onBack }: AIEditingViewProps) {
  // --- 상태 관리 ---
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [isChatLoading, setIsChatLoading] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState("데이터를 가져오고 있습니다..."); 
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
  const [currentFileName, setCurrentFileName] = useState(""); // 💡 현재 에디터에 열린 파일명 추적
  const [aiState, setAiState] = useState(JSON.stringify({ phase: "DRAFTING", current_project: projectName }));
  
  const [rawFiles, setRawFiles] = useState<string[]>([]);
  const [generatedManuals, setGeneratedManuals] = useState<string[]>([]);

  // --- 1. 초기 데이터 로드 ---
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      if (isLoading) {
        setLoadingStatus("AI가 인수인계서를 작성하고 있습니다. 잠시만 기다려 주세요...");
      }
    }, 2500);

    const init = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/generate-manual`, {
          method: "POST",
          body: new URLSearchParams({ motherFolderName, projectName })
        });
        
        if (!res.ok) throw new Error("서버 응답 에러");
        const data = await res.json();
        
        if (data.status === "success") {
          setMarkdownContent(data.content || "");
          if (data.raw_files) setRawFiles(data.raw_files);
          
          // 버전 리스트 설정 및 현재 파일명 세팅
          const versionList = data.version_list || ["manual_draft.md"];
          setGeneratedManuals(versionList);
          setCurrentFileName(versionList[0]); // 💡 가장 최신 파일을 현재 파일로 설정
          
          setMessages([{ role: 'assistant', content: `안녕하세요! '${projectName}'의 데이터를 불러왔습니다. 수정이 필요하시면 말씀해 주세요.` }]);
        }
      } catch (e) {
        console.error("로드 실패:", e);
        setMarkdownContent("# 오류 발생\n데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false); 
        clearTimeout(loadingTimer);
      }
    };
    init();
    return () => clearTimeout(loadingTimer);
  }, [motherFolderName, projectName]);

  // --- 2. 💡 특정 히스토리 버전 로드 함수 ---
  const handleLoadVersion = async (fileName: string) => {
    if (isSaving || isChatLoading) return;
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/get-version-content`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName, fileName })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMarkdownContent(data.content);
        setCurrentFileName(fileName); // 💡 현재 열린 파일명 업데이트
      }
    } catch (e) {
      alert("문서를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. 💡 수동 저장 기능 (현재 파일에 덮어쓰기) ---
  const handleManualSave = async () => {
    if (!markdownContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/save-manual-overwrite`, {
        method: "POST",
        body: new URLSearchParams({ 
          motherFolderName, 
          projectName, 
          fileName: currentFileName, // 💡 현재 열려있는 파일에 덮어쓰기
          content: markdownContent 
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        console.log("저장 성공:", currentFileName);
        // 사용자 피드백을 위해 살짝 알림을 줄 수 있습니다.
      }
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. AI 채팅 편집 요청 (새 버전 생성) ---
  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return; 
    
    const userMsg = input;
    setInput('');
    setIsChatLoading(true); 
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/chat-edit`, {
        method: "POST",
        body: new URLSearchParams({ 
          motherFolderName, projectName, message: userMsg, state: aiState, mode: "versioning" 
        })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        if (data.updated_content) setMarkdownContent(data.updated_content);
        if (data.new_version_name) {
          setGeneratedManuals(prev => [data.new_version_name, ...prev]);
          setCurrentFileName(data.new_version_name); // 💡 AI가 새로 만든 파일을 현재 파일로 설정
        }
        setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
        setAiState(data.new_state);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "수정 요청 처리 중 에러가 발생했습니다." }]);
    } finally {
      setIsChatLoading(false); 
    }
  };

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden font-sans relative text-slate-900">
      {/* 상단 헤더 */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={onBack} className="hover:text-red-500 hover:font-bold transition-all cursor-pointer">
            {motherFolderName}
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900 font-bold underline decoration-red-200 underline-offset-8">
            {projectName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400">Back</Button>
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600 hover:text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-5 shadow-md shadow-indigo-100">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* [컬럼 1] 왼쪽 탭 */}
        <div className="w-64 border-r bg-[#F8F9FB] flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest px-1">원본 자료 (참고문서)</p>
                <div className="space-y-1">
                  {rawFiles.length > 0 ? rawFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-white rounded-xl cursor-pointer transition-all group">
                      <FileText className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                      <span className="truncate tracking-tight">{file}</span>
                    </div>
                  )) : <div className="px-3 py-2 text-[10px] text-slate-300 italic font-medium">데이터가 없습니다.</div>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI 인수인계서</span>
                  <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors">
                    {isHistoryOpen ? "닫기" : "기록보기"}
                  </button>
                </div>
                <div className="space-y-1">
                  {isHistoryOpen ? (
                    // 💡 전체 히스토리 리스트 (클릭 시 해당 버전 로드)
                    generatedManuals.map((name, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleLoadVersion(name)}
                        className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer transition-all shadow-sm ${currentFileName === name ? 'bg-white border border-red-100 text-red-500 font-bold' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
                      >
                        <FileText className={`w-4 h-4 ${currentFileName === name ? 'text-red-500' : 'opacity-70'}`} />
                        <span className="truncate tracking-tight">{name}</span>
                        {currentFileName === name && <div className="ml-auto w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                      </div>
                    ))
                  ) : (
                    // 최신 버전 하나만 노출
                    generatedManuals.length > 0 && (
                      <div 
                        onClick={() => handleLoadVersion(generatedManuals[0])}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl bg-white border border-red-100 text-red-500 font-bold shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-red-400" />
                        <span className="truncate tracking-tight">{generatedManuals[0]}</span>
                        <div className="ml-auto w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* [컬럼 2] 중앙 에디터 */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          <div className="px-12 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{projectName} 업무 매뉴얼</h1>
              {/* 💡 현재 작업 중인 파일명 표시 뱃지 */}
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">
                📄 {currentFileName || "로드 중..."}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">문서를 직접 수정하거나 Mayi 봇에게 도움을 요청하세요</p>
          </div>

          {/* 툴바 */}
          <div className="mx-12 mb-6 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-1 shrink-0 shadow-sm">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white text-slate-500"><Type className="w-4 h-4" /></Button>
            <div className="w-px h-4 bg-slate-200 mx-2" />
            <Button variant="ghost" size="sm" className="h-8 px-3 gap-2 text-xs font-bold text-slate-700 hover:bg-white border border-transparent rounded-lg">Heading 1 <ChevronDown className="w-3 h-3" /></Button>
            
            <div className="ml-auto pr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualSave}
                disabled={isSaving}
                className={`h-8 px-3 gap-2 text-xs font-bold transition-all ${isSaving ? 'text-slate-300' : 'text-slate-500 hover:text-red-500 hover:bg-white hover:border-red-50'}`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                저장하기
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-12 pb-20">
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-red-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-red-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-slate-600 font-black text-lg animate-pulse tracking-tight">{loadingStatus}</p>
                    <p className="text-slate-400 text-xs font-medium">최초 생성 시 분석을 위해 최대 1분 정도 소요될 수 있습니다.</p>
                  </div>
                </div>
              ) : (
                <textarea
                  className="w-full h-[1200px] text-[17px] text-slate-700 leading-[1.8] outline-none resize-none bg-transparent font-medium"
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="내용을 입력하세요..."
                />
              )}
            </div>
          </ScrollArea>

          {!isChatOpen && (
            <Button onClick={() => setIsChatOpen(true)} className="absolute bottom-10 right-10 w-16 h-16 rounded-[22px] bg-red-500 text-white shadow-2xl transition-all hover:scale-110 active:scale-95">
              <Sparkles className="w-7 h-7" />
            </Button>
          )}
        </div>

        {/* [컬럼 3] 오른쪽 봇 채팅 패널 */}
        {isChatOpen && (
          <div className="w-[340px] border-l bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-300 shadow-2xl z-20">
            <div className="h-14 border-b flex items-center justify-between px-5 bg-slate-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shadow-sm">
                  <Sparkles className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-[13px] font-black text-slate-900 leading-tight tracking-tight">Mayi 봇</div>
                  <div className="text-[9px] text-red-500 font-black uppercase tracking-tighter">AI Editor Assistant</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-8 w-8 p-0 text-slate-300 hover:text-slate-900">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-5 bg-[#FCFCFC]">
              <div className="space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[13px] shadow-sm font-medium ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-white text-slate-400 border border-slate-100 rounded-[20px] rounded-tl-none px-4 py-3 text-[13px] italic flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mayi 봇이 생각 중입니다...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-5 border-t">
              <div className="relative group">
                <Textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="메뉴얼에 수정사항이 있다면, 저장하기 버튼을 누르고 요청해주세요." 
                  className="min-h-[100px] pr-12 rounded-2xl border-slate-100 focus:ring-red-100 text-xs resize-none bg-slate-50/50 group-hover:bg-white transition-colors" 
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isChatLoading} 
                  size="sm" 
                  className="absolute bottom-3 right-3 w-9 h-9 bg-red-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300"
                >
                  {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}