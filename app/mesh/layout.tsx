import React from 'react';

export default function MeshLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {children}
    </div>
  );
}