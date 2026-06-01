import CitizenDashboard from "@/app/components/CitizenDashboard";

export default function DashboardPage() {
  // MESH-LOCK: All perimeter rendering is handled by layout.tsx.
  // All state logic and loading is handled by CitizenDashboard.tsx.
  return <CitizenDashboard />;
}