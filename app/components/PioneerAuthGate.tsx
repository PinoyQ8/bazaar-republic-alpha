"use client";

import { ReactNode, useEffect, useState } from "react";

export default function PioneerAuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Automatically inject active session and bypass infinite spin
    localStorage.setItem("mesh_pioneer_active", "true");
    localStorage.setItem("mesh_pioneer_id", "PinoyQ8_Dev");
    localStorage.setItem("mesh_pioneer_uid", "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3");
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
