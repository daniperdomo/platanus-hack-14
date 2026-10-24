"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
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
    <div className="dashboard">
      <Sidebar email={session.email} onLogout={logout} />
      <main className="dashboard__main">{children}</main>
    </div>
  );
}
