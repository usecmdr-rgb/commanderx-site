import DashboardLayout from "@/components/app/DashboardLayout";

export default function AlphaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout activeAgent="aloha">{children}</DashboardLayout>;
}




