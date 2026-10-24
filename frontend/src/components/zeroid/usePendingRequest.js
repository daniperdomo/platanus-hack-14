"use client";

import { useEffect, useState } from "react";
import { loadPendingRequest, respond, subscribe } from "@/lib/zeroidConnect";

export default function usePendingRequest() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    setRequest(loadPendingRequest());
    return subscribe((message) => {
      if (message.type === "request") setRequest(message.request);
      if (message.type === "resolved") {
        setRequest((current) => (current?.id === message.id ? null : current));
      }
    });
  }, []);

  function answer(response) {
    respond(request, response);
    setRequest(null);
  }

  return [request, answer];
}
