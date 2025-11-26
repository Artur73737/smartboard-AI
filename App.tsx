
import React, { useState, useRef, useEffect } from 'react';
import Whiteboard, { WhiteboardRef } from './components/Whiteboard';
import FloatingDock from './components/FloatingDock';
import { ToolType, Stroke, BoardElement, ElementState } from './types';
import { analyzeBoard, listAvailableModels, GeminiModel } from './services/gemini';
import { GraduationCap, Loader2, Key, Cpu } from 'lucide-react';

interface HistoryState {
  strokes: Stroke[];
  elements: BoardElement[];
}

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PEN);
  const [color, setColor] = useState<string>('#ffffff');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [elements, setElements] = useState<BoardElement[]>([]);

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');
  const [tempModel, setTempModel] = useState<string>('gemini-2.0-flash-exp');
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  const whiteboardRef = useRef<WhiteboardRef>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // Load API Key and Model on Mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model');

    if (storedApiKey) {
      setApiKey(storedApiKey);
      setShowApiKeyInput(false);
      // Fetch available models when API key is loaded
      fetchModels(storedApiKey);
    }

    if (storedModel) {
      setSelectedModel(storedModel);
      setTempModel(storedModel);
    }
  }, []);

  // Fetch available models when API key changes
  const fetchModels = async (key: string) => {
    if (!key) return;
    setLoadingModels(true);
    const models = await listAvailableModels(key);
    setAvailableModels(models);
    setLoadingModels(false);
  };

  // Fetch models when tempApiKey changes (for the input screen)
  useEffect(() => {
    if (tempApiKey && tempApiKey.startsWith('AIzaSy')) {
      fetchModels(tempApiKey);
    }
  }, [tempApiKey]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim().startsWith('AIzaSy')) {
      localStorage.setItem('gemini_api_key', tempApiKey.trim());
      localStorage.setItem('gemini_model', tempModel);
      setApiKey(tempApiKey.trim());
      setSelectedModel(tempModel);
      setShowApiKeyInput(false);
    } else {
      alert('API Key non valida. Deve iniziare con "AIzaSy"');
    }
  };

  const handleChangeApiKey = () => {
    setShowApiKeyInput(true);
    setTempApiKey(apiKey);
    setTempModel(selectedModel);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempApiKey('');
    setShowApiKeyInput(true);
  };

  // History Management
  const addToHistory = () => {
    // Save current state to history
    setHistory(prev => [...prev, { strokes: [...strokes], elements: [...elements] }]);
    // Clear redo stack on new action
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;

    // Current state becomes future (for redo)
    setRedoStack(prev => [...prev, { strokes, elements }]);

    // Pop last state from history
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setHistory(newHistory);
    setStrokes(previousState.strokes);
    setElements(previousState.elements);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    // Current state goes to history
    setHistory(prev => [...prev, { strokes, elements }]);

    // Pop next state from redo stack
    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setRedoStack(newRedoStack);
    setStrokes(nextState.strokes);
    setElements(nextState.elements);
  };

  const handleClear = () => {
    addToHistory();
    setStrokes([]);
    setElements([]);
  };

  const handleAnalyzeGroup = async (targetStrokes: Stroke[], bounds: { x: number, y: number }) => {
    if (!whiteboardRef.current) return;
    if (isAILoading) return;

    const imageBase64 = whiteboardRef.current.getSnapshot(targetStrokes);
    if (!imageBase64) return;

    setIsAILoading(true);

    // Use API key and selected model
    const result = await analyzeBoard(imageBase64, apiKey, selectedModel);


    const newElement: BoardElement = {
      id: Date.now().toString(),
      type: result.type,
      state: ElementState.PENDING_DECISION,
      x: bounds.x,
      y: bounds.y,
      content: result.recognizedText,
      solution: result.solutionText,
      graphData: result.graphData,
      latex: result.latex,
      solutionLatex: result.solutionLatex
    };

    addToHistory(); // Save state before replacing strokes

    // Remove ONLY the analyzed strokes from the board
    setStrokes(prev => prev.filter(s => !targetStrokes.includes(s)));

    // Add the new element
    setElements(prev => [...prev, newElement]);

    setIsAILoading(false);
    setActiveTool(ToolType.POINTER);
  };

  // API Key Input Screen
  if (showApiKeyInput) {
    return (
      <div className="w-screen h-screen bg-[#000000] flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50" />

        <div className="relative z-10 w-full max-w-[500px] p-8 rounded-3xl bg-[#1c1c1e] border border-white/10 shadow-2xl flex flex-col items-center text-center">

          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg mb-4 mx-auto">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">SmartBoard AI</h1>
            <p className="text-gray-400 text-sm">Inserisci la tua API Key di Google Gemini</p>
          </div>

          <div className="w-full mb-6 space-y-4">
            <div>
              <label className="block text-left text-xs text-gray-400 mb-2 ml-1">Google Gemini API Key</label>
              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#2c2c2e] text-white px-12 py-3 rounded-xl border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                />
              </div>
            </div>

            <div>
              <label className="block text-left text-xs text-gray-400 mb-2 ml-1">Modello AI</label>
              <div className="relative">
                <Cpu size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  disabled={loadingModels || availableModels.length === 0}
                  className="w-full bg-[#2c2c2e] text-white px-12 py-3 rounded-xl border border-white/10 focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingModels ? (
                    <option>Caricamento modelli...</option>
                  ) : availableModels.length > 0 ? (
                    availableModels.map(model => (
                      <option key={model.name} value={model.name}>
                        {model.displayName}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                      <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                      <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  {loadingModels ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </div>
              </div>
              {availableModels.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  {availableModels.length} modelli disponibili
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2 text-left ml-1">
              Ottieni la tua chiave su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
            </p>
          </div>

          <button
            onClick={handleSaveApiKey}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-lg"
          >
            Salva e Inizia
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans selection:bg-blue-500/30">

      {/* Apple-style Blur Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex items-center gap-3 select-none">
        <div className="bg-white/5 px-4 py-2 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-3 shadow-lg">
          {isAILoading ? <Loader2 className="animate-spin text-blue-400" size={20} /> : <GraduationCap className="text-white/80" size={20} />}
          <h1 className="text-sm font-medium tracking-wide text-white/90">
            {isAILoading ? 'Analisi in corso...' : 'SmartBoard Pro'}
          </h1>
        </div>
      </div>

      {/* API Key Settings - Top Right */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <button
          onClick={handleChangeApiKey}
          className="pointer-events-auto bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full backdrop-blur-xl border border-white/10 transition-colors shadow-lg flex items-center gap-2"
          title="Cambia API Key"
        >
          <Key size={16} className="text-white/80" />
          <span className="text-xs font-medium text-white/90">API Key</span>
        </button>
      </div>

      <Whiteboard
        ref={whiteboardRef}
        tool={activeTool}
        color={color}
        strokes={strokes}
        setStrokes={setStrokes}
        elements={elements}
        setElements={setElements}
        onSaveHistory={addToHistory}
        onAnalyzeGroup={handleAnalyzeGroup}
      />

      <FloatingDock
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        currentColor={color}
        setColor={setColor}
        onClear={handleClear}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
      />

    </div>
  );
};

export default App;
