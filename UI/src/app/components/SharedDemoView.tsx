// src/app/components/SharedDemoView.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  ChevronRight, ChevronDown, ChevronUp, Folder, FileText, Share2, 
  Send, Sparkles, X, Edit3, Eye, Clock, Database, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

interface SharedDemoViewProps {
  motherFolderName: string;
  projectName: string;
  onBack: () => void;
}

export function SharedDemoView({ motherFolderName, projectName, onBack }: SharedDemoViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPreview, setIsPreview] = useState(true);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `안녕하세요! 공유받으신 **'${projectName}'** 문서에 대해 궁금한 점을 물어보세요.` }
  ]);

  // 💡 표 렌더링 오류 해결을 위해 표 시작 전 빈 줄(\n\n)을 엄격히 추가했습니다.
  const demoContent = `
# 📌 커뮤니케이션 아카이브 프로젝트 인수인계서

## 📋 프로젝트 개요
**프로젝트명**: 커뮤니케이션 아카이브 시스템  
**담당 업무**: 고객 서비스(CS) 및 부서 간 협업 커뮤니케이션 관리  
**매핑 유형**: 🔄 운영/루틴형

## 🔄 주요 업무 사이클 및 프로세스

### 일간 업무 (Daily Tasks)

| 시간대 | 업무 내용 | 협업 부서 | 비고 |
|:---|:---|:---|:---|
| 09:00-10:00 | VOC(고객 문의) 현황 파악 및 일일 리포트 | 개발팀 | 어드민 다운로드 에러 시 반나절 단위로 분할 |
| 10:00-12:00 | 환불 요청 처리 및 전표 작성 | 재무팀 | 수요일 15시 마감 엄수 |
| 14:00-17:00 | 고객 클레임 응대 및 에스컬레이션 | 법무팀 | Level 3 케이스 시 즉시 보고 |

### 주간 업무 (Weekly Tasks)
- **매주 수요일**: 환불 전표 ERP 상신 (15시 마감)
- **매주 금요일**: 개발팀 핫픽스 배포 후 어드민 기능 검증

## 🚨 긴급 상황 대응 매뉴얼

### PG사(결제 대행) 장애 발생 시

**🔴 Level 1 - 일반 지연 불만**
\`\`\`
응대 스크립트: "고객님, 서비스 이용에 불편을 드려 대단히 죄송합니다. 
현재 접수해 주신 환불 건은 당사에서 정상적으로 취소 승인이 완료되었습니다."
\`\`\`

## 📇 주요 커뮤니케이션 연락망

| 이름 | 부서 | 직급 | 내선번호 | 이메일 | 협업 분야 |
|:---|:---|:---|:---|:---|:---|
| 이팀장 | CS팀 | 팀장 | 02-123-4567 | leader_lee@mayi-nexus.io | 에스컬레이션 총괄 |
| 박법무 | 법무팀 | 대리 | 0911 | legal_park@mayi-nexus.io | 고객 클레임 법적 검토 |
| 김재무 | 재무팀 | 대리 | - | - | 환불 전표 승인 |
| 박개발 | 개발팀 | 선임 | - | - | 어드민 시스템 기술 지원 |

---
*본 인수인계서는 2026년 4월 기준으로 작성되었습니다.*
  `;

  const handleSendQuery = async () => {
    if (!input.trim() || isChatLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/chat-query`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName, message: userMsg })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      }
    } catch (e) { console.error(e); } finally { setIsChatLoading(false); }
  };

  return (
    // 💡 최상위: h-screen과 overflow-hidden으로 전체 틀을 고정합니다.
    <div className="h-screen bg-[#FDFDFD] flex flex-col text-slate-900 font-sans overflow-hidden">
      
      {/* 상단바 (고정) */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-[60] shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-500 font-bold">📂 {motherFolderName}</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-blue-600 font-bold italic">Shared</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 font-bold">Back</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* [컬럼 1] 사이드바 (고정 스크롤) */}
        <div className="w-72 border-r bg-[#F8F9FB] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Shared Rooms</div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <Folder className="w-4 h-4 text-blue-600" />
              <span className="text-[13px] font-bold text-blue-700 truncate">{projectName}</span>
            </div>
          </div>
        </div>

        {/* [컬럼 2] 중앙 문서 영역 (독립 세로 스크롤) */}
        <div className="flex-1 bg-white flex flex-col min-w-0 overflow-hidden border-r">
          {/* 중앙 상단 고정 헤더 */}
          <div className="px-8 lg:px-12 pt-8 pb-4 shrink-0 bg-white/80 backdrop-blur-md">
             <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-bold">
                   <RefreshCw className="w-3 h-3" /> 운영/루틴형
                </div>
             </div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">{projectName}</h1>
          </div>

          {/* 중앙 상단 고정 툴바 */}
          <div className="mx-8 lg:mx-12 mb-4 p-2 bg-slate-50 rounded-xl flex items-center justify-between border shrink-0">
             <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                <Button variant={isPreview ? "default" : "ghost"} size="sm" onClick={() => setIsPreview(true)} className={`h-7 px-4 text-xs font-bold ${isPreview ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Preview</Button>
             </div>
             <div className="text-blue-600 font-bold text-[11px] flex items-center gap-2 px-3">
               <Clock className="w-3.5 h-3.5" /> Version 1.0
             </div>
          </div>

          {/* 💡 문서 본문: 이곳에 세로 스크롤(overflow-y-auto)을 적용했습니다. */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
            <div className="max-w-4xl mx-auto px-8 lg:px-12 py-6 pb-40">
              {/* 💡 표 가로 스크롤을 위해 overflow-x-auto 추가 */}
              <div className="prose prose-blue max-w-none prose-table:table-auto prose-table:w-full overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {demoContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* [컬럼 3] 오른쪽 챗봇 (독립 세로 스크롤) */}
        {isChatOpen && (
          <div className="w-[400px] xl:w-[450px] bg-white flex flex-col shrink-0 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
            {/* 챗봇 헤더 */}
            <div className="h-14 border-b flex items-center justify-between px-6 bg-blue-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-600 shadow-sm" />
                <div className="text-[14px] font-black text-slate-900">Mayi 헬퍼</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
            </div>
            
            {/* 💡 챗봇 대화창: 독립 세로 스크롤 */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FCFCFC] space-y-6 scrollbar-thin scrollbar-thumb-slate-100">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-[18px] px-4 py-3 text-[13.5px] shadow-sm font-medium leading-relaxed ${
                    m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'
                  }`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isChatLoading && <div className="text-xs text-slate-400 animate-pulse font-bold px-2">Mayi가 확인 중...</div>}
            </div>

            {/* 챗봇 입력창 (하단 고정) */}
            <div className="p-5 border-t bg-white shrink-0">
              <div className="relative">
                <Textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="무엇이든 물어보세요." 
                  className="min-h-[100px] pr-12 rounded-xl border-slate-200 bg-slate-50/50 p-4 text-sm resize-none focus:ring-2 ring-blue-100 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendQuery())}
                />
                <Button onClick={handleSendQuery} size="sm" className="absolute bottom-3 right-3 w-9 h-9 bg-blue-600 text-white rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all">
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