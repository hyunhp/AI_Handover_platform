// src/app/components/ArchiveView.tsx 전체 코드
import React, { useState, useEffect } from 'react';
import { Search, Library, FileText, Loader2 } from 'lucide-react';
import { Card } from './ui/card';

export function ArchiveView() {
  const [activeTab, setActiveTab] = useState('전체');
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 컴포넌트 로드 시 서버에서 폴더 목록 가져오기
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const fetchArchive = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/get-archive`);
        const data = await response.json();
        if (data.status === "success") {
          setArchiveData(data.archive);
        }
      } catch (error) {
        console.error("Archive fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArchive();
  }, []);

  // 검색어 필터링 로직
  const filteredData = archiveData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-in fade-in duration-700">
      {/* 상단 검색 및 필터 영역 */}
      <div className="flex flex-col items-center mb-16">
        <div className="w-full max-w-2xl relative mb-8">
          <Search className="absolute left-5 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="아카이브 검색 (프로젝트명)"
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 ring-red-50 text-sm"
          />
        </div>

        <div className="flex gap-2">
          {['전체', '내가 만든', '공유받은'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {tab} {tab === '전체' && <span className="ml-1 opacity-60">{filteredData.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 실시간 폴더 목록 출력 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>아카이브 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map((item, idx) => (
            <Card key={idx} className="group p-8 border-slate-50 hover:shadow-2xl transition-all cursor-pointer rounded-[32px] bg-white">
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                  item.color === 'orange' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  000
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {item.subProjectsCount} Sub-projects
                </span>
              </div>
              
              <h4 className="text-lg font-bold text-slate-900 mb-8 group-hover:text-red-500 transition-colors h-14 line-clamp-2 leading-snug">
                {item.name}
              </h4>

              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                    {item.author[0]}
                  </div>
                  <span>{item.author} · {item.date}</span>
                </div>
                <div className="p-2 rounded-lg text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                  <Library className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Library className="w-16 h-16 text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400">저장된 인수인계 자료가 없습니다.</p>
        </div>
      )}
    </div>
  );
}