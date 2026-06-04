// 🛡️ MESH PROTOCOL: Lockdown to Dynamic Execution
// This forces Next.js to bypass static generation for the dashboard.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import CitizenDashboard from "@/app/components/CitizenDashboard";

export default function DashboardPage() {
  return <CitizenDashboard />;
}