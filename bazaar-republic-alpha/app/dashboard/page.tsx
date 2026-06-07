// app/dashboard/page.tsx
import CitizenDashboard from "@/app/components/CitizenDashboard";

// 🛡️ MESH PROTOCOL: Lockdown to Dynamic Execution
// This forces Next.js to bypass static generation for the dashboard.
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <CitizenDashboard />;
}