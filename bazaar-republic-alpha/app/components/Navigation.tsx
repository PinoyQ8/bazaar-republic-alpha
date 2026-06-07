// components/Navigation.tsx
import Link from "next/link";

const navGroups = [
  { 
    title: "ACADEMY", 
    links: [{n: "Vault", p: "/academy/vault"}, {n: "Protocol Forge", p: "/academy/protocol-forge"}, {n: "Security", p: "/academy/security"}] 
  },
  { 
    title: "GOVERNANCE", 
    links: [{n: "Dashboard", p: "/dashboard"}, {n: "Security Circle", p: "/governance/security-circle"}, {n: "Treasury", p: "/treasury"}] 
  },
  { 
    title: "E-NETWORK", 
    links: [{n: "Dashboard", p: "/enetwork/dashboard"}, {n: "Adjudicator", p: "/enetwork/adjudicator"}, {n: "Register", p: "/enetwork/register"}] 
  }
];

export default function PioneerNav() {
  return (
    <div className="bg-slate-950 p-6 border-b border-emerald-900 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-8">
      {navGroups.map((group, index) => (
        <div 
          key={group.title}
          // Forces E-NETWORK to cleanly wrap below the first two columns on the S23
          className={index === 2 ? "col-span-2 md:col-span-1 mt-2 md:mt-0" : ""}
        >
          <h3 className="text-emerald-500 font-bold text-[10px] tracking-[0.2em] mb-3">
            {group.title}
          </h3>
          {group.links.map((link) => (
            <Link 
              key={link.p} 
              href={link.p} 
              className="block text-[11px] text-slate-400 hover:text-emerald-400 py-1 transition-colors"
            >
              {link.n}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}