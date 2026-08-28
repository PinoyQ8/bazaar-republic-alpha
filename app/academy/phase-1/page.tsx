'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  KeyRound, 
  Award, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  phase: number;
  category: string;
  text: string;
  options: QuizOption[];
}

interface AssessmentResult {
  phase: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  requiredScore: number;
}

export default function AcademyPhase1Page() {
  // Assessment Flow States: 'INTRO' | 'QUIZ' | 'SUBMITTING' | 'RESULT'
  const [gameState, setGameState] = useState<'INTRO' | 'QUIZ' | 'SUBMITTING' | 'RESULT'>('INTRO');
  
  // Quiz Questions & User Selection State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // API Loading & Result States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [passkeySigned, setPasskeySigned] = useState<boolean>(false);

  // Fetch 5 Randomized & Shuffled Questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/academy/quiz?phase=1');
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load assessment pool');
      }

      setQuestions(data.questions || []);
      setCurrentIdx(0);
      setUserAnswers({});
      setPasskeySigned(false);
      setGameState('QUIZ');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error connecting to Academy engine');
    } finally {
      setLoading(false);
    }
  };

  // Option Selection Handler
  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Submit Quiz Payload to API for Server-Side Evaluation
  const handleSubmitAssessment = async () => {
    setGameState('SUBMITTING');
    setErrorMsg(null);

    const payload = {
      phase: 1,
      userPasskeyId: 'knox-s23', // Hardened Knox Enclave Anchor
      answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    };

    try {
      const res = await fetch('/api/academy/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const evalData: AssessmentResult = await res.json();

      if (!res.ok) {
        throw new Error((evalData as any).error || 'Assessment evaluation failed');
      }

      setResult(evalData);
      setGameState('RESULT');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Submission error');
      setGameState('QUIZ');
    }
  };

  // Simulate Knox Hardware Passkey Assertion on 100% Pass
  const handlePasskeySignBadge = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // Enclave assertion delay
    setPasskeySigned(true);
    setLoading(false);
  };

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const isCurrentAnswered = currentQ ? Boolean(userAnswers[currentQ.id]) : false;
  const allAnswered = questions.length > 0 && Object.keys(userAnswers).length === questions.length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-4 font-sans pb-28 overflow-x-hidden">
      <div className="max-w-md mx-auto space-y-3.5 w-full">
        
        {/* HEADER BAR — TOP-LEVEL /academy ROUTE */}
        <div className="flex items-center justify-between pt-1">
          <Link 
            href="/academy" 
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft size={16} /> Academy Hub
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800/80 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
              <Award size={11} /> Phase 1
            </span>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-800 p-3 rounded-2xl flex items-start gap-2 text-xs font-mono text-rose-300 wrap-break-word">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Engine Alert</span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STATE 1: INTRO SCREEN */}
        {/* ================================================================= */}
        {gameState === 'INTRO' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-2xl text-amber-400 shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                  Pioneer Essentials
                </h1>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Phase 1 Certification • Bazaar Academy
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl space-y-2 font-mono text-xs text-neutral-300">
              <div className="flex items-center justify-between text-[11px] pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Randomized Questions</span>
                <span className="text-amber-400 font-bold">5 Served</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Passing Score Required</span>
                <span className="text-emerald-400 font-bold">100% (5 / 5)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Security Invariant</span>
                <span className="text-cyan-400 font-bold">Option Shuffled</span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 leading-relaxed font-mono bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/50">
              💡 Questions and options are selected at random from the database pool. Passing grants Knox Passkey credential badges for L2 merchant permissions.
            </div>

            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-linear-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:opacity-95 font-mono font-bold rounded-xl text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg border border-amber-400/30 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-amber-200" />
                  <span>Loading Assessment Pool...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Start Phase 1 Assessment</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STATE 2: ACTIVE QUIZ SCREEN */}
        {/* ================================================================= */}
        {gameState === 'QUIZ' && currentQ && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4">
            
            {/* PROGRESS BAR & STEP METRICS */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 flex items-center gap-1 font-bold">
                  <HelpCircle size={14} className="text-amber-400" /> Question {currentIdx + 1} of {totalQ}
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded font-bold uppercase">
                  {currentQ.category}
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div 
                  className="h-full bg-linear-to-r from-amber-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
                />
              </div>
            </div>

            {/* QUESTION TEXT */}
            <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl">
              <h2 className="text-xs sm:text-sm font-bold text-white leading-snug wrap-break-word">
                {currentQ.text}
              </h2>
            </div>

            {/* SHUFFLED OPTIONS LIST */}
            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = userAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-3 rounded-xl border font-mono text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold shadow-md'
                        : 'bg-neutral-950 border-neutral-800/90 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold ${
                      isSelected 
                        ? 'border-indigo-400 bg-indigo-600 text-white' 
                        : 'border-neutral-700 text-neutral-500'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="leading-tight wrap-break-word">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION / SUBMIT CONTROLS */}
            <div className="flex gap-2 pt-1">
              {currentIdx > 0 && (
                <button
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="py-3 px-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 font-mono text-xs font-bold rounded-xl text-neutral-300 transition"
                >
                  Previous
                </button>
              )}

              {currentIdx < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  disabled={!isCurrentAnswered}
                  className="flex-1 py-3 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-mono text-xs font-bold rounded-xl text-white uppercase tracking-wider flex items-center justify-center gap-1 transition shadow-lg"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={!allAnswered}
                  className="flex-1 py-3 px-3 bg-linear-to-r from-emerald-600 to-cyan-600 hover:opacity-95 disabled:opacity-40 font-mono text-xs font-bold rounded-xl text-white uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg active:scale-[0.98]"
                >
                  <KeyRound size={15} />
                  <span>Submit Assessment</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* STATE 3: SUBMITTING EVALUATION STATE */}
        {/* ================================================================= */}
        {gameState === 'SUBMITTING' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-3 font-mono shadow-2xl">
            <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
            <h2 className="text-sm font-bold text-white">Evaluating Submission...</h2>
            <p className="text-[11px] text-neutral-400">
              Checking responses against server ground truth in MongoDB...
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* STATE 4: RESULT SCREEN */}
        {/* ================================================================= */}
        {gameState === 'RESULT' && result && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4">
            
            {/* PASSED UI */}
            {result.passed ? (
              <div className="space-y-3.5">
                <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-center space-y-2 font-mono">
                  <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                  <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                    Phase 1 Certified!
                  </h2>
                  <div className="text-2xl font-bold text-white">
                    {result.score}% <span className="text-xs font-normal text-emerald-400">({result.correctAnswers}/{result.totalQuestions})</span>
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Perfect score achieved. You are authorized for Phase 2 operations.
                  </p>
                </div>

                {/* KNOX PASSKEY SIGNED BADGE CARD */}
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400 flex items-center gap-1 font-bold">
                      <ShieldCheck size={14} className="text-cyan-400" /> Passkey Badge Assertion
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      passkeySigned ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {passkeySigned ? 'ASSERTED' : 'PENDING'}
                    </span>
                  </div>

                  {!passkeySigned ? (
                    <button
                      onClick={handlePasskeySignBadge}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-cyan-200" />
                          <span>Signing Knox Enclave...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={14} />
                          <span>Sign Certification Badge (S23 Enclave)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/80 p-2 rounded-xl break-all">
                      Proof: <span className="font-bold text-emerald-200">0x_knox_s23_phase1_certified_ok</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/academy"
                  className="w-full py-3 px-3 bg-linear-to-r from-emerald-600 to-cyan-600 font-mono font-bold rounded-xl text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg text-center"
                >
                  Return to Academy Hub
                </Link>
              </div>
            ) : (
              /* FAILED UI (<100%) */
              <div className="space-y-3.5">
                <div className="bg-rose-950/60 border border-rose-800 p-4 rounded-2xl text-center space-y-2 font-mono">
                  <XCircle size={36} className="text-rose-400 mx-auto" />
                  <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                    Assessment Incomplete
                  </h2>
                  <div className="text-2xl font-bold text-white">
                    {result.score}% <span className="text-xs font-normal text-rose-400">({result.correctAnswers}/{result.totalQuestions})</span>
                  </div>
                  <p className="text-[10px] text-neutral-300 leading-snug">
                    Phase 1 requires 100% accuracy. Review the Consumer/Service Provider Manual and try again.
                  </p>
                </div>

                <button
                  onClick={fetchQuestions}
                  disabled={loading}
                  className="w-full py-3 px-3 bg-linear-to-r from-amber-500 to-indigo-600 font-mono font-bold rounded-xl text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg active:scale-[0.98]"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  <span>Retry Assessment (New Shuffled Pool)</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}