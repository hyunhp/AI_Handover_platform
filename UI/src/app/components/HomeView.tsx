// src/app/components/HomeView.tsx
import React from 'react';
import { Search, Plus, ArrowUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

interface HomeViewProps {
  onStartAgent: () => void;
  // 부모 컴포넌트(App.tsx)와의 인터페이스 호환성을 위해 유지합니다.
  onProjectSelect?: (motherName: string, projectName: string) => void;
  onViewArchive?: () => void;
}

export function HomeView({ onStartAgent }: HomeViewProps) {
  // 하단 아카이브 리스트를 제거함에 따라 관련 useEffect 및 fetch 로직은 삭제하여 코드를 경량화했습니다.

  return (
    <div className="max-w-6xl mx-auto px-8 py-32 flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in duration-1000">
      
      <div className="w-full max-w-3xl text-center">
        {/* 1. "May I help you?" 그라데이션 타이틀 - mb-16으로 아래 문구와 간격 대폭 확대 */}
        <h1 className="text-8xl font-black mb-16 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-indigo-600 py-4 leading-tight">
          May I help you?
        </h1>
        
        {/* 2. Mayi 볼드체 강조 문구 */}
        <h2 className="text-3xl font-medium text-slate-800 mb-12">
          구름님, 오늘 업무도 <span className="font-black text-slate-950">Mayi</span>가 도와드릴까요?
        </h2>

        {/* 3. 검색창 (원본 구조 유지) */}
        <div className="relative group max-w-2xl mx-auto mb-12">
          <Search className="absolute left-6 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="업무 자료 검색부터 인수인계서 작성까지..."
            className="w-full pl-16 pr-24 py-6 bg-white border border-slate-100 rounded-[30px] shadow-2xl shadow-slate-100 focus:ring-4 ring-red-50 outline-none text-sm transition-all"
          />
          <div className="absolute right-3 inset-y-0 flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs text-slate-500 bg-slate-50 gap-2 font-bold">
              Mayi 내에서 검색 <ChevronDown className="w-3 h-3" />
            </Button>
            <Button className="w-10 h-10 p-0 bg-red-500 text-white rounded-full shadow-lg shadow-red-100">
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 4. 중앙 정렬된 둥근 'AI 인수인계 만들기' 버튼 */}
        <div className="flex justify-center">
          <Button 
            onClick={onStartAgent} 
            className="bg-red-500 hover:bg-red-600 text-white h-16 px-10 rounded-full shadow-2xl shadow-red-200 gap-3 font-black text-xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6" /> AI 인수인계 만들기
          </Button>
        </div>
      </div>
      
      {/* 아카이브(최근 공유 자료) 섹션은 요청에 따라 제외되었습니다. */}
    </div>
  );
}