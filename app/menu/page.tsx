"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import MenuConsole from "@/components/MenuConsole";
import FounderAccountSettingsCard from "@/components/founder/FounderAccountSettingsCard";

export default function MenuPage() {
  const { pioneer, isFounder } = useAuth();

  const showFounderSettings =
    Boolean(isFounder) ||
    String(pioneer?.tier || "").toUpperCase() === "BAZAAR_FOUNDER" ||
    String(pioneer?.role || "").toUpperCase().includes("FOUNDER");

  return (
    <main className="w-full max-w-[384px] mx-auto pb-24 space-y-4">
      <MenuConsole />
      {showFounderSettings && <FounderAccountSettingsCard />}
    </main>
  );
}
