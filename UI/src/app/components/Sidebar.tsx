// src/app/components/Sidebar.tsx
import { useState } from 'react';
import { Home, Sparkles, Library, Bell, LogOut, User } from 'lucide-react';

interface SidebarProps {
  activeMenu: 'home' | 'agent' | 'archive';
  onMenuChange: (menu: 'home' | 'agent' | 'archive') => void;
  onLogout: () => void; // 로그아웃 함수 추가
}

export function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menus = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'agent', icon: Sparkles, label: '인수인계 Agent' },
    { id: 'archive', icon: Library, label: '아카이브' },
  ] as const;

  return (
    <div className="w-20 h-screen bg-white border-r flex flex-col items-center py-8 gap-10 relative z-50">
      {/* 로고 (Mayi) */}
      <div className="text-red-500 font-bold text-xl">Mayi</div>

      {/* 메인 메뉴 */}
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

      {/* 하단 유저 설정 및 로그아웃 배너 */}
      <div className="flex flex-col gap-6 text-slate-400 relative">
        <button className="hover:text-slate-600 flex justify-center">
          <Bell className="w-6 h-6" />
        </button>
        
        <div className="relative">
          {/* 유저 아바타 버튼 */}
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              isUserMenuOpen ? 'ring-2 ring-red-500 ring-offset-2 bg-red-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
          >
            구
          </button>

          {/* 로그아웃 배너 (팝업) */}
          {isUserMenuOpen && (
            <>
              {/* 바깥 클릭 시 닫히기 위한 투명 배경 */}
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setIsUserMenuOpen(false)} 
              />
              
              <div className="absolute bottom-0 left-14 w-40 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">User Account</p>
                  <p className="text-sm font-bold text-slate-900 truncate">구름 님</p>
                </div>
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout(); // App.tsx의 로그아웃 로직 실행
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}