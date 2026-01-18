import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Bot } from 'lucide-react';
import { generateChartSummary } from '@/lib/gemini';

interface AIAnalysisButtonProps {
  type: 'revenue' | 'products';
  data: any[];
}

export const AIAnalysisButton: React.FC<AIAnalysisButtonProps> = ({ type, data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const handleAnalyze = async () => {
    if (!data || data.length === 0) return;
    setLoading(true);
    setAnalysis("");
    const result = await generateChartSummary(type, data);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
          onClick={handleAnalyze}
          disabled={!data || data.length === 0}
          title="Get AI Summary"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <Bot className="h-5 w-5" />
            Gemini Insight
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs text-muted-foreground animate-pulse">Analyzing business data...</p>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-900 leading-relaxed">
              {analysis}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};