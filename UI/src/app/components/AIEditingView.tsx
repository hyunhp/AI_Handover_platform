import { Send, Sparkles, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface AIEditingViewProps {
  motherFolderName: string; // 👈 추가
  projectName: string;
  onBack: () => void;
}

export function AIEditingView({ motherFolderName, projectName, onBack }: AIEditingViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [aiState, setAiState] = useState(JSON.stringify({ phase: "DRAFTING", current_project: projectName }));

  // 페이지 진입 시 초안 생성 호출
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("http://43.201.38.186:8000/api/generate-manual", {
          method: "POST",
          body: new URLSearchParams({
             motherFolderName,
             projectName 
            })
        });
        const data = await res.json();
        if (data.status === "success") {
          setMarkdownContent(data.content);
          setMessages([{ role: 'assistant', content: "매뉴얼 초안이 작성되었습니다. 수정이 필요한 부분을 말씀해 주세요!" }]);
        }
      } catch (e) {
        setMessages([{ role: 'assistant', content: "오류가 발생했습니다." }]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [motherFolderName, projectName]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch("http://43.201.38.186:8000/api/chat-edit", {
        method: "POST",
        body: new URLSearchParams({ motherFolderName, projectName, message: userMsg, state: aiState })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response }]);
      setAiState(data.new_state);
      if (data.updated_content) setMarkdownContent(data.updated_content);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "에러가 발생했습니다." }]);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <div className="border-b bg-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{projectName} - AI 편집</h1>
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <div className="col-span-4 border-r bg-white flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="수정 요청..." rows={2} />
            <Button onClick={handleSend} className="bg-indigo-600 text-white"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="col-span-8 p-12 overflow-auto">
          <Card className="p-16 min-h-full max-w-4xl mx-auto shadow-lg bg-white prose prose-slate">
            {isLoading ? <Loader2 className="animate-spin mx-auto w-12 h-12" /> : <div className="whitespace-pre-wrap">{markdownContent}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}