import { db, type OutboxRecord } from "../db/dexie";
import { generateUUID } from "../utils";

export type SyncState = "ONLINE" | "OFFLINE" | "SYNCING";

type SyncListener = (state: {
  status: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
}) => void;

class OutboxSyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private lastSyncedAt: Date | null = null;
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));

      // Periodic sync loop every 10 seconds if online
      setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncOutbox();
        }
      }, 10000);
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notify() {
    let pendingCount = 0;
    try {
      pendingCount = await db.outbox.where("status").equals("PENDING").count();
    } catch {
      // IndexedDB might not be open yet
    }

    const status: SyncState = !this.isOnline
      ? "OFFLINE"
      : this.isSyncing
      ? "SYNCING"
      : "ONLINE";

    this.listeners.forEach((fn) =>
      fn({
        status,
        pendingCount,
        lastSyncedAt: this.lastSyncedAt,
      })
    );
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.syncOutbox();
    }
  }

  /**
   * Enqueue an event to the local outbox and attempt immediate push if online
   */
  public async enqueue(eventType: OutboxRecord["event_type"], payload: any): Promise<string> {
    const record: OutboxRecord = {
      id: generateUUID(),
      event_type: eventType,
      payload,
      retry_count: 0,
      created_at: new Date().toISOString(),
      status: "PENDING",
    };

    await db.outbox.add(record);
    this.notify();

    if (this.isOnline && !this.isSyncing) {
      this.syncOutbox();
    }

    return record.id;
  }

  /**
   * Attempt to push pending records to the server API
   */
  public async syncOutbox(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      const pendingRecords = await db.outbox
        .where("status")
        .equals("PENDING")
        .limit(20)
        .toArray();

      if (pendingRecords.length === 0) {
        this.isSyncing = false;
        this.lastSyncedAt = new Date();
        this.notify();
        return { synced: 0, failed: 0 };
      }

      for (const record of pendingRecords) {
        try {
          // Send to the server API push endpoint
          const res = await fetch("/api/sync/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
          });

          if (res.ok) {
            await db.outbox.update(record.id, {
              status: "SYNCED",
            });
            synced++;
          } else {
            const errJson = await res.json().catch(() => ({}));
            await db.outbox.update(record.id, {
              retry_count: record.retry_count + 1,
              error_message: errJson.message || "Sync failed",
            });
            failed++;
          }
        } catch {
          // Network dropped mid-sync or API unavailable
          await db.outbox.update(record.id, {
            retry_count: record.retry_count + 1,
          });
          failed++;
          break; // Stop batch until next interval
        }
      }

      this.lastSyncedAt = new Date();
    } catch (err) {
      console.error("Outbox sync loop failed:", err);
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { synced, failed };
  }

  public async getPendingRecords(): Promise<OutboxRecord[]> {
    return db.outbox.toArray();
  }

  public async clearSynced(): Promise<void> {
    await db.outbox.where("status").equals("SYNCED").delete();
    this.notify();
  }
}

export const syncEngine = new OutboxSyncEngine();
