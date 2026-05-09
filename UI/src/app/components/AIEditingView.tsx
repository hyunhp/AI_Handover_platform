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
  Code, RefreshCw, Users, Megaphone, Kanban, Clock, Calendar,
  Mail, UserPlus, ShieldCheck, User
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
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set([initialProjectName])); // 아코디언 상태
  
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

  // 공유 모달 관련 상태
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('read'); // 'read' | 'write'

  const [currentFileName, setCurrentFileName] = useState(""); 
  const [rawFiles, setRawFiles] = useState<string[]>([]);    
  const [themeFiles, setThemeFiles] = useState<string[]>([]); 
  const [generatedManuals, setGeneratedManuals] = useState<string[]>([]);
  const [aiState, setAiState] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 업무 성격 매핑 및 안전 장치
  const [workType, setWorkType] = useState<string>("OPERATION"); 
  const workTypeMap: any = {
    "PROJECT": { label: "프로젝트/개발형", icon: <Code className="w-3 h-3" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
    "OPERATION": { label: "운영/루틴형", icon: <RefreshCw className="w-3 h-3" />, color: "text-emerald-600 bg-green-50 border-green-100" },
    "SALES": { label: "영업/대외협력형", icon: <Users className="w-3 h-3" />, color: "text-amber-600 bg-orange-50 border-orange-100" },
    "MARKETING": { label: "캠페인/마케팅형", icon: <Megaphone className="w-3 h-3" />, color: "text-pink-600 bg-pink-50 border-pink-100" },
  };
  const currentWorkTypeInfo = workTypeMap[workType] || workTypeMap["OPERATION"];

  const projectList = projects ? Object.keys(projects) : [];

  // --- 2. 데이터 로드 로직 ---
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
          setMessages([{ role: 'assistant', content: `'${currentProject}' 룸에 입장하셨습니다. 매뉴얼을 확인해보세요.` }]);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
    if (!fileName || typeof fileName !== 'string') return { text: "AI 분석 완료", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
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
    } finally { setIsLoading(false); }
  };

  const handleManualSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/save-manual-overwrite`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName: currentProject, fileName: currentFileName, content: markdownContent })
      });
      const data = await res.json();
      if (data.status === "success" && data.version_list) {
        setGeneratedManuals(data.version_list); // 히스토리 즉시 갱신
        alert("저장되었습니다.");
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
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
        setGeneratedManuals(data.version_list); // 히스토리 즉시 갱신
        setCurrentFileName(data.new_version_name);
        setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      }
    } finally { setIsChatLoading(false); }
  };

  const handleShareSubmit = async (isToMe: boolean = false) => {
    const targetEmail = isToMe ? "me@megazone.com" : shareEmail;
    if (!targetEmail) return alert("이메일을 입력해주세요.");
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      await fetch(`${baseUrl}/api/share-project`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName: currentProject, email: targetEmail, permission: sharePermission })
      });
      alert(`${targetEmail}님께 공유되었습니다.`);
      setIsShareModalOpen(false);
    } catch (e) { console.error(e); }
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
          <Button size="sm" onClick={() => setIsShareModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-5 shadow-md shadow-indigo-100">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* [컬럼 1] 왼쪽 사이드바: 폴더 트리 구조 */}
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
                        className={`flex items-center gap-2.5 px-3 py-2.5 w-full text-left hover:bg-slate-100 rounded-xl transition-colors group ${currentProject === name ? 'bg-slate-50' : ''}`}
                      >
                        {expandedRooms.has(name) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <Folder className={`w-4 h-4 ${expandedRooms.has(name) ? 'text-slate-600' : 'text-slate-400'}`} />
                        <span className="text-[13px] font-bold text-slate-700 truncate">{name}</span>
                      </button>

                      {expandedRooms.has(name) && (
                        <div className="ml-6 mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
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
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60"><Kanban className="w-3.5 h-3.5" /><span className="text-[12px] font-bold ml-1">워크플로우 스타일</span></div>
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60"><Calendar className="w-3.5 h-3.5" /><span className="text-[12px] font-bold ml-1">캘린더 스타일</span></div>
                          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 cursor-not-allowed opacity-60"><LayoutList className="w-3.5 h-3.5" /><span className="text-[12px] font-bold ml-1">칸반 보드 스타일</span></div>
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
                  <div className="space-y-1">
                    {rawFiles.length > 0 ? rawFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-500 hover:bg-white rounded-xl truncate">
                        <FileText className="w-3 h-3 opacity-30" />
                        <span className="truncate tracking-tight">{f}</span>
                      </div>
                    )) : <div className="px-3 py-2 text-[10px] text-slate-300 italic">파일이 없습니다.</div>}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* [컬럼 2] 중앙 에디터 영역 (스크롤 개선 및 히스토리) */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          
          <div className="px-12 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-2 mb-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">분석된 성격</span>
               <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold shadow-sm ${currentWorkTypeInfo.color}`}>
                 {currentWorkTypeInfo.icon} {currentWorkTypeInfo.label}
               </div>
            </div>
            
            <div className="flex items-center gap-3 mb-2 relative">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{currentProject} 업무 매뉴얼</h1>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm ${getVersionBadgeInfo(currentFileName).style}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
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
            <p className="text-slate-400 text-sm font-medium">이 매뉴얼은 {themeFiles.length}개의 문서를 종합하여 보고서 스타일로 생성되었습니다.</p>
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
              <button onClick={handleZoomReset} className="px-2 text-[11px] font-black text-slate-600 min-w-[45px] hover:text-indigo-600">{zoomLevel}%</button>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"><ZoomIn className="w-4 h-4" /></Button>
            </div>

            <div className="ml-auto pr-1">
              <Button onClick={handleManualSave} disabled={isSaving} variant="ghost" size="sm" className="h-8 px-3 gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 저장하기
              </Button>
            </div>
          </div>

          {/* 에디터 본문: flex-1 overflow-hidden으로 스크롤 이슈 해결 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-12 pb-20">
              <div 
                key={currentProject + currentFileName}
                className="max-w-4xl mx-auto transition-all duration-300 text-left py-10"
                style={{ zoom: `${zoomLevel}%`, transformOrigin: 'top center' }}
              >
                {isLoading ? (
                  <div className="py-32 text-center text-slate-300 font-bold animate-pulse italic">AI가 인수인계 문서를 작성 중에 있습니다...</div>
                ) : isPreview ? (
                  <div className="prose prose-slate max-w-none prose-table:border prose-th:bg-slate-50 p-4 min-h-[1000px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdownContent}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea 
                    className="w-full min-h-[1200px] text-[17px] text-slate-700 leading-[1.8] outline-none resize-none bg-transparent font-medium p-4 border-none focus:ring-0" 
                    value={markdownContent} 
                    onChange={(e) => setMarkdownContent(e.target.value)} 
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 플로팅 툴 */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-4 z-30">
            {isRefPopupOpen && (
              <div className="w-72 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-[28px] shadow-2xl p-5 animate-in slide-in-from-bottom-3 duration-300">
                <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-tighter flex items-center gap-2"><Database className="w-3 h-3" /> 기반 문서 ({themeFiles.length})</p>
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
              <button onClick={() => setIsRefPopupOpen(!isRefPopupOpen)} className={`h-11 px-5 rounded-full text-[12px] font-bold shadow-xl transition-all flex items-center gap-2.5 border ${isRefPopupOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                인용 자료 <span className="text-indigo-500 font-black">{themeFiles.length}</span>
              </button>
              {!isChatOpen && <Button onClick={() => setIsChatOpen(true)} className="w-16 h-16 rounded-[22px] bg-red-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"><Sparkles className="w-7 h-7" /></Button>}
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
                <Button onClick={handleSend} disabled={!input.trim() || isChatLoading} size="sm" className="absolute bottom-3 right-3 w-9 h-9 bg-red-500 text-white rounded-xl shadow-md active:scale-90"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* [공유 설정 모달] */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[480px] rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> 공유하기
              </h3>
              <Button variant="ghost" onClick={() => setIsShareModalOpen(false)} className="rounded-full w-8 h-8 p-0"><X className="w-4 h-4"/></Button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">초대할 이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 inset-y-0 my-auto w-4 h-4 text-slate-300" />
                  <input 
                    value={shareEmail} onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="name@megazone.com" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-100 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">권한 설정</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSharePermission('read')} className={`p-4 rounded-2xl border-2 transition-all text-left ${sharePermission === 'read' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100'}`}>
                    <ShieldCheck className={`w-5 h-5 mb-2 ${sharePermission === 'read' ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <div className="text-[13px] font-bold text-slate-800">읽기 가능</div>
                    <p className="text-[10px] text-slate-500">열람 및 채팅만 가능</p>
                  </button>
                  <button onClick={() => setSharePermission('write')} className={`p-4 rounded-2xl border-2 transition-all text-left ${sharePermission === 'write' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100'}`}>
                    <Edit3 className={`w-5 h-5 mb-2 ${sharePermission === 'write' ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <div className="text-[13px] font-bold text-slate-800">편집 가능</div>
                    <p className="text-[10px] text-slate-500">내용 수정 및 저장 가능</p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button onClick={() => handleShareSubmit(false)} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-bold">공유 초대 보내기</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}