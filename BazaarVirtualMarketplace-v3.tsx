"use client";

/**
 * @file BazaarVirtualMarketplace.tsx
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 1.0.2
 * @summary Responsive Marketplace Interface for S23 Ultra (384px) and Desktop.
 * Enforces 7-decimal BigInt precision, 1:1,000 Pi:mBZR peg, and Sprint 1 RBAC Escrow creation.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Store, 
  ShoppingCart, 
  ShieldCheck, 
  Info, 
  MapPin, 
  Star, 
  Plus, 
  Minus, 
  Trash2, 
  Lock, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  CheckCircle2,
  ShieldAlert,
  Terminal
} from "lucide-react";

// Types mapping 1:1 to seeded ServiceProvider & JSON Catalog formats
interface CartItem {
  id: string | number;
  name: string;
  pricePi: number;
  priceSubunits: number;
  quantity: number;
  storeName: string;
  providerUid: string;
  providerId: string;
}

// Fallback catalog preventing infinite hydration spinners if JSON file is unlinked
const FALLBACK_CATALOG = {
  categories: [
    {
      id: "CAFETERIA",
      name: "Cafeteria & Rations",
      stalls: [
        {
          businessName: "Alpha Mesh Provisions",
          providerUid: "PinoyQ8-Node-01",
          providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
          strategy: "PREMIUM",
          sectorLocation: "SECTOR-01-X570",
          description: "Calibrated daily node operator rations and energy supplies.",
          rating: 4.9,
          baseFeePi: 0.1,
          inventory: [
            {
              id: "item_rat_01",
              name: "Bio-Synthesized MESH MRE",
              description: "High-density caloric nutrition ration for SoloHost operators.",
              pricePi: 2.5,
              priceSubunits: 25000000,
            },
            {
              id: "item_rat_02",
              name: "Electrolyte Infusion Capsule",
              description: "Cellular hydration matrix formulated for long hardware shifts.",
              pricePi: 1.2,
              priceSubunits: 12000000,
            },
          ],
        },
      ],
    },
    {
      id: "HARDWARE",
      name: "Node Hardware & Relays",
      stalls: [
        {
          businessName: "SoloHost DePIN Outpost",
          providerUid: "usr_pioneer_1001",
          providerId: "65f1a2b3c4d5e6f7a8b9c0d1",
          strategy: "DISCOUNT",
          sectorLocation: "SECTOR-04-NITRO",
          description: "Hardware dongles, port forwarding relays, and SSD backup nodes.",
          rating: 5.0,
          baseFeePi: 0.5,
          inventory: [
            {
              id: "item_hw_01",
              name: "Port 31400-31409 Relay Bridge",
              description: "Pre-configured firmware module ensuring 92% Uptime Shield compliance.",
              pricePi: 15.0,
              priceSubunits: 150000000,
            },
          ],
        },
      ],
    },
  ],
};

export default function BazaarVirtualMarketplace() {
  const [catalog, setCatalog] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("CAFETERIA");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [strategyFilter, setStrategyFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"catalog" | "cart">("catalog");
  const [escrowResult, setEscrowResult] = useState<any>(null);

  // Load catalog on mount with fallback safety
  useEffect(() => {
    import("./virtual-store-catalog.json")
      .then((data) => {
        setCatalog(data.default || data);
      })
      .catch(() => {
        setCatalog(FALLBACK_CATALOG);
      });
  }, []);

  if (!catalog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 bg-slate-950 text-slate-300 font-mono">
        <RefreshCw className="animate-spin text-indigo-500 mb-3" size={24} />
        <p className="text-xs uppercase tracking-widest">Hydrating Virtual Grid...</p>
      </div>
    );
  }

  // Subunit string into Pi display (7-decimal Stroop scaling)
  const formatSubunitsToPi = (subunitsStr: string): string => {
    const subunits = BigInt(subunitsStr);
    const scale = 10000000n;
    const integerPart = subunits / scale;
    const decimalPart = subunits % scale;
    return `${integerPart}.${decimalPart.toString().padStart(7, "0")}`;
  };

  // Convert Pi to mBZR (1 Pi = 1,000 mBZR)
  const piToMbzr = (piAmountStr: string): string => {
    const amount = parseFloat(piAmountStr);
    return (amount * 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mBZR";
  };

  // Add item to cart (enforces single-merchant constraint per escrow lock)
  const addToCart = (item: any, stall: any) => {
    const differentStoreItem = cart.find((cartItem) => cartItem.providerUid !== stall.providerUid);
    const resolvedProviderId = stall.providerId || "65f1a2b3c4d5e6f7a8b9c0d1";

    if (differentStoreItem) {
      if (confirm(`You can only escrow items from one store at a time. Clear cart to add items from "${stall.businessName}"?`)) {
        setCart([
          {
            id: item.id,
            name: item.name,
            pricePi: item.pricePi,
            priceSubunits: item.priceSubunits,
            quantity: 1,
            storeName: stall.businessName,
            providerUid: stall.providerUid,
            providerId: resolvedProviderId,
          },
        ]);
      }
      return;
    }

    const existingIndex = cart.findIndex((cartItem) => cartItem.id === item.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          pricePi: item.pricePi,
          priceSubunits: item.priceSubunits,
          quantity: 1,
          storeName: stall.businessName,
          providerUid: stall.providerUid,
          providerId: resolvedProviderId,
        },
      ]);
    }
  };

  // Update item quantity in cart
  const updateQuantity = (itemId: string | number, delta: number) => {
    const index = cart.findIndex((item) => String(item.id) === String(itemId));
    if (index === -1) return;

    const updatedCart = [...cart];
    updatedCart[index].quantity += delta;

    if (updatedCart[index].quantity <= 0) {
      updatedCart.splice(index, 1);
    }
    setCart(updatedCart);
  };

  // Calculate cart total in 7-decimal BigInt subunits
  const calculateCartTotal = () => {
    let totalSubunits = 0n;
    cart.forEach((item) => {
      const itemSubunits = BigInt(item.priceSubunits) * BigInt(item.quantity);
      totalSubunits += itemSubunits;
    });
    return totalSubunits;
  };

  const totalSubunits = calculateCartTotal();
  const totalPiFormatted = formatSubunitsToPi(totalSubunits.toString());
  const totalMbzrFormatted = piToMbzr(totalPiFormatted);

  // Trigger on-chain escrow creation via the Sprint 1 RBAC endpoint
  const handleLockEscrow = async () => {
    if (cart.length === 0) return;
    setIsCreating(true);
    setEscrowResult(null);

    const storeMetadata = cart[0];

    try {
      const payload = {
        consumerUid: "usr_pioneer_1001", // Certified Genesis Pioneer UID
        providerId: storeMetadata.providerId,
        amount: parseFloat(totalPiFormatted),
        serviceDescription: `Purchase of ${cart.map((i) => `${i.quantity}x ${i.name}`).join(", ")} at ${storeMetadata.storeName}`,
        timelockHours: 48,
      };

      const response = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEscrowResult({
          success: true,
          escrowId: data.escrowId,
          status: data.status || "LOCKED",
          amount: data.amount,
          storeName: storeMetadata.storeName,
          timelockExpiresAt: new Date(data.timelockExpiresAt).toLocaleString(),
        });
        setCart([]);
        setActiveTab("catalog");
      } else {
        // Intercept RBAC clearance blocks (403 / 423)
        setEscrowResult({
          success: false,
          rbacBlocked: response.status === 403 || response.status === 423,
          error: data.error || "Route validation rejected transaction.",
          remedialUrl: data.remedialUrl || "/academy/module-01",
          storeName: storeMetadata.storeName,
          amount: parseFloat(totalPiFormatted),
        });
      }
    } catch (err: any) {
      setEscrowResult({
        success: false,
        error: err.message || "Failed to communicate with Next.js database API.",
        storeName: storeMetadata.storeName,
        amount: parseFloat(totalPiFormatted),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const activeCategory = catalog.categories.find((c: any) => c.id === selectedCategory);

  const filteredStalls = activeCategory?.stalls.filter((stall: any) => {
    const matchesSearch =
      stall.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stall.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStrategy = strategyFilter === "ALL" || stall.strategy === strategyFilter;
    return matchesSearch && matchesStrategy;
  }) || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto font-mono text-xs text-slate-100">
      
      {/* 🧭 Marketplace Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="text-emerald-500" size={18} />
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-100">
              E-Network Daily Marketplace
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-emerald-500 tracking-wider uppercase font-bold">
              Closed-Loop Sandbox Matrix Active (1:1,000 Peg)
            </p>
          </div>
        </div>

        {/* Tab Selector (Optimized for S23 Ultra mobile viewports) */}
        <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition ${
              activeTab === "catalog"
                ? "bg-indigo-950 border border-indigo-800 text-indigo-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Storefronts
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition flex items-center gap-1.5 ${
              activeTab === "cart"
                ? "bg-indigo-950 border border-indigo-800 text-indigo-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <ShoppingCart size={11} />
            Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </button>
        </div>
      </div>

      {/* ⚡ Core Screen Controller */}
      {activeTab === "catalog" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 min-h-112.5">
          
          {/* Left Panel: Category Filter */}
          <div className="p-3 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-900 md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal gap-2 md:space-y-1.5">
            <h3 className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">
              Categories
            </h3>
            {catalog.categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setStrategyFilter("ALL");
                }}
                className={`shrink-0 px-3 py-2 rounded-lg font-bold transition flex items-center justify-between gap-2 text-[10px] md:text-xs md:w-full md:text-left ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 border border-slate-800 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <span>{cat.name.split(" ")[0]}</span>
                <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                  {cat.stalls.length}
                </span>
              </button>
            ))}
          </div>

          {/* Right Panel: Stalls & Product Grid */}
          <div className="md:col-span-3 p-4 bg-slate-950/40 overflow-y-auto space-y-4">
            
            {/* Search and Strategy Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-2.5 top-2.5 text-slate-600" size={13} />
                <input
                  type="text"
                  placeholder="Search stalls or daily goods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="text-slate-500" size={12} />
                <select
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Strategies</option>
                  <option value="PREMIUM">Premium Class</option>
                  <option value="DISCOUNT">Discount Class</option>
                </select>
              </div>
            </div>

            {/* Escrow Feedback Modal Banner */}
            {escrowResult && (
              <div className={`p-3 rounded-xl border ${
                escrowResult.success 
                  ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                  : "bg-amber-950/20 border-amber-800 text-amber-300"
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {escrowResult.success ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <ShieldAlert size={14} className="text-amber-400" />
                  )}
                  <span className="font-bold text-[11px] uppercase tracking-wider">
                    {escrowResult.success 
                      ? "Escrow Contract Verified & Locked!" 
                      : escrowResult.rbacBlocked 
                        ? "Cryptographic Access Gate Intercept" 
                        : "Escrow Submission Error"}
                  </span>
                </div>
                <div className="space-y-1 text-[10px] font-mono leading-relaxed">
                  {escrowResult.success ? (
                    <>
                      <p>• <strong>Escrow Target:</strong> {escrowResult.storeName} ({escrowResult.amount} PI Locked)</p>
                      <p>• <strong>State:</strong> <span className="bg-slate-950 px-1 rounded text-indigo-400 font-bold">{escrowResult.status}</span></p>
                      <p>• <strong>Escrow ID:</strong> <span className="text-slate-100">{escrowResult.escrowId}</span></p>
                      <p>• <strong>Timelock Window:</strong> {escrowResult.timelockExpiresAt}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-amber-200">❌ {escrowResult.error}</p>
                      {escrowResult.rbacBlocked && (
                        <div className="mt-2 pt-2 border-t border-amber-900/50 flex flex-col gap-2">
                          <p className="text-[9px] text-zinc-400">
                            Clearance required: You must complete Module 01 in the MESH Academy before locking contracts.
                          </p>
                          <Link
                            href={escrowResult.remedialUrl}
                            className="py-1.5 px-2.5 bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 rounded-lg text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1.5"
                          >
                            <Terminal size={12} />
                            <span>Begin Academy Module 01</span>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stalls Loop */}
            {filteredStalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900/30 border border-slate-900 rounded-xl text-slate-500">
                <Info size={16} className="mb-1 text-slate-600" />
                <p>No competing stalls match your query filters.</p>
              </div>
            ) : (
              filteredStalls.map((stall: any) => (
                <div key={stall.businessName} className="p-4 bg-slate-900/60 border border-slate-900 rounded-xl space-y-3">
                  
                  {/* Stall metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-800 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm">{stall.businessName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          stall.strategy === "PREMIUM" 
                            ? "bg-purple-950/80 border border-purple-800 text-purple-300" 
                            : "bg-blue-950/80 border border-blue-800 text-blue-300"
                        }`}>
                          {stall.strategy}
                        </span>
                        <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <MapPin size={10} className="text-rose-500" />
                          {stall.sectorLocation}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1 hidden sm:block">{stall.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex items-center text-amber-400 gap-0.5 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-lg">
                        <Star size={10} fill="currentColor" />
                        <span className="font-bold text-[10px]">{stall.rating}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block">BASE FEE</span>
                        <span className="font-bold text-slate-200 font-mono">{stall.baseFeePi} PI</span>
                      </div>
                    </div>
                  </div>

                  {/* Stall Inventory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stall.inventory.map((item: any) => (
                      <div key={item.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between gap-2 hover:border-slate-700 transition">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-200 block text-[11px]">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{item.description}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-emerald-400 font-bold">{item.pricePi} PI</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-500 text-[10px]">{piToMbzr(item.pricePi.toString())}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(item, stall)}
                          className="self-end p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-lg transition"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}

          </div>

        </div>
      ) : (
        /* 🛒 Shopping Cart & Escrow Lock Screen */
        <div className="p-4 bg-slate-950 grow space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
            Handshake Escrow Cart
          </h3>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 border border-slate-900 rounded-2xl text-slate-500">
              <ShoppingBag size={24} className="mb-2 text-slate-700 animate-bounce" />
              <p className="text-[11px] uppercase tracking-wider font-bold">Your Escrow Cart is Empty</p>
              <p className="text-[10px] text-slate-600 mt-1">Go back to the storefronts and add daily market products.</p>
              <button
                onClick={() => setActiveTab("catalog")}
                className="mt-4 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold rounded-xl transition"
              >
                Return to Directory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Cart List */}
              <div className="md:col-span-2 space-y-2">
                <div className="p-2.5 bg-slate-900/50 border border-slate-900 rounded-lg text-slate-400 flex items-center gap-2">
                  <Info size={12} className="text-indigo-400" />
                  <span>Provider: <strong>{cart[0].storeName}</strong> ({cart[0].providerUid})</span>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-900 border border-slate-900 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold font-mono">{item.pricePi} PI each</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-500 text-[10px]">{piToMbzr(item.pricePi.toString())}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg font-mono">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 font-bold text-slate-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <button
                        onClick={() => updateQuantity(item.id, -item.quantity)}
                        className="p-1.5 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/50 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Escrow Lock Panel */}
              <div className="p-4 bg-slate-900 border border-slate-900 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">
                    Order Summary
                  </h4>

                  <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Items:</span>
                      <span className="text-slate-300 font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Escrow Total (PI):</span>
                      <span className="text-emerald-400 font-bold">{totalPiFormatted} PI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Convert Fuel (mBZR):</span>
                      <span className="text-indigo-400 font-bold">{totalMbzrFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Precision Subunits:</span>
                      <span className="text-slate-400 font-bold truncate max-w-30">{totalSubunits.toString()}n</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-950/20 border border-purple-900/50 text-[10px] leading-relaxed text-purple-300 rounded-lg flex gap-1.5">
                    <ShieldCheck size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>1:1,000 Peg Enforced:</strong> Values represent strict off-chain mBZR matching L1 locked reserves[cite: 3].</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleLockEscrow}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold rounded-xl text-white uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-cyan-300" />
                        <span>Verifying RBAC & Locking...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} />
                        <span>Deposit & Lock Escrow</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your cart?")) setCart([]);
                    }}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-xl transition text-center font-bold"
                  >
                    Clear Cart
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* 🏛️ Footer branding */}
      <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-slate-600 text-[10px] font-mono">
        © BAZAAR REPUBLIC • IN CODE WE TRUST • STAGE-ONE SANDBOX TESTNET
      </div>

    </div>
  );
}