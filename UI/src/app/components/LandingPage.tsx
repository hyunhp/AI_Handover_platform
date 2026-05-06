import { ArrowRight, Zap, FileCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNext: () => void;
}

export function LandingPage({ onNext }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">AI-Powered Knowledge Transfer</span>
        </div>

        <h1 className="text-6xl mb-6 text-slate-900">
          Fast, Accurate, and Easy Handover
        </h1>
        <p className="text-xl text-slate-600 mb-4">
          쉽고 정확하고 빠르게 완성하는 인수인계!
        </p>

        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
          Transform your knowledge transfer process with AI. Upload documents, get instant structured handover materials, and refine them with intelligent assistance.
        </p>

        <div className="flex gap-6 justify-center mb-16">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-700">10x Faster</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <FileCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-700">AI-Organized</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-700">Smart Editing</p>
          </div>
        </div>

        <Button
          onClick={onNext}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
        >
          Start
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
