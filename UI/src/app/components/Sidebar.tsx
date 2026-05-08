// src/app/components/Sidebar.tsx
import { Home, Sparkles, Library, Bell, User } from 'lucide-react';

interface SidebarProps {
  activeMenu: 'home' | 'agent' | 'archive';
  onMenuChange: (menu: 'home' | 'agent' | 'archive') => void;
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const menus = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'agent', icon: Sparkles, label: '인수인계 Agent' },
    { id: 'archive', icon: Library, label: '아카이브' },
  ] as const;

  return (
    <div className="w-20 h-screen bg-white border-r flex flex-col items-center py-8 gap-10">
      {/* 로고 (Mayi) */}
      <div className="text-red-500 font-bold text-xl">Mayi</div>

      {/* 메인 메뉴 [cite: 1, 2] */}
      <nav className="flex-1 flex flex-col gap-6">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onMenuChange(menu.id)}
            className={`flex flex-col items-center gap-1 group transition-colors ${
              activeMenu === menu.id ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${
              activeMenu === menu.id ? 'bg-red-50' : 'group-hover:bg-slate-50'
            }`}>
              <menu.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium">{menu.label}</span>
          </button>
        ))}
      </nav>

      {/* 하단 유저 설정 [cite: 1] */}
      <div className="flex flex-col gap-6 text-slate-400">
        <button className="hover:text-slate-600"><Bell className="w-6 h-6" /></button>
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
          영
        </div>
      </div>
    </div>
  );
}