// src/app/components/DocumentDashboard.tsx
import React, { useState } from 'react';
import { FileText, CheckCircle, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';

interface DocumentDashboardProps {
  motherProjectName: string; // 상위 프로젝트(마더 폴더) 이름
  projects: any;             // AI가 분류한 하위 프로젝트 객체 { "명칭": ["파일목록"] }
  onNext: (selectedSubProject: string) => void; // 선택된 프로젝트명을 가지고 다음 단계로 이동
  onBack: () => void;        // 이전 단계(업로드)로 이동
}

export function DocumentDashboard({ motherProjectName, projects, onNext, onBack }: DocumentDashboardProps) {
  // 사용자가 클릭한 하위 프로젝트의 이름을 저장하는 상태
  const [selected, setSelected] = useState<string | null>(null);

  // projects 객체에서 키값(프로젝트 이름들)만 추출하여 배열로 변환
  const projectList = projects ? Object.keys(projects) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 상단 헤더 섹션 */}
      <div className="border-b bg-white px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h1 className="text-3xl font-bold text-slate-900">
                {motherProjectName} : 분석 결과
              </h1>
            </div>
            <p className="text-slate-600">AI가 맥락을 분석하여 하위 프로젝트들을 생성했습니다. 매뉴얼을 작성할 프로젝트를 선택해 주세요.</p>
          </div>
          <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="w-4 h-4 mr-1" />
            다시 업로드하기
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="max-w-6xl mx-auto px-8 py-12 w-full flex-1">
        {projectList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {projectList.map((name) => (
              <Card 
                key={name} 
                // 클릭 시 해당 프로젝트를 선택 상태로 변경
                onClick={() => setSelected(name)}
                className={`relative transition-all cursor-pointer duration-200 h-full flex flex-col hover:shadow-md ${
                  selected === name 
                    ? 'ring-4 ring-indigo-600 shadow-lg border-transparent translate-y-[-4px]' // 선택 시 파란색 테두리 및 띄움 효과
                    : 'hover:border-indigo-300 border-slate-200'
                }`}
              >
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${selected === name ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    {/* 선택 시 나타나는 체크 표시 */}
                    {selected === name && (
                      <div className="bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <CardTitle className={`text-xl font-bold mb-2 ${selected === name ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {name}
                  </CardTitle>
                  <CardDescription className="text-slate-500 line-clamp-2">
                    {projects[name].length}개의 관련 문서가 포함되어 있습니다.
                  </CardDescription>
                </CardHeader>
                
                {selected === name && (
                  <div className="px-6 pb-6 mt-auto">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Selected</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900">분류된 프로젝트가 없습니다.</h3>
            <p className="text-slate-500">업로드된 파일이 분석 기준에 맞지 않을 수 있습니다.</p>
          </div>
        )}

        {/* 하단 제어 버튼 */}
        <div className="sticky bottom-8 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 flex gap-4 shadow-xl max-w-2xl mx-auto">
          <Button variant="outline" onClick={onBack} className="flex-1 py-6 text-lg">
            Back
          </Button>
          <Button 
            // 프로젝트가 선택되지 않았을 경우 버튼 비활성화
            disabled={!selected}
            onClick={() => selected && onNext(selected)} 
            className="flex-1 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            매뉴얼 확인하기
          </Button>
        </div>
      </div>
    </div>
  );
}