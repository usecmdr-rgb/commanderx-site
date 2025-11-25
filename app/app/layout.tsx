import DashboardLayout from "@/components/app/DashboardLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout activeAgent={null}>{children}</DashboardLayout>;
}
