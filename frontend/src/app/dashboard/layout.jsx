"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { SessionContext } from "@/components/dashboard/SessionContext";
import { endSession, loadSession } from "@/lib/session";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);

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
        <main className="dashboard__main">{children}</main>
      </div>
    </SessionContext.Provider>
  );
}
