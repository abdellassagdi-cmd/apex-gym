import type { ComponentType, ReactNode } from "react";
import {
  BadgeDollarSign,
  BellRing,
  BookOpen,
  ClipboardList,
  CreditCard,
  Download,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  UserRoundCheck,
  X,
} from "lucide-react";

import type { NavKey } from "../types";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

const navItems: Array<{ id: NavKey; label: string; icon: Icon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: BadgeDollarSign },
  { id: "coach_requests", label: "Coach Requests", icon: BellRing },
  { id: "coaches", label: "Coaches", icon: UserRoundCheck },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "exercises", label: "Exercises", icon: Dumbbell },
  { id: "programs", label: "Programs", icon: ClipboardList },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppShell({
  activeNav,
  children,
  mobileNavOpen,
  onCloseMobileNav,
  onOpenMobileNav,
  onSelectNav,
  onSignOut,
  role,
  waitingCoachCount,
}: {
  activeNav: NavKey;
  children: ReactNode;
  mobileNavOpen: boolean;
  onCloseMobileNav: () => void;
  onOpenMobileNav: () => void;
  onSelectNav: (nav: NavKey) => void;
  onSignOut: () => void;
  role: string;
  waitingCoachCount: number;
}) {
  const activeLabel = navItems.find((item) => item.id === activeNav)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className={mobileNavOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand-row">
          <div className="brand-mark">A</div>
          <div>
            <strong>Apex Admin</strong>
            <span>Operations console</span>
          </div>
          <button className="icon-button mobile-only" onClick={onCloseMobileNav} title="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeNav === item.id ? "nav-item nav-item-active" : "nav-item"}
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                  onCloseMobileNav();
                }}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
                {item.id === "coach_requests" && waitingCoachCount > 0 ? (
                  <span className="nav-count-badge">{waitingCoachCount}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="owner-chip">
            <ShieldCheck size={17} />
            <div>
              <strong>{role}</strong>
              <span>oulbachir2019</span>
            </div>
          </div>
          <button className="nav-item" onClick={onSignOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen ? <button className="nav-scrim" onClick={onCloseMobileNav} aria-label="Close navigation" /> : null}

      <main className="main-area">
        <header className="topbar">
          <div className="title-cluster">
            <button className="icon-button mobile-only" onClick={onOpenMobileNav} title="Open navigation">
              <Menu size={19} />
            </button>
            <div>
              <h1>{activeLabel}</h1>
              <p>Manage access, billing, coaches, and content.</p>
            </div>
          </div>
          <div className="topbar-actions">
            <label className="range-picker">
              <select defaultValue="30" aria-label="Range">
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">This year</option>
              </select>
            </label>
            <button className="button button-secondary topbar-button" title="Export">
              <Download size={16} />
              <span>Export</span>
            </button>
            <button className="icon-button" title="Documentation">
              <BookOpen size={18} />
            </button>
          </div>
        </header>
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
