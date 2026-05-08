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
  motherFolderName: string; // 마더 폴더명 (예: 411)
  projectName: string;      // 선택된 하위 프로젝트명 (예: 신입사원 온보딩)
  onBack: () => void;
}

export function AIEditingView({ motherFolderName, projectName, onBack }: AIEditingViewProps) {
  // --- 상태 관리 ---
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); // 👈 기본값 숨김 처리
  const [aiState, setAiState] = useState(JSON.stringify({ phase: "DRAFTING", current_project: projectName }));
  
  // 파일 목록 관리 (왼쪽 탭 연동)
  const [rawFiles, setRawFiles] = useState<string[]>([]);
  const [generatedManuals, setGeneratedManuals] = useState<string[]>(["기본 매뉴얼 초안"]);

  // --- 1. 초기 데이터 로드 (파일 목록 및 초안 가져오기) ---
  useEffect(() => {
    const init = async () => {
      try {
        // 서버에서 해당 프로젝트의 파일 목록과 매뉴얼을 가져오는 로직 연동
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res     = await fetch(`${baseUrl}/api/generate-manual`, {
          method: "POST",
          body: new URLSearchParams({ motherFolderName, projectName })
        });
        const data = await res.json();
        
        if (data.status === "success") {
          setMarkdownContent(data.content);
          // 실제 파일 목록이 있다면 여기서 업데이트
          setMessages([{ role: 'assistant', content: `안녕하세요! '${projectName}' 프로젝트 분석이 완료되었습니다. 무엇을 도와드릴까요?` }]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [motherFolderName, projectName]);

  // --- 2. AI 편집 요청 (새 파일 생성 로직 포함) ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // 💡 덮어씌우지 않고 새 파일을 만들기 위해 서버에 'save_as_new' 플래그 전달 가능
      const res = await fetch("http://3.39.11.5:8000/api/chat-edit", {
        method: "POST",
        body: new URLSearchParams({ 
          motherFolderName, 
          projectName, 
          message: userMsg, 
          state: aiState,
          mode: "versioning" // 새 버전 생성을 위한 요청 플래그
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      setAiState(data.new_state);
      
      if (data.updated_content) {
        setMarkdownContent(data.updated_content);
        // 새 버전이 생성되었다면 왼쪽 목록에 추가 
        const newVersionName = `수정된 매뉴얼 (${new Date().toLocaleTimeString()})`;
        setGeneratedManuals(prev => [newVersionName, ...prev]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "수정 요청 처리 중 에러가 발생했습니다." }]);
    }
  };

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden font-sans relative">
      {/* 상단 헤더  */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-900 cursor-pointer">인수인계 AI Agent</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">AI 인수인계서</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">Back</Button>
          <Button variant="outline" size="sm" className="gap-2 border-slate-200">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* [컬럼 1] 왼쪽 탭: 프로젝트별 파일 트리 [cite: 7, 8] */}
        <div className="w-64 border-r bg-[#F8F9FB] flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* 원본 자료 목록  */}
              <div>
                <div className="flex items-center justify-between mb-2 px-2 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-widest">원본 자료 (raw data)</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <div className="space-y-1">
                  {/* 실제 해당 프로젝트 폴더 내 파일 연동 가능 */}
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-white rounded-lg cursor-pointer transition-colors">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="truncate text-xs tracking-tight">참고_가이드라인.pdf</span>
                  </div>
                </div>
              </div>

              {/* AI 인수인계서 하위 목록 [cite: 8, 9] */}
              <div>
                <div className="flex items-center justify-between mb-2 px-2 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI 인수인계서</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <div className="space-y-1">
                  {generatedManuals.map((name, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-all ${
                        i === 0 ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="truncate text-xs tracking-tight">{name}</span>
                      {i === 0 && <div className="ml-auto w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* [컬럼 2] 중앙: Editing 화면 및 툴바  */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          {/* 타이틀 영역  */}
          <div className="px-12 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{projectName} 업무 매뉴얼</h1>
              <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full border border-red-100">
                ● AI 수정 반영됨
              </span>
            </div>
            <p className="text-slate-400 text-sm">문서를 직접 수정하거나 Mayi 봇에게 도움을 요청하세요</p>
          </div>

          {/* 에디터 툴바  */}
          <div className="mx-12 mb-6 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1 shrink-0 shadow-sm">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white"><Type className="w-4 h-4 text-slate-600" /></Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-bold text-slate-700 hover:bg-white">Heading 1 <ChevronDown className="w-3 h-3" /></Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white"><Bold className="w-4 h-4 text-slate-600" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white"><Italic className="w-4 h-4 text-slate-600" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white"><List className="w-4 h-4 text-slate-600" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white"><ListOrdered className="w-4 h-4 text-slate-600" /></Button>
            <div className="ml-auto pr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"><Save className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* 본문 텍스트 영역 (Editing 가능)  */}
          <ScrollArea className="flex-1 px-12 pb-20">
            <div className="max-w-3xl mx-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                  <p className="text-slate-400 font-medium">매뉴얼 내용을 불러오는 중입니다...</p>
                </div>
              ) : (
                <textarea
                  className="w-full h-[1000px] text-lg text-slate-800 leading-relaxed outline-none resize-none bg-transparent prose prose-slate"
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                />
              )}
            </div>
          </ScrollArea>

          {/* [우측 하단] Mayi 봇 플로팅 버튼  */}
          {!isChatOpen && (
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-red-400 hover:bg-red-500 shadow-2xl shadow-red-200 text-white p-0 group transition-all duration-300 hover:scale-110"
            >
              <div className="relative">
                <Sparkles className="w-6 h-6" />
                <div className="absolute -top-4 -right-2 bg-slate-900 text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Mayi 봇에게 묻기
                </div>
              </div>
            </Button>
          )}
        </div>

        {/* [컬럼 3] 오른쪽 탭: Mayi 봇 채팅창 [cite: 9, 10] */}
        {isChatOpen && (
          <div className="w-80 border-l bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
            <div className="h-14 border-b flex items-center justify-between px-5 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mayi 봇</div>
                  <div className="text-[10px] text-red-400 font-medium tracking-tight">AI Editor Assistant</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13px] shadow-sm leading-snug ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <div className="relative">
                <Textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="수정 요청사항을 입력하세요..."
                  className="min-h-[80px] pr-10 rounded-xl border-slate-100 focus:ring-red-100 text-xs resize-none"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  size="sm"
                  className="absolute bottom-2 right-2 w-8 h-8 p-0 bg-red-400 hover:bg-red-500 text-white rounded-lg transition-all disabled:bg-slate-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}