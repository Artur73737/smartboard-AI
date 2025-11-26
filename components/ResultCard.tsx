import React from 'react';
import { X, Copy, Calculator, LineChart as IconLineChart, MessageSquare, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AISolution, ElementType } from '../types';

interface ResultCardProps {
  solution: AISolution;
  onClose: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ solution, onClose }) => {
  const getIcon = () => {
    switch (solution.type) {
      case ElementType.MATH: return <Calculator className="text-emerald-400" size={20} />;
      case ElementType.GRAPH: return <IconLineChart className="text-blue-400" size={20} />;
      default: return <MessageSquare className="text-purple-400" size={20} />;
    }
  };

  const textContent = solution.solutionText || solution.recognizedText;
  const isMathShort = solution.type === ElementType.MATH && (textContent?.length || 0) < 50;

  return (
    <div className={`absolute ${isMathShort ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-20 right-8'} z-40 flex flex-col bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${isMathShort ? 'min-w-[300px]' : 'w-96 max-h-[80vh]'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-medium text-white text-sm truncate max-w-[200px]">
            {solution.type === 'MATH' ? 'Risultato' : solution.recognizedText}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto custom-scrollbar">
        {/* Graph Render */}
        {solution.type === ElementType.GRAPH && solution.graphData && (
          <div className="mb-4 w-full h-48 bg-gray-950/50 rounded-lg p-2 border border-white/5">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={solution.graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="x" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickFormatter={(val) => Number(val).toFixed(1)}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickFormatter={(val) => Number(val).toFixed(1)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }} 
                  />
                </LineChart>
             </ResponsiveContainer>
             <div className="text-center text-xs text-blue-400 mt-2 font-mono">{solution.recognizedText}</div>
          </div>
        )}

        {/* Text Content */}
        <div className={`prose prose-invert prose-sm ${isMathShort ? 'text-center text-2xl font-bold text-white py-2' : ''}`}>
          {isMathShort ? (
             <span>{textContent}</span>
          ) : (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {textContent}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isMathShort && (
        <div className="p-3 border-t border-white/5 flex justify-end">
          <button 
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              onClick={() => navigator.clipboard.writeText(textContent || "")}
          >
            <Copy size={12} />
            <span>Copy Result</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultCard;