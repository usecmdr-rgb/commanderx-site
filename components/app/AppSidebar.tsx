"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AGENTS } from "@/lib/config/agents";

const AppSidebar = () => {
  const pathname = usePathname();
  const t = useTranslation();

  // Ensure all agents are included
  const agentLinks = AGENTS.map((agent) => ({
    href: agent.route,
    label: agent.label,
    icon: agent.icon,
    isLarge: false,
    agentKey: agent.id,
  }));

  // Always include all agents and dashboard - ensure all links are visible
  // Layout: [Aloha, Studio, Dashboard (large), Sync, Insight]
  const allLinks = [
    ...agentLinks.slice(0, 2), // First two agents (aloha, studio)
    { href: "/app", label: t("navDashboard"), icon: LayoutDashboard, isLarge: true, agentKey: null },
    ...agentLinks.slice(2), // Remaining agents (sync, insight)
  ];

  // Debug: Log to ensure all links are present (remove in production if needed)
  if (process.env.NODE_ENV === "development" && allLinks.length !== 5) {
    console.warn("AppSidebar: Expected 5 links (4 agents + dashboard), got", allLinks.length);
  }

  const LinkItem = ({ href, label, icon: Icon, isLarge = false, agentKey }: { href: string; label: string; icon: any; isLarge?: boolean; agentKey: string | null }) => {
    // Check if pathname matches the href exactly, or starts with the agent route
    // Handles sub-pages like /studio/edit
    let isActive = false;
    if (agentKey) {
      // For agents, check if pathname starts with /agentKey
      isActive = pathname === href || pathname.startsWith(`${href}/`);
    } else {
      // For dashboard, check exact match or /dashboard or /app
      isActive = pathname === href || pathname === "/dashboard" || pathname === "/app" || pathname.startsWith("/app/");
    }
    const active = isActive;
    const isAgent = agentKey !== null;
    
    return (
      <Link
        href={href as any}
        className={`flex items-center justify-center space-x-3 rounded-2xl font-semibold transition ${
          isLarge ? "px-8 py-5 text-lg" : "px-6 py-4 text-base"
        } ${
          active && isAgent
            ? "border-2 bg-transparent border-slate-900 dark:border-white text-slate-900 dark:text-white"
            : active
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        <Icon size={isLarge ? 26 : 22} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <nav className="flex items-center justify-evenly flex-wrap gap-3" role="navigation" aria-label="Agent navigation">
        {allLinks.map(({ href, label, icon, isLarge, agentKey }) => (
          <LinkItem 
            key={`${href}-${agentKey || 'dashboard'}`} 
            href={href} 
            label={label} 
            icon={icon} 
            isLarge={isLarge} 
            agentKey={agentKey} 
          />
        ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;
