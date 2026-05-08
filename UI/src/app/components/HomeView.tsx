import { Search, Plus, Clock, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HomeViewProps {
  onStartAgent: () => void;
}

export function HomeView({ onStartAgent }: HomeViewProps) {
  const recentItems = [
    { name: '신입 디자이너 온보딩', tag: '000', author: '박지영', date: '11. 15.' },
    { name: 'Q4 마감 회계 절차', tag: '000', author: '김수민', date: '11. 12.' },
    { name: 'VIP 고객사 응대 가이드', tag: '000', author: '이지호', date: '11. 08.' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center">
      {/* 중앙 메인 섹션 */}
      <div className="w-full max-w-2xl text-center mb-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-10">
          영은님, 오늘 업무도 <span className="text-red-500">Mayi</span>가 도와드릴까요?
        </h2>
        
        {/* 중앙 검색 바 */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-red-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            placeholder="업무 자료 검색부터 인수인계서 작성까지, 편하게 말씀해 주세요"
            className="w-full pl-14 pr-20 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm shadow-slate-100 focus:ring-4 ring-red-50 outline-none transition-all text-sm"
          />
          <div className="absolute right-3 inset-y-0 flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs text-slate-500 bg-slate-50 gap-2">
              <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-[10px]">👤</span>
              Mayi 내에서 검색
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button className="w-10 h-10 p-0 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-100">
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 최근 인수인계 자료 섹션 */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">최근 공유받은 인수인계 자료</h3>
          <Button variant="ghost" className="text-xs text-slate-400 hover:text-red-500 gap-1">
            더보기 <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentItems.map((item, idx) => (
            <Card key={idx} className="p-6 border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-bold rounded flex items-center gap-1">
                  🎨 {item.tag}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 mb-4 group-hover:text-red-500 transition-colors">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                  {item.author[0]}
                </div>
                <span>{item.author} · {item.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* 플로팅 액션 버튼 (신규 생성 바로가기) */}
      <Button 
        onClick={onStartAgent}
        className="fixed bottom-10 right-10 bg-red-500 hover:bg-red-600 text-white h-14 px-6 rounded-2xl shadow-2xl shadow-red-200 gap-3 font-bold"
      >
        <Plus className="w-6 h-6" /> 새 인수인계 작성하기
      </Button>
    </div>
  );
}

// 아이콘 보완용 가상 컴포넌트
function ChevronDown({className}: {className?: string}) { return <ChevronRight className={`rotate-90 ${className}`} /> }
function ArrowUp({className}: {className?: string}) { return <ChevronRight className={`-rotate-90 ${className}`} /> }