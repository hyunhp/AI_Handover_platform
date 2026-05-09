// src/app/components/ArchiveView.tsx 전체 수정본

import React, { useState, useEffect } from 'react';
import { Search, Library, Loader2, FolderOpen, FileText, Trash2 } from 'lucide-react'; 
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ArchiveViewProps {
  onProjectSelect: (motherName: string, projectName: string) => void;
}

export function ArchiveView({ onProjectSelect }: ArchiveViewProps) {
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 데이터 로드
  const fetchArchive = async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/get-archive`);
      const data = await response.json();
      if (data.status === "success") setArchiveData(data.archive);
    } catch (error) {
      console.error("아카이브 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  // 💡 2. 삭제 핸들러
  const handleProjectDelete = async (e: React.MouseEvent, motherName: string, projectName: string) => {
    e.stopPropagation(); // 💡 중요: 카드 클릭 이벤트(이동)가 발생하지 않도록 차단

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
        // 성공 시 화면에서 해당 카드 즉시 제거
        setArchiveData(prev => prev.filter(item => !(item.motherName === motherName && item.name === projectName)));
      } else {
        alert("삭제 실패: " + result.message);
      }
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const filteredData = archiveData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.motherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-in fade-in duration-700">
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="w-full max-w-2xl relative mb-8">
          <Search className="absolute left-5 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="업무 주제 또는 소속 프로젝트 검색"
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 ring-indigo-100 text-sm transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
          <p className="text-slate-400 text-sm font-medium">아카이브를 불러오고 있습니다...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map((item, idx) => (
            <Card 
              key={idx} 
              onClick={() => onProjectSelect(item.motherName, item.name)} 
              className="group p-8 border-slate-50 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer rounded-[32px] bg-white relative overflow-hidden"
            >
              {/* 💡 삭제 버튼 추가 */}
              <button 
                onClick={(e) => handleProjectDelete(e, item.motherName, item.name)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"
                title="삭제하기"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold text-[10px] ${item.color === 'orange' ? 'bg-orange-50 text-orange-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  <FolderOpen className="w-3 h-3" />
                  {item.motherName}
                </div>
              </div>

              <h4 className="text-xl font-black text-slate-900 mb-8 group-hover:text-indigo-600 transition-colors line-clamp-2 h-14 leading-tight">
                {item.name}
              </h4>

              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-[9px]">
                    {item.author[0]}
                  </div>
                  <span>{item.author} · {item.date}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <Library className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}