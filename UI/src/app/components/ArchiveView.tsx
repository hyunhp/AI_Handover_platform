import { Search, Library, Clock, FileText, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState } from 'react';

export function ArchiveView() {
  const [activeTab, setActiveTab] = useState('전체');
  
  const tabs = [
    { name: '전체', count: 3 },
    { name: '내가 만든', count: 2 },
    { name: '공유받은', count: 1 },
  ];

  const archiveData = [
    { name: '신입 디자이너 온보딩', author: '김영은', date: '11. 15.', color: 'orange' },
    { name: 'Q4 마감 회계 절차', author: '박수민', date: '11. 12.', color: 'green' },
    { name: 'VIP 고객사 응대 가이드', author: '김영은', date: '11. 08.', color: 'blue' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-20">
      {/* 헤더 및 검색 섹션 */}
      <div className="flex flex-col items-center mb-16">
        <div className="w-full max-w-2xl relative mb-8">
          <Search className="absolute left-5 inset-y-0 my-auto w-5 h-5 text-slate-300" />
          <input 
            type="text"
            placeholder="아카이브 검색"
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 ring-red-50 text-sm"
          />
        </div>

        {/* 탭 필터 섹션 */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.name 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {tab.name} <span className="ml-1 opacity-60 font-medium">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 아카이브 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {archiveData.map((item, idx) => (
          <Card key={idx} className="group p-8 border-slate-50 hover:shadow-2xl transition-all cursor-pointer rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                item.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                item.color === 'green' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
              }`}>
                000
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-6 group-hover:text-red-500 transition-colors">
              {item.name}
            </h4>
            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                  {item.author[0]}
                </div>
                <span>{item.author} · {item.date}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-300 group-hover:text-red-500">
                <Library className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}