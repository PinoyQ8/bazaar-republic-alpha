// components/security/SecurityNotice.tsx
export default function SecurityNotice() {
  return (
    <div className="border border-amber-900 bg-black p-4 text-[10px] font-mono text-amber-500 rounded-sm">
      <h3 className="font-bold uppercase tracking-widest text-amber-300">🛡️ BAZAAR MESH SECURITY NOTICE</h3>
      <ul className="mt-2 space-y-1">
        <li>1. 🌐 <strong>URL VERIFICATION:</strong> Only transact on mesh-academy-alpha.vercel.app.</li>
        <li>2. 🔑 <strong>KEY SOVEREIGNTY:</strong> The Bazaar Republic will NEVER ask for your Private Key/Passphrase.</li>
        <li>3. 🛑 <strong>PROTOCOL ISOLATION:</strong> If a node asks for external wallet permissions, disconnect immediately.</li>
      </ul>
      <button className="mt-4 w-full bg-amber-900 text-white p-2 hover:bg-amber-800">
        I UNDERSTAND THE MESH PROTOCOL
      </button>
    </div>
  );
}