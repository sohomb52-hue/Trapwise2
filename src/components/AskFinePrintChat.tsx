import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  HelpCircle, 
  AlertCircle,
  Loader2,
  Bot,
  User,
  RotateCcw,
  FileText
} from 'lucide-react';
import { ChatMessage, RiskyClause, Language } from '../types';
import { askFinePrintQuestionStream } from '../services/gemini';

interface AskFinePrintChatProps {
  contractText: string;
  clauses: RiskyClause[];
  analysisSummary: string;
  language: Language;
  prefilledQuestion?: string | null;
  onClearPrefilledQuestion?: () => void;
  messages: ChatMessage[];
  onUpdateMessages: (msgs: ChatMessage[]) => void;
  onLoadSampleContract?: () => void;
}

export const AskFinePrintChat: React.FC<AskFinePrintChatProps> = ({
  contractText,
  clauses,
  analysisSummary,
  language,
  prefilledQuestion,
  onClearPrefilledQuestion,
  messages,
  onUpdateMessages,
  onLoadSampleContract,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'msg_welcome',
    role: 'assistant',
    text: "I'm ready to dig into your fine print! Ask me anything, like 'What happens if I leave early?' or 'Can I make them cap this fee?' and I'll answer in plain English and point to the exact clause I'm referencing.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const currentMessages = messages.length > 0 ? messages : [initialGreeting];

  const suggestedChips = [
    'What happens if I leave early?',
    'Can I make them cap this cleaning fee?',
    'How much notice must I give to move out?',
    'Can they raise my rent whenever they want?',
    'Is my security deposit fully refundable?',
  ];

  useEffect(() => {
    if (prefilledQuestion) {
      setIsOpen(true);
      setIsMinimized(false);
      handleSendMessage(`Can you explain this clause and how I can negotiate it? "${prefilledQuestion}"`);
      if (onClearPrefilledQuestion) {
        onClearPrefilledQuestion();
      }
    }
  }, [prefilledQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, streamingText, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...currentMessages, userMsg];
    onUpdateMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const finalAnswer = await askFinePrintQuestionStream(
        contractText,
        clauses,
        analysisSummary,
        newHistory,
        question,
        language,
        (partialText) => {
          setStreamingText(partialText);
        }
      );

      const botMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        text: finalAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onUpdateMessages([...newHistory, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: 'I checked your contract terms. Please review the highlighted clauses or try asking about specific sections like deposits, notice periods, or penalties.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
      setStreamingText(null);
    }
  };

  const handleResetChat = () => {
    onUpdateMessages([initialGreeting]);
    setStreamingText(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-red-500/30 hover:scale-105 transition-all flex items-center gap-2.5 border border-red-400/40"
        aria-label="Open Ask the Fine Print Chat"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Ask the Fine Print</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-full sm:w-[440px] transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-[#0E1626] flex flex-col ${
        isMinimized ? 'h-14' : 'h-[600px] max-h-[85vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#111A2E] via-[#162238] to-[#111A2E] p-3.5 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-600 text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Ask the Fine Print</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                AI Assistant
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Quotes exact clauses • Plain 9th-grade English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleResetChat}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* No contract alert banner */}
          {(!contractText || contractText.trim().length < 20) && (
            <div className="bg-amber-950/40 border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between text-[11px] text-amber-200">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>No contract loaded yet</span>
              </div>
              {onLoadSampleContract && (
                <button
                  onClick={onLoadSampleContract}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 transition-colors"
                >
                  Load Sample
                </button>
              )}
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#090F1B]">
            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-[#141E33] border border-slate-700/80 text-slate-200 rounded-bl-none leading-relaxed'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <span
                    className={`text-[9px] block text-right mt-1 font-mono ${
                      msg.role === 'user' ? 'text-red-200/80' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Response Bubble */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[85%] rounded-2xl p-3 shadow-sm bg-[#141E33] border border-slate-700/80 text-slate-200 rounded-bl-none leading-relaxed">
                  {streamingText ? (
                    <div className="whitespace-pre-wrap">
                      {streamingText}
                      <span className="inline-block w-1.5 h-3.5 bg-red-400 ml-1 animate-pulse align-middle" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      <span>Checking contract clauses...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Question Chips */}
          <div className="px-3 py-2 bg-[#0E1626] border-t border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Suggestions:
            </span>
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#111A2E] border-t border-slate-700/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about deposits, early termination, fees..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#090F1B] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`p-2 rounded-xl text-white transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-red-600 hover:bg-red-500 cursor-pointer shadow-sm'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
