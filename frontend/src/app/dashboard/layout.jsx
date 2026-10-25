"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import UserAvatar from "@/components/dashboard/UserAvatar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { SessionContext } from "@/components/dashboard/SessionContext";
import ConsentPrompt from "@/components/zeroid/ConsentPrompt";
import usePendingRequest from "@/components/zeroid/usePendingRequest";
import { endSession, loadSession } from "@/lib/session";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [request, answer] = usePendingRequest();
  const wide = pathname.startsWith("/dashboard/analytics");

  useEffect(() => {
    const current = loadSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
  }, [router]);

  function logout() {
    endSession();
    router.replace("/login");
  }

  if (!session) return null;

  return (
    <SessionContext.Provider value={session}>
      <div className="dashboard">
        <Sidebar session={session} onLogout={logout} />
        <div className="dashboard__shell">
          <header className="dashboard-topbar">
            <ThemeSwitcher />
            <UserAvatar />
          </header>
          <main className={`dashboard__main${wide ? " dashboard__main--wide" : ""}`}>{children}</main>
        </div>
        {request && !session.guest && (
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__card">
              <ConsentPrompt key={request.id} request={request} onRespond={answer} />
            </div>
          </div>
        )}
      </div>
    </SessionContext.Provider>
  );
}
