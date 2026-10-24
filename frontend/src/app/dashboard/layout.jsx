"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import ConsentPrompt from "@/components/zeroid/ConsentPrompt";
import usePendingRequest from "@/components/zeroid/usePendingRequest";
import { endSession, loadSession } from "@/lib/session";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [request, answer] = usePendingRequest();

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
      {request && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__card">
            <ConsentPrompt key={request.id} request={request} onRespond={answer} />
          </div>
        </div>
      )}
    </div>
  );
}
