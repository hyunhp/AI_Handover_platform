// src/app/components/HomeView.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronRight, Sparkles, ArrowUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HomeViewProps {
  onStartAgent: () => void;
  onProjectSelect: (name: string) => void;
}

export function HomeView({ onStartAgent, onProjectSelect }: HomeViewProps) {
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  // 💡 홈 화면에서도 실제 아카이브 폴더 목록을 가져옴 
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/get-archive`);
        const data = await response.json();
        if (data.status === "success") {
          // 상위 3개만 최근 프로젝트로 표시 
          setRecentProjects(data.archive.slice(0, 3));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center animate-in fade-in duration-1000">
      <div className="w-full max-w-2xl text-center mb-24">
        <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">
          영은님, 오늘 업무도 <span className="text-red-500 underline decoration-red-100 underline-offset-8">Mayi</span>가 도와드릴까요?
        </h2>
        <div className="relative group">
          <Search className="absolute left-6 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text" placeholder="업무 자료 검색부터 인수인계서 작성까지..."
            className="w-full pl-16 pr-24 py-6 bg-white border border-slate-100 rounded-[30px] shadow-2xl shadow-slate-100 focus:ring-4 ring-red-50 outline-none text-sm transition-all"
          />
          <div className="absolute right-3 inset-y-0 flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs text-slate-500 bg-slate-50 gap-2 font-bold">
              Mayi 내에서 검색 <ChevronDown className="w-3 h-3" />
            </Button>
            <Button className="w-10 h-10 p-0 bg-red-500 text-white rounded-xl shadow-lg shadow-red-100"><ArrowUp className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-900 text-lg tracking-tight">최근 공유받은 인수인계 자료</h3>
          <Button variant="ghost" className="text-xs text-slate-400 font-bold hover:text-red-500 transition-colors">더보기 <ChevronRight className="w-3 h-3 ml-1" /></Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentProjects.map((item, idx) => (
            <Card 
              key={idx} 
              onClick={() => onProjectSelect(item.name)} // 💡 클릭 시 아카이브 폴더로 이동 
              className="p-8 border-slate-50 hover:shadow-2xl hover:translate-y-[-6px] transition-all cursor-pointer group rounded-[32px] bg-white border border-transparent"
            >
              <div className="mb-6"><span className="px-2.5 py-1 bg-orange-50 text-orange-500 text-[10px] font-black rounded flex items-center w-fit gap-1 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">🎨 000</span></div>
              <h4 className="font-black text-slate-900 text-lg mb-6 group-hover:text-red-500 transition-colors leading-tight h-12 line-clamp-2">{item.name}</h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pt-6 border-t border-slate-50">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{item.author[0]}</div>
                <span>{item.author} · {item.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={onStartAgent} className="fixed bottom-12 right-12 bg-red-500 hover:bg-red-600 text-white h-16 px-8 rounded-2xl shadow-2xl shadow-red-200 gap-3 font-black text-lg transition-all hover:scale-105 active:scale-95">
        <Plus className="w-6 h-6" /> 새 인수인계 작성하기
      </Button>
    </div>
  );
}