// src/app/components/AIEditingView.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  Send, Sparkles, FileText, Loader2, 
  ChevronDown, ChevronUp, ChevronRight, Share2, Trash2, 
  Save, X, Eye, Edit3, ZoomIn, ZoomOut, Search,
  Database, Info, LayoutList, History, FolderOpen, Folder,
  Code, RefreshCw, Users, Megaphone, Kanban, Clock, Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

interface AIEditingViewProps {
  motherFolderName: string;   // 최상단 프로젝트 명
  projects: any;              // AI가 분류한 전체 주제 객체 { "주제명": ["파일리스트"] }
  initialProjectName: string; // 처음 진입 시 선택된 주제명
  onBack: () => void;         // 이전 화면으로 이동
  onProjectChange?: (name: string) => void; // 주제 변경 시 부모에게 알림
}

export function AIEditingView({ 
  motherFolderName, 
  projects, 
  initialProjectName, 
  onBack,
  onProjectChange 
}: AIEditingViewProps) {
  // --- 1. 상태 관리 ---
  const [currentProject, setCurrentProject] = useState(initialProjectName); 
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set([initialProjectName])); // 폴더 열림 상태
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [isChatLoading, setIsChatLoading] = useState(false); 
  
  const [isPreview, setIsPreview] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [isOriginalsExpanded, setIsOriginalsExpanded] = useState(false); 
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [isRefPopupOpen, setIsRefPopupOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [currentFileName, setCurrentFileName] = useState(""); 
  const [rawFiles, setRawFiles] = useState<string[]>([]);    
  const [themeFiles, setThemeFiles] = useState<string[]>([]); 
  const [generatedManuals, setGeneratedManuals] = useState<string[]>([]);
  const [aiState, setAiState] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 업무 성격 매핑
  const [workType, setWorkType] = useState<string>("OPERATION"); 
  const workTypeMap: any = {
    "PROJECT": { label: "프로젝트/개발형", icon: <Code className="w-3 h-3" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
    "OPERATION": { label: "운영/루틴형", icon: <RefreshCw className="w-3 h-3" />, color: "text-emerald-600 bg-green-50 border-green-100" },
    "SALES": { label: "영업/대외협력형", icon: <Users className="w-3 h-3" />, color: "text-amber-600 bg-orange-50 border-orange-100" },
    "MARKETING": { label: "캠페인/마케팅형", icon: <Megaphone className="w-3 h-3" />, color: "text-pink-600 bg-pink-50 border-pink-100" },
  };

  const projectList = projects ? Object.keys(projects) : [];

  // --- 2. 데이터 로드 ---
  useEffect(() => {
    const fetchManualData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/generate-manual`, {
          method: "POST",
          body: new URLSearchParams({ motherFolderName, projectName: currentProject })
        });
        const data = await res.json();
        
        if (data.status === "success") {
          setMarkdownContent(data.content || "");
          setRawFiles(data.mother_all_files || []); 
          setThemeFiles(data.raw_files || []);      
          setGeneratedManuals(data.version_list || []);
          setCurrentFileName(data.version_list?.[0] || "");
          setAiState(data.new_state);
          setMessages([{ role: 'assistant', content: `'${currentProject}' 업무 룸의 보고서 스타일 매뉴얼입니다. 수정이 필요하면 말씀해 주세요.` }]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentProject) fetchManualData();
  }, [currentProject, motherFolderName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHistoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVersionBadgeInfo = (fileName: string) => {
    if (!fileName || typeof fileName !== 'string') {
      return { text: "AI 분석 완료", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    }
    const match = fileName.match(/manual_draft_(\d+)\.md/);
    if (match) return { text: `Ver ${match[1]}.0 생성됨`, style: "bg-indigo-50 text-indigo-500 border-indigo-100" };
    return { text: "AI 분석 완료", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  };

  // --- 3. 핸들러 함수들 ---
  
  const toggleFolder = (name: string) => {
    const newSet = new Set(expandedRooms);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedRooms(newSet);
  };

  const handleRoomChange = (name: string) => {
    if (currentProject === name) return;
    setCurrentProject(name);
    if (onProjectChange) onProjectChange(name);
  };

  const handleLoadVersion = async (fileName: string) => {
    setIsHistoryDropdownOpen(false);
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/get-version-content`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName: currentProject, fileName })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMarkdownContent(data.content);
        setCurrentFileName(fileName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/save-manual-overwrite`, {
        method: "POST",
        body: new URLSearchParams({ 
          motherFolderName, 
          projectName: currentProject, 
          fileName: currentFileName, 
          content: markdownContent 
        })
      });
      const data = await res.json();
      if (data.status === "success" && data.version_list) {
        setGeneratedManuals(data.version_list); // 히스토리 즉시 동기화
        alert("저장되었습니다.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;
    const userMsg = input; setInput(''); setIsChatLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/chat-edit`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName: currentProject, message: userMsg, state: aiState })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMarkdownContent(data.updated_content);
        setGeneratedManuals(data.version_list);
        setCurrentFileName(data.new_version_name);
        setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleZoomReset = () => setZoomLevel(100);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden font-sans relative text-slate-900">
      
      {/* 상단 네비게이션 */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
            <span className="opacity-40">📊</span> {motherFolderName}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-red-500 font-bold italic">AI Handover Agent</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 font-medium hover:text-slate-900">Back</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-5 shadow-md shadow-indigo-100">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* [컬럼 1] 왼쪽 사이드바: 폴더 트리 및 주황색 활성화 스타일 */}
        <div className="w-80 border-r bg-[#F8F9FB] flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-8">
              
              <div>
                <button className="flex items-center justify-between w-full mb-6 px-1 group">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">AI 인수인계서</span>
                  <ChevronUp className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                </button>

                <div className="space-y-1">
                  {projectList.map((name) => (
                    <div key={name} className="flex flex-col">
                      <button 
                        onClick={() => toggleFolder(name)}
                        className="flex items-center gap-2.5 px-3 py-2.5 w-full text-left hover:bg-slate-100 rounded-xl transition-colors group"
                      >
                        {expandedRooms.has(name) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <Folder className={`w-4 h-4 ${expandedRooms.has(name) ? 'text-slate-600' : 'text-slate-400'}`} />
                        <span className="text-[13px] font-bold text-slate-700 truncate">{name}</span>
                      </button>

                      {expandedRooms.has(name) && (
                        <div className="ml-6 mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                          {/* 활성화: 보고서 스타일 */}
                          <button 
                            onClick={() => handleRoomChange(name)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${
                              currentProject === name 
                                ? 'bg-orange-50 border-orange-100 shadow-sm text-orange-600' 
                                : 'border-transparent hover:bg-white text-slate-500'
                            }`}
                          >
                            <FileText className={`w-3.5 h-3.5 ${currentProject === name ? 'text-orange-500' : 'text-slate-400'}`} />
                            <span className="text-[12px] font-bold">업무 매뉴얼 (보고서 STYLE)</span>
                          </button>

                          {/* 비활성화 항목들 */}
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60">
                            <Kanban className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-bold">워크플로우 스타일</span>
                          </div>
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-bold">캘린더 스타일</span>
                          </div>
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60">
                            <LayoutList className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-bold">칸반 보드 스타일</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 원본 자료 리스트 */}
              <div className="pt-4 border-t border-slate-200">
                <button 
                  onClick={() => setIsOriginalsExpanded(!isOriginalsExpanded)}
                  className="flex items-center justify-between w-full mb-3 px-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <LayoutList className="w-3 h-3" /> 전체 원본 자료 (Raw)
                  </span>
                  {isOriginalsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {isOriginalsExpanded && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {rawFiles.length > 0 ? rawFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-500 hover:bg-white rounded-xl truncate">
                        <FileText className="w-3 h-3 opacity-30" />
                        <span className="truncate tracking-tight">{f}</span>
                      </div>
                    )) : (
                      <div className="px-3 py-2 text-[10px] text-slate-300 italic">파일이 없습니다.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* [컬럼 2] 중앙 에디터 영역: 스크롤 이슈 개선 */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          
          <div className="px-12 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-2 mb-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">분석된 성격</span>
               <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold shadow-sm ${workTypeMap[workType].color}`}>
                 {workTypeMap[workType].icon} {workTypeMap[workType].label}
               </div>
            </div>
            
            <div className="flex items-center gap-3 mb-2 relative">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{currentProject} 업무 매뉴얼</h1>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm ${getVersionBadgeInfo(currentFileName).style}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {getVersionBadgeInfo(currentFileName).text}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isHistoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isHistoryDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-black text-slate-400 p-2 uppercase tracking-widest border-b border-slate-50 mb-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> 히스토리 버전 목록
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      {generatedManuals?.map((name, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleLoadVersion(name)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs rounded-xl transition-all ${currentFileName === name ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          {i === 0 ? <Sparkles className="w-3 h-3" /> : <FileText className="w-3 h-3 opacity-30" />}
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">이 매뉴얼은 {themeFiles.length}개의 문서를 종합하여 생성되었습니다.</p>
          </div>

          {/* 에디터 툴바 */}
          <div className="mx-12 mb-6 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 shrink-0 shadow-sm">
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
              <Button variant={!isPreview ? "default" : "ghost"} size="sm" onClick={() => setIsPreview(false)} className={`h-8 px-3 gap-2 text-xs font-bold ${!isPreview ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Edit3 className="w-3.5 h-3.5" /> Edit</Button>
              <Button variant={isPreview ? "default" : "ghost"} size="sm" onClick={() => setIsPreview(true)} className={`h-8 px-3 gap-2 text-xs font-bold ${isPreview ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Eye className="w-3.5 h-3.5" /> Preview</Button>
            </div>
            
            <div className="w-px h-4 bg-slate-200 mx-1" />
            
            <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 gap-1 shadow-sm">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"><ZoomOut className="w-4 h-4" /></Button>
              <button onClick={handleZoomReset} className="px-2 text-[11px] font-black text-slate-600 min-w-[45px] hover:text-indigo-600">
                {zoomLevel}%
              </button>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"><ZoomIn className="w-4 h-4" /></Button>
            </div>

            <div className="ml-auto pr-1">
              <Button onClick={handleManualSave} disabled={isSaving} variant="ghost" size="sm" className="h-8 px-3 gap-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-white transition-all">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 저장하기
              </Button>
            </div>
          </div>

          {/* 에디터 본문: ScrollArea 내부 레이아웃 최적화 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-12 pb-20">
              <div 
                key={currentProject + currentFileName}
                className="max-w-4xl mx-auto transition-all duration-300 text-left py-4"
                style={{ zoom: `${zoomLevel}%`, transformOrigin: 'top center' }}
              >
                {isLoading ? (
                  <div className="py-32 text-center text-slate-300 font-bold animate-pulse italic">
                     {currentProject} 룸의 데이터를 불러오는 중입니다...
                  </div>
                ) : isPreview ? (
                  <div className="prose prose-slate max-w-none prose-table:border prose-th:bg-slate-50 prose-td:border-t p-4 min-h-[800px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdownContent}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea 
                    className="w-full min-h-[1200px] text-[17px] text-slate-700 leading-[1.8] outline-none resize-none bg-transparent font-medium p-4" 
                    value={markdownContent} 
                    onChange={(e) => setMarkdownContent(e.target.value)} 
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 하단 유틸리티 및 챗봇 버튼 */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-4 z-30">
            {isRefPopupOpen && (
              <div className="w-72 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-[28px] shadow-2xl p-5 animate-in slide-in-from-bottom-3 duration-300">
                <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-tighter flex items-center gap-2">
                  <Database className="w-3 h-3" /> 이 업무의 기반 문서 ({themeFiles.length})
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {themeFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 truncate">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsRefPopupOpen(!isRefPopupOpen)}
                className={`h-11 px-5 rounded-full text-[12px] font-bold shadow-xl transition-all flex items-center gap-2.5 border ${isRefPopupOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
              >
                인용된 자료 <span className="text-indigo-500 font-black">{themeFiles.length}</span>
              </button>
              
              {!isChatOpen && (
                <Button 
                  onClick={() => setIsChatOpen(true)} 
                  className="w-16 h-16 rounded-[22px] bg-red-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Sparkles className="w-7 h-7" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* [컬럼 3] Mayi 봇 채팅 패널 */}
        {isChatOpen && (
          <div className="w-[360px] border-l bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-300 shadow-2xl z-40">
            <div className="h-14 border-b flex items-center justify-between px-5 bg-slate-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shadow-sm"><Sparkles className="w-4 h-4 text-red-500" /></div>
                <div><div className="text-[13px] font-black text-slate-900 leading-tight">Mayi 봇</div><div className="text-[9px] text-red-500 font-black uppercase">Room Assistant</div></div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-8 w-8 p-0 text-slate-300 hover:text-slate-900"><X className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="flex-1 p-5 bg-[#FCFCFC]">
              <div className="space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[13px] shadow-sm font-medium ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>{m.content}</div>
                  </div>
                ))}
                {isChatLoading && <div className="flex justify-start italic text-[12px] text-slate-400 gap-2 p-4"><Loader2 className="w-3 h-3 animate-spin" /> 생각 중...</div>}
              </div>
            </ScrollArea>
            <div className="p-5 border-t bg-white">
              <div className="relative group">
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="매뉴얼 수정을 요청해 보세요." className="min-h-[100px] pr-12 rounded-2xl border-slate-100 text-xs resize-none bg-slate-50/50 outline-none" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} />
                <Button onClick={handleSend} disabled={!input.trim() || isChatLoading} size="sm" className="absolute bottom-3 right-3 w-9 h-9 bg-red-500 text-white rounded-xl shadow-md transition-transform active:scale-90"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}