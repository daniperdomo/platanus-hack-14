"use client";

import { useEffect, useState } from "react";
import { activity, connections } from "@/lib/mockData";
import {
  loadStoredActivity,
  loadStoredConnections,
  subscribe,
} from "@/lib/zeroidConnect";

function merge(stored, mock) {
  const ids = new Set(stored.map((item) => item.id));
  return [...stored, ...mock.filter((item) => !ids.has(item.id))];
}

function load() {
  return {
    connections: merge(loadStoredConnections(), connections),
    activity: merge(loadStoredActivity(), activity),
  };
}

export default function useVault() {
  const [vault, setVault] = useState({ connections, activity });

  useEffect(() => {
    setVault(load());
    return subscribe((message) => {
      if (message.type === "response") setVault(load());
    });
  }, []);

  return vault;
}
