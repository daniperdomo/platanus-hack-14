"use client";

import { useEffect, useState } from "react";
import { activity, connections, devices, profile, storedData } from "@/lib/mockData";
import {
  loadStoredActivity,
  loadStoredConnections,
  subscribe,
} from "@/lib/zeroidConnect";
import { useSession } from "./SessionContext";

const GUEST_VAULT = {
  profile: null,
  storedData: [],
  devices: [],
  connections: [],
  activity: [],
};

function merge(stored, mock) {
  const ids = new Set(stored.map((item) => item.id));
  return [...stored, ...mock.filter((item) => !ids.has(item.id))];
}

function load() {
  return {
    profile,
    storedData,
    devices,
    connections: merge(loadStoredConnections(), connections),
    activity: merge(loadStoredActivity(), activity),
  };
}

export default function useVault() {
  const guest = useSession()?.guest ?? false;
  const [vault, setVault] = useState({ profile, storedData, devices, connections, activity });

  useEffect(() => {
    if (guest) return;
    setVault(load());
    return subscribe((message) => {
      if (message.type === "response") setVault(load());
    });
  }, [guest]);

  return guest ? GUEST_VAULT : vault;
}
