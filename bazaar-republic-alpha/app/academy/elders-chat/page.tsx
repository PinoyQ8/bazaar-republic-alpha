"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// 🛡️ MESH TYPING: Defining the Ledger Message Structure
interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

export default function EldersChatSector() {
  const { pioneer } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 🧭 UI Anchor: Used to auto-scroll the viewport
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. HYDRATION: Inject the system's zero-trust welcome message
  useEffect(() => {
    setMessages([
      {
        id: "sys-01",
        sender: "ADJUDICATOR",
        content: "E-NETWORK CHANNEL SECURED. P2P ENCRYPTION ACTIVE.",
        timestamp: new Date(),
        isSystem: true,
      }
    ]);
  }, []);

  // 2. AUTO-SCROLL: Keep the viewport locked to the latest logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. 🚀 THE TRANSMISSION LOGIC
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !pioneer.username || isSyncing) return;

    // Construct the payload
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: pioneer.username,
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setIsSyncing(true);
    
    // 🛡️ Optimistic UI Update: Render immediately for the Pioneer
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate network latency to the MESH Node / DB
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    setIsSyncing(false);
    console.log(`[MESH-BRIDGE] ✅ Message ${newMessage.id} synced to ledger.`);
  };

  // Format time for terminal aesthetic
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm perfectly aligns with S23 Ultra */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative">
        
        {/* 🧭 Sticky Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <Link 
            href="/academy" 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-tighter leading-none">
              Elders Chat
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] font-mono text-emerald-500 tracking-widest uppercase">
                Encrypted Mesh Link
              </p>
            </div>
          </div>
        </div>

        {/* 💬 The Terminal Readout (Messages Area) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-20 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.isSystem ? "items-center" : msg.sender === pioneer.username ? "items-end" : "items-start"}`}
            >
              {msg.isSystem ? (
                // SYSTEM LOGIC BUBBLE
                <div className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 my-4">
                  <p className="text-[10px] font-mono text-slate-400 text-center tracking-widest">
                    {msg.content}
                  </p>
                </div>
              ) : (
                // PIONEER LOGIC BUBBLE
                <div className={`max-w-[85%] flex flex-col ${msg.sender === pioneer.username ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] font-mono text-slate-500 mb-1 px-1">
                    {msg.sender} // {formatTime(msg.timestamp)}
                  </span>
                  <div className={`px-4 py-2 rounded-xl text-sm ${
                    msg.sender === pioneer.username 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-[0_0_10px_rgba(37,99,235,0.2)]" 
                      : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ Sticky Input Console */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Transmit logic..."
              disabled={isSyncing}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSyncing}
              className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(37,99,235,0.2)]"
            >
              {isSyncing ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
              ) : (
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}