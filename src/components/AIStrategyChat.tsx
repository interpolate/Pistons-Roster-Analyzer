import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, X, MessageSquare, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIStrategyChatProps {
  excludedPlayerIds: string[];
  addedProspectIds: string[];
  addedFreeAgentIds: string[];
  onNavigateToTab?: (tab: string) => void;
}

export default function AIStrategyChat({
  excludedPlayerIds,
  addedProspectIds,
  addedFreeAgentIds,
  onNavigateToTab,
}: AIStrategyChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: "Welcome, Coach. I am your **Front Office AI Advisor**. I am plugged into our active squad roster, the deep 2026 Draft Class scouting stats, and the available Free Agents. \n\nI see you are in the **Roster Architect** workspace. Let me know what moves or target evaluations you want to make, or click any prompt pill below to start strategic planning!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Suggestions that change based on what simulation adjustments the user has made
  const getSuggestionPills = () => {
    const suggestions = [
      "Evaluate current roster gaps & spacing",
      "Which 2026 Draft Prospect fits our core?",
      "Who are our optimal Free Agency targets for Cap Space?"
    ];

    if (addedProspectIds.length > 0 || addedFreeAgentIds.length > 0 || excludedPlayerIds.length > 0) {
      suggestions.unshift("Analyze my current simulated roster changes");
    }

    return suggestions.slice(0, 3);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);
    setErrorStatus(null);

    try {
      // Package messages for api
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Injected simulatedState context to empower the system
      const simulatedState = {
        excludedIds: excludedPlayerIds,
        prospectIds: addedProspectIds,
        freeAgentIds: addedFreeAgentIds,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          simulatedState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact Front Office AI.");
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An issue occurred. Ensure your API key is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Draft terminal initialized. Rerouting roster insights directly. Ask me questions about our players or future targets!",
        timestamp: new Date(),
      },
    ]);
    setErrorStatus(null);
  };

  // Safe robust parser to format bold keywords and linebreaks into clean JSX
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      // Process bold formatting (**bold**)
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const content = parts.map((part, partIdx) => {
        // odd indices contain matching capturing groups (the bold text)
        if (partIdx % 2 === 1) {
          return <strong key={partIdx} className="font-extrabold text-white text-shadow-sm">{part}</strong>;
        }
        return part;
      });

      // Quick clean display for bullet lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const listText = line.substring(2);
        return (
          <div key={lineIdx} className="flex gap-2 pl-3 py-0.5 text-slate-200">
            <span className="text-blue-500 font-bold shrink-0">•</span>
            <span className="text-sm leading-relaxed">{renderFormattedText(listText)}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="text-sm leading-relaxed text-slate-200 min-h-[1rem]">
          {content}
        </p>
      );
    });
  };

  const activeMoveCount = excludedPlayerIds.length + addedProspectIds.length + addedFreeAgentIds.length;

  return (
    <>
      {/* Persistent floating triggers to activate chat from any tab */}
      <button
        id="ai-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white p-4 rounded-full shadow-2xl shadow-blue-500/20 border border-blue-400 flex items-center gap-2 group cursor-pointer transition-all duration-300"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-red-300" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-sm tracking-tight whitespace-nowrap">
          AI GM Terminal
        </span>
        {activeMoveCount > 0 && (
          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 border border-white text-[10px] font-black flex items-center justify-center animate-bounce">
            {activeMoveCount}
          </span>
        )}
      </button>

      {/* Drawer layout overlay */}
      <div
        id="ai-drawer-backdrop"
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-45 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        id="ai-drawer"
        className={`fixed top-0 right-0 h-screen w-[480px] max-w-full bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-linear-to-b from-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">GM STRATEGY TERMINAL</h3>
                <span className="text-[9px] bg-red-600/15 text-red-500 border border-red-500/30 font-mono font-bold px-1 rounded uppercase tracking-wide">
                  Gemini API
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-mono uppercase">Interactive Roster Advisor</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulation Tracking Context Bar */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Sandbox State:</span>
          </div>
          <div className="flex gap-2">
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${excludedPlayerIds.length > 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800/60 text-slate-500"}`}>
              Releases: {excludedPlayerIds.length}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${addedProspectIds.length > 0 ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-800/60 text-slate-500"}`}>
              Drafts: {addedProspectIds.length}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${addedFreeAgentIds.length > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800/60 text-slate-500"}`}>
              Signs: {addedFreeAgentIds.length}
            </span>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 flex flex-col">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md shadow-black/30"
                }`}
              >
                <div className="space-y-1.5 break-words">
                  {renderFormattedText(msg.content)}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex flex-col items-start max-w-[85%]">
              <div className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs font-mono tracking-wide text-blue-200 animate-pulse">FRONT OFFICE COG-NET COMPILING...</span>
              </div>
            </div>
          )}

          {errorStatus && (
            <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold underline">GM Advisor Terminal Error</p>
                <p className="mt-1 leading-relaxed">{errorStatus}</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Action pills & Form control */}
        <div className="p-4 bg-linear-to-b from-slate-950 to-slate-900 border-t border-slate-800">
          {/* Diagnostic suggestion pills */}
          <div className="mb-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-1.5">Suggested Audits</p>
            <div className="flex flex-wrap gap-1.5">
              {getSuggestionPills().map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  disabled={isLoading}
                  className="text-[11px] text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-left shrink-0 max-w-full truncate cursor-pointer transition-all disabled:opacity-50"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Detroit AI strategist about stats or rosters..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 hover:bg-slate-900/80 focus:bg-slate-900 text-slate-100 placeholder-slate-500 text-sm border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 outline-hidden transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear terminal history"
              className="bg-slate-900 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800 p-2.5 rounded-xl cursor-pointer transition-colors shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-600 p-2.5 rounded-xl cursor-pointer transition-all shrink-0 active:scale-95 flex items-center justify-center border border-blue-500 disabled:border-slate-800"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
