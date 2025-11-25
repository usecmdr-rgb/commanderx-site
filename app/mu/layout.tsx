import DashboardLayout from "@/components/app/DashboardLayout";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout activeAgent="studio">{children}</DashboardLayout>;
}

