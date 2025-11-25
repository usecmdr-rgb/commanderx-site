import DashboardLayout from "@/components/app/DashboardLayout";

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout activeAgent="insight">{children}</DashboardLayout>;
}

