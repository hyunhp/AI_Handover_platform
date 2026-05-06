import { Plus, FolderOpen, Clock, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';

interface PredecessorDashboardProps {
  onCreateHandover: (name: string) => void; // 이름을 인자로 받도록 수정
}

export function PredecessorDashboard({ onCreateHandover }: PredecessorDashboardProps) {
  const recentFolders = [
    { name: 'A-Portal Operation', files: 12, date: '2026-04-28', status: 'completed' },
    { name: 'New Hire Onboarding', files: 8, date: '2026-04-25', status: 'completed' },
  ];

  const inProgressFolders = [
    { name: 'Q2 Sales Process', files: 6, date: '2026-05-02', status: 'in-progress' },
  ];

  // 새 인수인계 생성 시 이름을 입력받는 함수
  const handleCreateNew = () => {
    const name = prompt("새로운 인수인계 프로젝트 이름을 입력하세요:", "My_New_Project");
    if (name && name.trim() !== "") {
      onCreateHandover(name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Handover Dashboard</h1>
            <p className="text-slate-600">인수인계 자료를 관리하고 새로 생성하세요.</p>
          </div>
          <Button
            onClick={handleCreateNew} // 수정된 함수 연결
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Handover Material
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">In-Progress Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressFolders.map((folder) => (
              <Card key={folder.name} className="border-indigo-200 hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderOpen className="w-10 h-10 text-indigo-600 mb-3" />
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">In Progress</span>
                  </div>
                  <CardTitle className="text-slate-900">{folder.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{folder.files} files</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{folder.date}</span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentFolders.map((folder) => (
              <Card key={folder.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FolderOpen className="w-10 h-10 text-slate-600 mb-3" />
                  <CardTitle className="text-slate-900">{folder.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{folder.files} files</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{folder.date}</span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}