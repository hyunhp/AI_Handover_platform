import React, { useState, useEffect } from 'react';
import { 
  Send, Sparkles, Download, FileText, Loader2, 
  ChevronDown, ChevronRight, Share2, Trash2, 
  Bold, Italic, List, ListOrdered, Type, Save, X 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

interface AIEditingViewProps {
  motherFolderName: string;
  projectName: string;
  onBack: () => void;
}

export function AIEditingView({ motherFolderName, projectName, onBack }: AIEditingViewProps) {
  // --- 상태 관리 ---
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [aiState, setAiState] = useState(JSON.stringify({ phase: "DRAFTING", current_project: projectName }));

  // --- 초기 데이터 로드 (ManualArchitect 호출) ---
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("http://3.39.11.5:8000/api/generate-manual", {
          method: "POST",
          body: new URLSearchParams({ motherFolderName, projectName })
        });
        const data = await res.json();
        if (data.status === "success") {
          setMarkdownContent(data.content);
          setMessages([{ 
            role: 'assistant', 
            content: `안녕하세요! ${projectName} 프로젝트의 매뉴얼 초안을 작성했습니다. 왼쪽의 원본 자료를 바탕으로 구성되었으며, 수정이 필요한 부분은 언제든 말씀해 주세요.` 
          }]);
        }
      } catch (e) {
        setMessages([{ role: 'assistant', content: "초안 생성 중 오류가 발생했습니다." }]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [motherFolderName, projectName]);

  // --- AI 채팅 및 편집 요청 (Orchestrator 호출) ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // .env에 설정한 변수를 가져옵니다.
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/chat-edit`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName, message: userMsg, state: aiState })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      setAiState(data.new_state);
      if (data.updated_content) setMarkdownContent(data.updated_content);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "에러가 발생했습니다." }]);
    }
  };

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden font-sans">
      {/* 상단 툴바 */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
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
        {/* [컬럼 1] 왼쪽: 자료 목록 (Raw Data & Generated List) */}
        <div className="w-64 border-r bg-[#F8F9FB] flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* 원본 자료 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-2 px-2 text-slate-500 hover:text-slate-900 cursor-pointer group">
                  <span className="text-xs font-bold uppercase tracking-wider">원본 자료 (raw data)</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-white rounded-lg cursor-pointer">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="truncate">참고_가이드라인.pdf</span>
                  </div>
                </div>
              </div>

              {/* 생성된 매뉴얼 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-2 px-2 text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">AI 인수인계서</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg font-medium cursor-pointer">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{projectName} 업무 매뉴얼</span>
                    <div className="ml-auto w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  </div>
                  {['A 업무 보드', 'B 업무 보드', '업무 캘린더'].map((item) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-white rounded-lg cursor-pointer transition-colors">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* [컬럼 2] 중앙: 문서 에디터 */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          {/* 에디터 헤더 */}
          <div className="px-12 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-3xl font-bold text-slate-900">{projectName} 업무 매뉴얼</h1>
              <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full border border-red-100">
                ● AI 수정 반영됨
              </span>
            </div>
            <p className="text-slate-400 text-sm">문서를 직접 수정하거나 Mayi 봇에게 도움을 요청하세요</p>
          </div>

          {/* 에디터 툴바 */}
          <div className="mx-12 mb-6 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Type className="w-4 h-4" /></Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-bold">Heading 1 <ChevronDown className="w-3 h-3" /></Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Bold className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Italic className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><List className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ListOrdered className="w-4 h-4" /></Button>
            <div className="ml-auto flex items-center gap-2 pr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400"><Save className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* 문서 본문 영역 */}
          <ScrollArea className="flex-1 px-12 pb-20">
            <div className="max-w-3xl mx-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                  <p className="font-medium">AI가 문서를 구성하고 있습니다...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {markdownContent}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 우측 하단 Mayi 봇 플로팅 버튼 (채팅이 닫혀있을 때) */}
          {!isChatOpen && (
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-red-400 hover:bg-red-500 shadow-xl shadow-red-200 text-white p-0 group transition-all"
            >
              <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white" />
            </Button>
          )}
        </div>

        {/* [컬럼 3] 오른쪽: Mayi 봇 채팅 (Orchestrator 연동) */}
        {isChatOpen && (
          <div className="w-[380px] border-l bg-[#FDFDFD] flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
            <div className="h-14 border-b flex items-center justify-between px-5 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Mayi 봇</div>
                  <div className="text-[10px] text-red-500 font-medium">AI Editor Assistant</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-5 bg-[#F9FAFB]/30">
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-white border-t">
              <div className="relative">
                <Textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="수정 요청사항을 입력하세요..."
                  rows={2}
                  className="resize-none pr-12 rounded-xl border-slate-100 focus:ring-red-100 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim()}
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