'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { 
  Store, 
  Shield, 
  Zap, 
  Search, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Loader2, 
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  businessName: string;
  category: 'LOGISTICS' | 'HARDWARE' | 'TECH_SERVICES' | 'INFRASTRUCTURE';
  description: string;
  providerUid: string;
  sectorLocation: string;
  mbzrRate: number;
  unitLabel: string;
  isVerified: boolean;
  totalSettlements: number;
  rating: number;
}

export default function ENetworkDirectoryPage() {
  const auth = useAuth();
  const pioneer = auth?.pioneer;
  
  // 🛡️ MESH PATCH: Direct Live Balance State (Guaranteed Sync)
  const [liveBalance, setLiveBalance] = useState<number>(3140.90);

  const fetchLiveBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/network/balance');
      const data = await res.json();
      if (data.success && typeof data.balance === 'number') {
        setLiveBalance(data.balance);
      }
    } catch (err) {
      console.error("Balance poll failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchLiveBalance();
    const interval = setInterval(fetchLiveBalance, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [fetchLiveBalance]);

  const pioneerMbzrBalance: number = liveBalance;

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Settlement State
  const [activePayProvider, setActivePayProvider] = useState<ServiceProvider | null>(null);
  const [unitsToPay, setUnitsToPay] = useState<number>(1);
  const [isProcessingSettlement, setIsProcessingSettlement] = useState<boolean>(false);
  
  // Registration State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState<ServiceProvider['category']>('LOGISTICS');
  const [regDescription, setRegDescription] = useState('');
  const [regLocation, setRegLocation] = useState('Sector 1');
  const [regRate, setRegRate] = useState<number>(10);
  const [regUnit, setRegUnit] = useState('per service');

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // 🛡️ 1. FETCH LIVE E-NETWORK PROVIDERS FROM API
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/network/providers');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch service provider directory.');
      }
      setProviders(data.telemetry.providers || []);
    } catch (err: any) {
      console.error('[ENET-DIRECTORY] Data Ingestion Error:', err);
      setError(err.message || 'Error connecting to provider directory API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Filtered Providers
  const filteredProviders = providers.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesQuery = p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sectorLocation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // 🛡️ 2. EXECUTE ATOMIC MICRO-SETTLEMENT VIA API
  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUid = pioneer?.uid || 'pi_node_founder_99';
    if (!activePayProvider) {
      setFeedback({ type: 'error', msg: 'UNAUTHENTICATED_NODE: Target provider required.' });
      return;
    }

    const totalCostMbzr = activePayProvider.mbzrRate * unitsToPay;

    if (pioneerMbzrBalance < totalCostMbzr) {
      setFeedback({
        type: 'error',
        msg: `INSUFFICIENT_MBZR: Required ${totalCostMbzr} mBZR, but your vault holds ${pioneerMbzrBalance.toLocaleString()} mBZR.`,
      });
      return;
    }

    setIsProcessingSettlement(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/network/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerUid: activeUid,
          providerId: activePayProvider.id,
          units: unitsToPay,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Micro-settlement dispatch failed.');
      }

      // Refresh live balance immediately
      await fetchLiveBalance();

      setFeedback({
        type: 'success',
        msg: `SETTLEMENT_CONFIRMED: Dispatched ${totalCostMbzr} mBZR to [${activePayProvider.businessName}]. Ledger ID: ${data.telemetry.ledgerId}`,
      });

      setActivePayProvider(null);
      setUnitsToPay(1);

      // Refresh directory counter states
      await fetchProviders();
    } catch (err: any) {
      console.error('[ENET-SETTLEMENT] Dispatch Exception:', err);
      setFeedback({
        type: 'error',
        msg: err.message || 'Micro-settlement transaction failed.',
      });
    } finally {
      setIsProcessingSettlement(false);
    }
  };

  // 🛡️ 3. REGISTER NEW SERVICE PROVIDER VIA API
  const handleRegisterProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUid = pioneer?.uid || 'pi_node_founder_99';
    if (!regName || !regDescription) {
      setFeedback({ type: 'error', msg: 'UNAUTHENTICATED_NODE: Business details required.' });
      return;
    }

    setIsRegistering(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/network/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: regName,
          category: regCategory,
          description: regDescription,
          providerUid: activeUid,
          sectorLocation: regLocation,
          mbzrRate: regRate,
          unitLabel: regUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Provider registration failed.');
      }

      setFeedback({
        type: 'success',
        msg: `PROVIDER_NODE_ACTIVATED: Registered [${data.telemetry.provider.businessName}] on the E-Network Directory.`,
      });

      setRegName('');
      setRegDescription('');
      setShowRegisterModal(false);

      await fetchProviders();
    } catch (err: any) {
      console.error('[ENET-REGISTRATION] Exception:', err);
      setFeedback({
        type: 'error',
        msg: err.message || 'Could not register service provider node.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30 space-y-6">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/academy" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-emerald-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-500" /> E-NETWORK MERCHANT DIRECTORY
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Real-World Service Provider Listings & mBZR Micro-Settlements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchProviders(); fetchLiveBalance(); }}
            disabled={loading}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 rounded transition-colors disabled:opacity-50"
            title="Sync Providers & Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold uppercase rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" /> Register Service Node
          </button>
        </div>
      </div>

      {/* 🛡️ FEEDBACK BANNER */}
      {feedback && (
        <div className={`p-3 border rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
            : 'bg-red-950/30 border-red-900/50 text-red-400'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* 🛡️ PIONEER LIQUIDITY TELEMETRY */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" /> Settlement Vault Balance
          </span>
          <p className="text-xl font-bold text-purple-400">
            {pioneerMbzrBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-zinc-400 font-normal">mBZR</span>
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Active Providers</span>
            <span className="font-bold text-cyan-400">{providers.length} Nodes</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Settlement Asset</span>
            <span className="font-bold text-emerald-400">mBZR Utility</span>
          </div>
        </div>
      </div>

      {/* 🛡️ SEARCH & CATEGORY FILTERS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service providers, sectors, or descriptions..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['ALL', 'LOGISTICS', 'HARDWARE', 'TECH_SERVICES', 'INFRASTRUCTURE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 🛡️ PROVIDER LISTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Scanning E-Network Service Nodes...
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="col-span-full p-8 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center text-zinc-500 text-xs">
            No active E-Network service nodes match your search criteria.
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <div key={provider.id} className="p-5 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-lg space-y-4 flex flex-col justify-between transition-all">
              
              <div className="space-y-3">
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded uppercase">
                    {provider.category.replace('_', ' ')}
                  </span>
                  
                  {provider.isVerified && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Node
                    </span>
                  )}
                </div>

                {/* Business Details */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400 shrink-0" /> {provider.businessName}
                  </h3>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-zinc-400" /> {provider.sectorLocation} • Node: <span className="text-zinc-300 font-mono">{provider.providerUid}</span>
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">{provider.description}</p>
                </div>
              </div>

              {/* Pricing & Settlement Trigger */}
              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">Settlement Rate</span>
                  <p className="text-sm font-bold text-purple-400">
                    {provider.mbzrRate} <span className="text-[10px] text-zinc-400 font-normal">mBZR ({provider.unitLabel})</span>
                  </p>
                </div>

                <button
                  onClick={() => setActivePayProvider(provider)}
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold uppercase rounded flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3 h-3 text-emerald-400" /> Micro-Settle
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 🛡️ MICRO-SETTLEMENT PAYMENT MODAL */}
      {activePayProvider && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" /> Dispatch mBZR Settlement
              </h3>
              <button 
                onClick={() => { setActivePayProvider(null); setFeedback(null); }} 
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* 🛡️ MESH PATCH: Inline Error Telemetry */}
            {feedback && feedback.type === 'error' && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-2 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteSettlement} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Target Provider</span>
                <p className="font-bold text-zinc-200">{activePayProvider.businessName}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{activePayProvider.providerUid}</p>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Service Multiplier / Units ({activePayProvider.unitLabel})</label>
                <div className="flex items-center gap-3">
                  {/* 🛡️ MESH PATCH: Tactile Decrement */}
                  <button
                    type="button"
                    onClick={() => setUnitsToPay((prev) => Math.max(1, prev - 1))}
                    className="p-2.5 px-4 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-zinc-400 hover:text-emerald-400"
                  >
                    <span className="text-lg font-bold leading-none">-</span>
                  </button>
                  
                  {/* 🛡️ MESH PATCH: Relaxed Input Shield */}
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={unitsToPay || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) setUnitsToPay(0);
                      else setUnitsToPay(Math.min(100, val));
                    }}
                    onBlur={() => {
                      if (unitsToPay < 1 || isNaN(unitsToPay)) setUnitsToPay(1);
                    }}
                    required
                    className="w-full text-center bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  {/* 🛡️ MESH PATCH: Tactile Increment */}
                  <button
                    type="button"
                    onClick={() => setUnitsToPay((prev) => Math.min(100, prev + 1))}
                    className="p-2.5 px-4 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-zinc-400 hover:text-emerald-400"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                </div>
              </div>

              {/* Settlement Summary Calculation */}
              <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Unit Rate:</span>
                  <span className="text-purple-300 font-bold">{activePayProvider.mbzrRate} mBZR</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Units Requested:</span>
                  <span className="text-zinc-200 font-bold">{unitsToPay}</span>
                </div>
                <div className="border-t border-purple-900/40 pt-2 flex justify-between text-xs">
                  <span className="text-zinc-300 font-bold">Total Settlement:</span>
                  <span className="text-emerald-400 font-bold">{activePayProvider.mbzrRate * unitsToPay} mBZR</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setActivePayProvider(null); setFeedback(null); }}
                  disabled={isProcessingSettlement}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold uppercase rounded disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingSettlement}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold uppercase rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingSettlement ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Dispatch'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🛡️ REGISTER PROVIDER MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-lg w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Register E-Network Service Node
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterProvider} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Business / Service Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Neo-Mesh Cloud Relay"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Category</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value as ServiceProvider['category'])}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOGISTICS">LOGISTICS</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="TECH_SERVICES">TECH SERVICES</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Sector Location</label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    placeholder="e.g. Sector 4"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">mBZR Rate</label>
                  <input
                    type="number"
                    min={1}
                    value={regRate}
                    onChange={(e) => setRegRate(parseInt(e.target.value) || 1)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Unit Label</label>
                  <input
                    type="text"
                    value={regUnit}
                    onChange={(e) => setRegUnit(e.target.value)}
                    placeholder="e.g. per item"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Service Description</label>
                <textarea
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the capabilities and terms of this service node..."
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  disabled={isRegistering}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold uppercase rounded disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold uppercase rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate Provider Node'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  );
}