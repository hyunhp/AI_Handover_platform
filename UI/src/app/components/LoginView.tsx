import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, Chrome } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 서비스에서는 여기서 API 통신을 하지만, 
    // 지금은 UI 확인을 위해 바로 로그인 처리를 합니다.
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8">
        {/* 상단 로고 및 문구 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-red-500 tracking-tighter">Mayi</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            다시 만나서 반가워요!
          </h2>
          <p className="text-slate-500 text-sm">
            쉽고 정확하고 빠르게 완성하는 AI 인수인계 플랫폼
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card className="p-8 border-slate-100 shadow-2xl shadow-slate-100 rounded-[32px] bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-4 inset-y-0 my-auto w-5 h-5 text-slate-300" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@megazone.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-red-100 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 inset-y-0 my-auto w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-red-100 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                비밀번호를 잊으셨나요?
              </button>
            </div>

            <Button 
              type="submit"
              className="w-full py-7 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              로그인하기 <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-y-0 w-full h-px bg-slate-100 my-auto" />
            <span className="relative bg-white px-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">or continue with</span>
          </div>

          {/* 구글 로그인 버튼 */}
          <Button variant="outline" className="w-full py-6 rounded-2xl border-slate-100 text-slate-600 gap-3 text-sm font-medium hover:bg-slate-50 transition-all">
            <Chrome className="w-5 h-5 text-slate-400" /> Google 계정으로 로그인
          </Button>
        </Card>

        {/* 하단 문구 */}
        <p className="text-center text-sm text-slate-400">
          계정이 없으신가요? <button className="text-red-500 font-bold hover:underline">회원가입</button>
        </p>
      </div>
    </div>
  );
}