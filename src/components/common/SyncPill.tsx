"use client";

import React, { useEffect, useState } from "react";
import { syncEngine, type SyncState } from "@/lib/sync/outbox";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function SyncPill() {
  const [syncState, setSyncState] = useState<{
    status: SyncState;
    pendingCount: number;
    lastSyncedAt: Date | null;
  }>({
    status: "ONLINE",
    pendingCount: 0,
    lastSyncedAt: null,
  });

  useEffect(() => {
    return syncEngine.subscribe(setSyncState);
  }, []);

  const handleManualSync = async () => {
    await syncEngine.syncOutbox();
  };

  if (syncState.status === "OFFLINE") {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors shadow-sm"
        title="Offline. Changes saved locally to IndexedDB."
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>
          Offline {syncState.pendingCount > 0 ? `· ${syncState.pendingCount} waiting` : ""}
        </span>
      </button>
    );
  }

  if (syncState.status === "SYNCING") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-xs font-medium animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
        <span>Syncing…</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-light dark:bg-emerald-950 text-sage-dark dark:text-emerald-300 border border-sage/40 text-xs font-medium hover:bg-sage/20 transition-colors"
      title="All orders synced"
    >
      <span className="w-2 h-2 rounded-full bg-sage animate-ping opacity-75" />
      <Wifi className="w-3.5 h-3.5 text-sage" />
      <span>Online</span>
    </button>
  );
}
