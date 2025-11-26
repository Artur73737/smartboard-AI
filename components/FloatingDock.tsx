
import React from 'react';
import { Pen, Eraser, Trash2, MousePointer2, MoveRight, Undo2, Redo2 } from 'lucide-react';
import { ToolType } from '../types';

interface FloatingDockProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  currentColor: string;
  setColor: (color: string) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const colors = [
  '#ffffff', // White
  '#0A84FF', // iOS Blue
  '#FF453A', // iOS Red
  '#32D74B', // iOS Green
  '#FFD60A', // iOS Yellow
];

const FloatingDock: React.FC<FloatingDockProps> = ({
  activeTool,
  setActiveTool,
  currentColor,
  setColor,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-4 bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-[#1c1c1e]/90">
      
          {/* Tools */}
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <button
              onClick={() => setActiveTool(ToolType.POINTER)}
              className={`p-3 rounded-full transition-all duration-200 ${activeTool === ToolType.POINTER ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Select"
            >
              <MousePointer2 size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setActiveTool(ToolType.PEN)}
              className={`p-3 rounded-full transition-all duration-200 ${activeTool === ToolType.PEN ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Draw"
            >
              <Pen size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setActiveTool(ToolType.ARROW)}
              className={`p-3 rounded-full transition-all duration-200 ${activeTool === ToolType.ARROW ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Arrow"
            >
              <MoveRight size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setActiveTool(ToolType.ERASER)}
              className={`p-3 rounded-full transition-all duration-200 ${activeTool === ToolType.ERASER ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Erase"
            >
              <Eraser size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-3 pr-4 border-r border-white/10">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (activeTool !== ToolType.PEN && activeTool !== ToolType.ARROW) setActiveTool(ToolType.PEN);
                }}
                className={`w-5 h-5 rounded-full transition-transform duration-200 hover:scale-125 ${currentColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'opacity-70 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
             <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-3 rounded-full transition-all ${!canUndo ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Undo"
            >
              <Undo2 size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-3 rounded-full transition-all ${!canRedo ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Redo"
            >
              <Redo2 size={20} strokeWidth={2.5} />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

            <button
              onClick={onClear}
              className="p-3 rounded-full text-gray-400 hover:text-[#FF453A] hover:bg-white/5 transition-all"
              title="Clear All"
            >
              <Trash2 size={20} strokeWidth={2.5} />
            </button>
          </div>
      </div>
    </div>
  );
};

export default FloatingDock;
