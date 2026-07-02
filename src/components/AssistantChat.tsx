import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  User, 
  Bot, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Trash2, 
  Activity, 
  Compass, 
  Award,
  BookOpen
} from "lucide-react";
import { motion } from "motion/react";
import { ChatMessage, UserProfile } from "../types";

interface AssistantChatProps {
  userProfile: UserProfile;
}

// Advanced inline markdown parser to render lists, headers, and bold text beautifully
function parseMarkdown(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-[11px] sm:text-xs">
      {lines.map((line, index) => {
        // Headers (e.g., ### Title)
        if (line.startsWith("### ")) {
          return (
            <h4 key={index} className="text-xs sm:text-sm font-bold text-mecha-neon mt-2 mb-1 uppercase tracking-wider">
              {parseInline(line.substring(4))}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={index} className="text-xs sm:text-sm font-extrabold text-mecha-neon mt-3 mb-1.5 border-b border-glass-border/35 pb-1">
              {parseInline(line.substring(3))}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={index} className="text-sm sm:text-base font-black text-mecha-neon mt-4 mb-2">
              {parseInline(line.substring(2))}
            </h2>
          );
        }

        // Bullet Lists
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const content = line.trim().substring(2);
          return (
            <div key={index} className="flex items-start gap-1.5 ml-2">
              <span className="text-mecha-neon mt-1">•</span>
              <span className="text-bamboo-beige/95 leading-relaxed">{parseInline(content)}</span>
            </div>
          );
        }

        // Numbered Lists
        const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex items-start gap-1.5 ml-2">
              <span className="text-mecha-neon font-mono text-[10px] mt-0.5">{numberedMatch[1]}.</span>
              <span className="text-bamboo-beige/95 leading-relaxed">{parseInline(numberedMatch[2])}</span>
            </div>
          );
        }

        // Spacing
        if (line.trim() === "") {
          return <div key={index} className="h-1.5" />;
        }

        // Normal paragraph text
        return (
          <p key={index} className="text-bamboo-beige/95 leading-relaxed">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function parseInline(text: string) {
  // Match bold tags **bold text**
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="text-white font-extrabold bg-white/5 px-1 py-0.5 rounded border border-white/5">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export default function AssistantChat({ userProfile }: AssistantChatProps) {
  const getStorageKey = (email: string) => {
    const cleanEmail = (email || "default").trim().toLowerCase();
    return `aahar_chat_history_v1_${cleanEmail}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const key = `aahar_chat_history_v1_${(userProfile.email || "default").trim().toLowerCase()}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not retrieve local chat history", e);
    }
    return [
      {
        id: "init-1",
        sender: "assistant",
        text: "Namaste! I am your AI Indian Clinical Wellness Companion. I'm connected directly to your health metrics, medical profile, and daily diet logs.\n\nHow can I help you today? Feel free to ask about custom food swaps, glycemic index, recipe replacements, or trigger a full clinical profile analysis!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<"swaps" | "goals" | "nutrition">("swaps");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync state to local storage on changes
  useEffect(() => {
    const key = getStorageKey(userProfile.email);
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save chat history", e);
    }
  }, [messages, userProfile.email]);

  // Keep track of email to update chat when switching users
  const prevEmailRef = useRef(userProfile.email);

  useEffect(() => {
    if (prevEmailRef.current !== userProfile.email) {
      prevEmailRef.current = userProfile.email;
      const key = getStorageKey(userProfile.email);
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          setMessages(JSON.parse(saved));
        } else {
          setMessages([
            {
              id: "init-1",
              sender: "assistant",
              text: "Namaste! I am your AI Indian Clinical Wellness Companion. I'm connected directly to your health metrics, medical profile, and daily diet logs.\n\nHow can I help you today? Feel free to ask about custom food swaps, glycemic index, recipe replacements, or trigger a full clinical profile analysis!",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (e) {
        console.warn("Could not retrieve local chat history", e);
      }
    }
  }, [userProfile.email]);

  // Auto-scroll inside chat box
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Handle system synthesis / text speech
  const speakText = (text: string, msgId: string) => {
    if ("speechSynthesis" in window) {
      if (speakingId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel(); // Stop any pending utterances
      
      // Filter out markdown characters from speech for clear articulation
      const cleanText = text
        .replace(/\*\*/g, "")
        .replace(/###/g, "")
        .replace(/##/g, "")
        .replace(/- /g, "")
        .replace(/\n/g, ". ");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      
      setSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported by your browser environment.");
    }
  };

  // Helper to copy text copy to clipboards safely
  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
    });
  };

  const clearChatHistory = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    const initialMsg: ChatMessage = {
      id: "init-1",
      sender: "assistant",
      text: "Namaste! I am your AI Indian Clinical Wellness Companion. I'm connected directly to your health metrics, medical profile, and daily diet logs.\n\nHow can I help you today? Feel free to ask about custom food swaps, glycemic index, recipe replacements, or trigger a full clinical profile analysis!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const key = getStorageKey(userProfile.email);
    try {
      localStorage.setItem(key, JSON.stringify([initialMsg]));
    } catch (e) {
      console.warn("Could not reset local storage chat history", e);
    }
    
    setMessages([initialMsg]);
    setShowConfirmReset(false);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/diet/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userProfile
        })
      });

      if (!response.ok) {
        throw new Error("Chat connection failed.");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        text: data.text || "I apologize, but I could not formulate a response. Let me try again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "assistant",
        text: "I encountered an issue connecting to the Gemini server. Please verify your GEMINI_API_KEY is configured correctly. In the meantime, feel free to ask about general calories!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Run a deep comprehensive profile summary evaluation
  const runProfileEvaluation = () => {
    const onboardingData = userProfile.onboardingData;
    const healthIssues = onboardingData?.medicalConditions?.length 
      ? onboardingData.medicalConditions.join(", ") 
      : "No chronic diseases logged";
    
    const activePlanName = userProfile.dietPlan?.planId ? "My Active Diet Plan" : "Standard Balanced Diet";
    
    const evalQuery = `Perform an immediate clinical review on my profile. Here are my metrics:
- Age: ${onboardingData?.age || "Not specified"} years
- Primary Wellness Goal: ${onboardingData?.healthGoal || "General wellness"}
- Chronic Health Issues: ${healthIssues}
- Active Indian Diet Plan: ${activePlanName}
- Target Daily Calories: ${userProfile.dietPlan?.days?.[0]?.totalCalories || 1800} kcal

Please evaluate these and output:
1. **Critical Strengths & Clinical Alignment**
2. **3 High-Impact Dietary Swaps** specifically relevant to Indian cuisine
3. **Important Safety Guidelines** regarding my profile.`;

    handleSendMessage(evalQuery);
  };

  // Structured suggestion categories
  const promptTabs = {
    swaps: {
      label: "Diet Swaps",
      icon: Compass,
      chips: [
        "How to replace Paneer with low-calorie options?",
        "Healthy low-glycemic Indian options for white rice",
        "Dairy-free alternatives for daily ginger chai",
        "Explain high-protein replacements for Maida roti"
      ]
    },
    goals: {
      label: "Clinical Goals",
      icon: Award,
      chips: [
        "List 5 high-fiber Indian snacks for diabetes",
        "How should I adjust salt if dealing with Hypertension?",
        "Indian foods to avoid with high Uric Acid",
        "Suggest thyroid-friendly breakfast modifications"
      ]
    },
    nutrition: {
      label: "Quick Guides",
      icon: BookOpen,
      chips: [
        "Explain the benefit of fermented idli/dosa batters",
        "How much protein is in 100g of cooked Moong Dal?",
        "Healthy cold-pressed oil choices for Indian tempering",
        "How to space water intake for efficient hydration"
      ]
    }
  };

  return (
    <div id="ai-coach-page" className="space-y-6 pb-28">
      {/* Page header and action toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex items-center gap-2">
            AI Wellness Coach <Sparkles className="w-5 h-5 text-mecha-neon animate-pulse" />
          </h2>
          <p className="text-[11px] sm:text-xs text-tea-mist leading-relaxed mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            Explore recipes, medical meal swaps, and immediate nutritional guidance calibrated to Indian cuisine standards.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={runProfileEvaluation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-mecha-green/15 hover:bg-mecha-green/25 border border-mecha-neon/30 text-mecha-neon text-[11px] font-mono transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Analyze My Profile
          </button>
          
          {showConfirmReset ? (
            <div className="flex items-center gap-1.5 animate-fade-in bg-black/50 px-2.5 py-1.5 rounded-xl border border-rose-500/30">
              <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase tracking-wider">Clear Chat?</span>
              <button
                onClick={clearChatHistory}
                className="px-2 py-0.5 rounded bg-rose-500/25 border border-rose-500/45 text-rose-300 text-[10px] hover:bg-rose-500/35 font-mono cursor-pointer transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/15 text-bamboo-beige/80 text-[10px] hover:bg-white/10 font-mono cursor-pointer transition-all"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-2 rounded-xl bg-black/40 border border-glass-border/40 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Reset Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div id="ai-chat-interface" className="flex flex-col h-[58vh] sm:h-[62vh] glass-panel rounded-3xl overflow-hidden border border-glass-border shadow-2xl relative">
        
        {/* Active connection header */}
        <div className="p-4 bg-black/45 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mecha-green/20 to-emerald-500/10 border border-mecha-neon/30 flex items-center justify-center text-mecha-neon shadow-[0_0_10px_rgba(0,255,136,0.15)]">
              <Bot className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Aahar AI Nutrition Desk</h3>
              <span className="text-[9px] font-mono text-mecha-neon uppercase tracking-wider block">Clinical Intelligence Active</span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono border transition-all ${
            isOnline 
              ? "bg-mecha-green/10 text-mecha-neon border-mecha-neon/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-mecha-neon animate-ping" : "bg-red-500"}`} />
            {isOnline ? "CONNECTED" : "DISCONNECTED"}
          </div>
        </div>

        {/* Dynamic chat window feed */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-black/10"
        >
          {messages.map((msg) => {
            const isBot = msg.sender === "assistant";
            return (
              <div 
                key={msg.id}
                className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-lg bg-mecha-green/10 border border-mecha-neon/20 flex items-center justify-center shrink-0 text-mecha-neon mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed border flex flex-col gap-2 relative group transition-all ${
                    isBot 
                      ? 'bg-glass-card border-glass-border text-bamboo-beige/95 rounded-tl-none shadow-md' 
                      : 'bg-gradient-to-r from-mecha-green to-emerald-700 border-mecha-neon/20 text-black font-semibold rounded-tr-none shadow-lg'
                  }`}
                >
                  {/* Markdown or plain text block parser */}
                  {isBot ? parseMarkdown(msg.text) : <div className="whitespace-pre-wrap font-sans text-[11px] sm:text-xs">{msg.text}</div>}
                  
                  {/* Meta control toolbar for messages */}
                  <div className="flex items-center justify-between gap-4 mt-2 pt-1.5 border-t border-glass-border/10">
                    <span className={`text-[8px] font-mono block ${isBot ? 'text-tea-mist/55' : 'text-black/50'}`}>
                      {msg.timestamp}
                    </span>
                    
                    {/* Action indicators for bot messages */}
                    {isBot && (
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="p-1 rounded hover:bg-white/10 text-tea-mist hover:text-white transition-all cursor-pointer"
                          title="Copy advice to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-mecha-neon" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => speakText(msg.text, msg.id)}
                          className={`p-1 rounded hover:bg-white/10 transition-all cursor-pointer ${speakingId === msg.id ? 'text-mecha-neon animate-pulse bg-mecha-neon/10' : 'text-tea-mist hover:text-white'}`}
                          title={speakingId === msg.id ? "Stop voice guidance" : "Listen to advice"}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-lg bg-mecha-green/20 border border-mecha-neon/20 flex items-center justify-center shrink-0 text-mecha-neon mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Inline processing placeholder */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-tea-mist font-mono p-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-mecha-neon" />
              <span>Aahar Clinical AI is formulating diet analysis...</span>
            </div>
          )}
        </div>

        {/* Categories Tab selector */}
        <div className="bg-black/30 border-t border-glass-border/30 px-4 pt-2 pb-1 shrink-0">
          <div className="flex gap-1 border-b border-glass-border/20 pb-1.5 overflow-x-auto scrollbar-none">
            {(Object.keys(promptTabs) as Array<keyof typeof promptTabs>).map((tabKey) => {
              const TabIcon = promptTabs[tabKey].icon;
              const isSelected = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isSelected 
                      ? 'bg-mecha-green/20 border border-mecha-neon/30 text-mecha-neon' 
                      : 'text-tea-mist/60 hover:text-white border border-transparent'
                  }`}
                >
                  <TabIcon className="w-3 h-3" />
                  {promptTabs[tabKey].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggestion Chips list according to active tab */}
        <div className="px-4 py-2 bg-black/20 flex gap-2 overflow-x-auto scrollbar-none shrink-0 border-b border-glass-border/30">
          {promptTabs[activeTab].chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 rounded-xl border border-glass-border bg-black/40 text-[10px] text-tea-mist hover:text-white hover:border-mecha-neon/40 hover:bg-black/60 transition-all cursor-pointer whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-black/45 shrink-0 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
            placeholder="Ask about clinical swaps, recipes, calorie targets, or glycemic ratings..."
            className="flex-1 glass-input px-4 py-3 rounded-xl text-xs focus:outline-none bg-black/60 border border-glass-border text-bamboo-beige"
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon flex items-center justify-center text-black shrink-0 transition-all shadow-md active:scale-95 disabled:opacity-45 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
