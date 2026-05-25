"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@ai-sdk/react"; 
import type { Message } from "ai"; // 🛡️ MESH-FIX: Aligned to UIMessage

export default function EldersChatSector() {
  const { pioneer } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. IGNITE THE MESH LINK (AI-SDK)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/adjudicator/chat',
    initialMessages: [
      {
        id: "sys-01",
        role: "system",
        content: "E-NETWORK CHANNEL SECURED. P2P ENCRYPTION ACTIVE. \nADJUDICATOR ONLINE."
      }
    ]
  });

  // 2. AUTO-SCROLL: Keep the viewport locked to the latest logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, error, isLoading]);

  // Format time for terminal aesthetic
  const formatTime = (date?: Date) => {
    if (!date) return "LIVE";
    return new Date(date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm perfectly aligns with S23 Ultra */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative shadow-2xl shadow-emerald-900/10">
        
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
              <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <p className={`text-[9px] font-mono tracking-widest uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
                {error ? 'Link Severed' : 'Encrypted Mesh Link'}
              </p>
            </div>
          </div>
        </div>

        {/* 💬 The Terminal Readout (Messages Area) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-20 space-y-4 custom-scrollbar">
          {/* MESH-FIX: TypeScript now perfectly understands 'UIMessage' */}
          {messages.map((msg: Message) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'system' ? "items-center" : msg.role === 'user' ? "items-end" : "items-start"}`}
            >
              {msg.role === 'system' ? (
                // SYSTEM LOGIC BUBBLE
                <div className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 my-4">
                  <p className="text-[10px] font-mono text-slate-400 text-center tracking-widest whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ) : (
                // PIONEER & ADJUDICATOR BUBBLES
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] font-mono text-slate-500 mb-1 px-1 uppercase tracking-widest">
                    {msg.role === 'user' ? (pioneer?.username || "PIONEER") : "ADJUDICATOR"} // {formatTime(msg.createdAt)}
                  </span>
                  <div className={`px-4 py-2 rounded-xl text-sm font-sans ${
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-[0_0_10px_rgba(37,99,235,0.2)]" 
                      : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 🛡️ LAYER 1 REJECTION TRAP */}
          {error && (
            <div className="flex flex-col items-center">
              <div className="bg-red-950/80 border border-red-800 rounded px-4 py-3 my-2 w-full shadow-[0_0_15px_rgba(153,27,27,0.4)]">
                <span className="text-[10px] font-mono text-red-500 font-bold tracking-widest uppercase mb-1 block">
                  [ MESH PROTOCOL VIOLATION ]
                </span>
                <p className="text-xs font-mono text-red-300 leading-tight">
                  {error.message.includes('{') ? JSON.parse(error.message).error : error.message}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ Sticky Input Console */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Transmit logic..."
              disabled={isLoading || !!error}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!error}
              className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(37,99,235,0.2)] shrink-0"
            >
              {isLoading ? (
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