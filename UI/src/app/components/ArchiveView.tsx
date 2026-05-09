// src/app/components/ArchiveView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Library, 
  Loader2, 
  FolderOpen, 
  FileText, 
  Trash2, 
  User, 
  CheckCircle2 
} from 'lucide-react'; 
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ArchiveViewProps {
  // 마더폴더명(motherName)과 프로젝트명(projectName)을 함께 전달하여 에디터로 이동
  onProjectSelect: (motherName: string, projectName: string) => void;
}

export function ArchiveView({ onProjectSelect }: ArchiveViewProps) {
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('전체'); // '전체' | '내가 만든' | '공유받은'

  // --- 1. 아카이브 데이터 로드 (RESULT + SHARED 통합 데이터) ---
  const fetchArchive = async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/get-archive`);
      const data = await response.json();
      
      if (data.status === "success") {
        setArchiveData(data.archive);
      }
    } catch (error) {
      console.error("아카이브 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  // --- 2. 프로젝트 삭제 핸들러 ---
  const handleProjectDelete = async (e: React.MouseEvent, motherName: string, projectName: string) => {
    e.stopPropagation(); // 카드 클릭(에디터 이동) 이벤트 전파 방지

    if (!window.confirm(`'${projectName}' 주제를 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/delete-project`, {
        method: "POST",
        body: new URLSearchParams({ motherFolderName: motherName, projectName })
      });
      const result = await response.json();

      if (result.status === "success") {
        // 성공 시 화면(상태)에서 해당 카드 즉시 제거
        setArchiveData(prev => prev.filter(item => !(item.motherName === motherName && item.name === projectName)));
      } else {
        alert("삭제 실패: " + result.message);
      }
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // --- 3. 검색 및 탭 필터링 로직 ---
  const filteredData = archiveData.filter(item => {
    // A. 검색어 필터링 (주제명 또는 마더폴더명)
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.motherName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // B. 탭 필터링 (role 기반)
    // 'owner'는 '내가 만든' 폴더(RESULT), 'shared'는 '공유받은' 폴더(SHARED)
    if (activeTab === '내가 만든') return item.role === 'owner';
    if (activeTab === '공유받은') return item.role === 'shared';
    return true; // '전체' 탭일 경우 모든 데이터 반환
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-in fade-in duration-700">
      
      {/* [상단 섹션] 검색 및 탭 메뉴 */}
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="w-full max-w-2xl relative mb-10">
          <Search className="absolute left-6 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="업무 주제 또는 소속 프로젝트 검색"
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[30px] shadow-sm outline-none focus:ring-4 ring-blue-50 text-sm transition-all"
          />
        </div>

        {/* 필터 탭 바 */}
        <div className="flex gap-2 bg-slate-100/60 p-1.5 rounded-[20px]">
          {['전체', '내가 만든', '공유받은'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-[15px] text-xs font-black transition-all ${
                activeTab === tab 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* [카드 그리드 섹션] */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
          <p className="text-slate-400 text-sm font-medium italic">아카이브를 동기화하고 있습니다...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map((item, idx) => (
            <Card 
              key={`${item.motherName}-${item.name}-${idx}`} 
              onClick={() => onProjectSelect(item.motherName, item.name)} 
              className="group p-8 border-slate-50 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer rounded-[32px] bg-white relative overflow-hidden"
            >
              {/* 삭제 버튼 (호버 시 우측 상단 노출) */}
              <button 
                onClick={(e) => handleProjectDelete(e, item.motherName, item.name)}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"
                title="삭제하기"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* 상단: 권한 역할 배지 및 문서 정보 */}
              <div className="flex items-center justify-between mb-6">
                <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold text-[10px] ${
                  item.role === 'shared' 
                    ? 'bg-blue-50 text-blue-600' // 공유받은 문서는 파란색 테마
                    : 'bg-orange-50 text-orange-500' // 내가 만든 문서는 오렌지색 테마
                }`}>
                  {item.role === 'shared' ? <User className="w-3 h-3" /> : <FolderOpen className="w-3 h-3" />}
                  {item.role === 'shared' ? 'Shared' : item.motherName}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <FileText className="w-3 h-3" />
                  {item.fileCount} Docs
                </div>
              </div>

              {/* 중앙: 업무 주제명 (카드 타이틀) */}
              <h4 className="text-xl font-black text-slate-900 mb-8 group-hover:text-blue-600 transition-colors line-clamp-2 h-14 leading-tight">
                {item.name}
              </h4>

              {/* 하단: 생성자 정보 및 체크 아이콘 */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-[9px]">
                    {item.author?.[0] || 'N'}
                  </div>
                  <span>{item.author} · {item.date}</span>
                </div>
                
                {/* 공유받은 문서일 경우 완료/확인 아이콘 표시 */}
                {item.role === 'shared' && (
                   <div className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                   </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* [검색 결과 없음] */}
      {!isLoading && filteredData.length === 0 && (
        <div className="text-center py-32 bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100">
          <Library className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium italic">일치하는 업무 주제를 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}