// src/app/components/ArchiveView.tsx
import React, { useState, useEffect } from 'react';
import { Search, Library, Loader2 } from 'lucide-react';
import { Card } from './ui/card';

interface ArchiveViewProps {
  onProjectSelect: (name: string) => void;
}

export function ArchiveView({ onProjectSelect }: ArchiveViewProps) {
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/get-archive`);
        const data = await response.json();
        if (data.status === "success") setArchiveData(data.archive);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArchive();
  }, []);

  const filteredData = archiveData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 animate-in fade-in duration-700">
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="w-full max-w-2xl relative mb-8">
          <Search className="absolute left-5 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="아카이브 검색 (프로젝트명)"
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 ring-red-50 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['전체', '내가 만든', '공유받은'].map((tab) => (
            <button key={tab} className={`px-5 py-2 rounded-full text-xs font-bold ${tab === '전체' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
              {tab} {tab === '전체' && <span className="ml-1 opacity-60">{filteredData.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map((item, idx) => (
            <Card 
              key={idx} 
              onClick={() => onProjectSelect(item.name)} // 💡 클릭 시 이동 
              className="group p-8 border-slate-50 hover:shadow-2xl transition-all cursor-pointer rounded-[32px] bg-white relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${item.color === 'orange' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>000</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.subProjectsCount} Sub-projects</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-8 group-hover:text-red-500 transition-colors line-clamp-2">{item.name}</h4>
              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{item.author[0]}</div>
                  <span>{item.author} · {item.date}</span>
                </div>
                <Library className="w-4 h-4 text-slate-200 group-hover:text-red-400 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}