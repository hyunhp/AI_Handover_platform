// src/app/components/UploadInterface.tsx
import { Upload, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState, useRef } from 'react';

interface UploadInterfaceProps {
  folderName: string;
  onNext: (result: any) => void; // 인자를 받도록 수정
  onBack: () => void;
}

export function UploadInterface({ folderName, onNext, onBack }: UploadInterfaceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("folderName", folderName);
    files.forEach((file) => formData.append("files", file));

    try {
      // .env에 설정한 변수를 가져옵니다.
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/upload-and-analyze`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        // 서버에서 온 분석 결과(analysis_result)를 넘겨줍니다.
        onNext(result.analysis_result); 
      } else {
        alert("분석 실패: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 연결 실패. IP 주소와 서버 실행 여부를 확인하세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">📂 {folderName || "새 프로젝트"}</h1>
          <p className="text-slate-600">인수인계할 파일을 업로드하면 AI가 분석을 시작합니다.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-8 py-12 w-full">
        <Card className="border-2 border-dashed border-slate-300 p-16 text-center cursor-pointer hover:border-indigo-400" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">파일 업로드</h3>
          <Button variant="outline">내 컴퓨터에서 찾기</Button>
        </Card>

        {files.length > 0 && (
          <div className="mt-8 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">{f.name}</span>
                </div>
                <X className="w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-12">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={handleGenerate} disabled={files.length === 0 || isProcessing} className="flex-1 bg-indigo-600 text-white">
            {isProcessing ? <><Loader2 className="mr-2 animate-spin" /> AI 분석 중...</> : "Upload and Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}