"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalKDSTicket } from "@/lib/db/dexie";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Coffee,
  Sparkles,
  Volume2,
  AlertCircle,
  ArrowRight,
  Flame,
} from "lucide-react";

interface KdsViewProps {
  station: "BAR" | "KITCHEN";
}

export function KdsView({ station }: KdsViewProps) {
  const [tickets, setTickets] = useState<LocalKDSTicket[]>([]);
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);
  const [now, setNow] = useState(Date.now());

  // Periodically refresh current time to update wait timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const loadTickets = async () => {
    const all = await db.kdsTickets
      .where("station_type")
      .equals(station)
      .toArray();

    // Filter out served tickets, sort oldest first
    const active = all
      .filter((t) => t.status !== "SERVED")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setTickets(active);
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 3000);
    return () => clearInterval(interval);
  }, [station]);

  const handleUpdateStatus = async (ticket: LocalKDSTicket) => {
    playSound("click");
    const nextStatus =
      ticket.status === "PENDING"
        ? "PREPARING"
        : ticket.status === "PREPARING"
        ? "READY"
        : "SERVED";

    await db.kdsTickets.update(ticket.id, {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    });

    if (nextStatus === "READY") {
      playSound("chime");
    }

    await loadTickets();
  };

  const getAgeMinutes = (createdAt: string) => {
    const elapsed = Math.floor((now - new Date(createdAt).getTime()) / 60000);
    return Math.max(0, elapsed);
  };

  const getWaitColor = (minutes: number) => {
    if (minutes < 5) return "bg-sage-light text-sage-dark border-sage/40";
    if (minutes < 10) return "bg-amber-100 text-amber-900 border-amber-300";
    return "bg-brick-light text-brick border-brick/40 animate-pulse";
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Station Title & Summary Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-vintage-orange text-white flex items-center justify-center shadow-card">
            {station === "BAR" ? <Coffee className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-serif font-black text-xl text-espresso-900 dark:text-cream-100">
              {station === "BAR" ? "Barista Espresso Station" : "Kitchen & Food Station"}
            </h2>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
              {tickets.length} active orders in queue · FIFO wait priority
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-xl bg-sage-light text-sage-dark border border-sage/40">
            &lt; 5m Normal
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
            5-10m Warning
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-brick-light text-brick border border-brick/40">
            &gt; 10m Delayed
          </span>
        </div>
      </div>

      {/* Tickets Grid */}
      {tickets.length === 0 ? (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-cream-50 dark:bg-espresso-900/40 rounded-café border border-dashed border-cream-300 dark:border-espresso-700">
          <div className="w-16 h-16 rounded-3xl bg-sage-light text-sage flex items-center justify-center mb-3 shadow-card">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="font-serif font-bold text-lg text-espresso-900 dark:text-cream-100 mb-1">
            {t("noTickets")}
          </h3>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 max-w-xs">
            New orders rung up at the cash register will automatically chime and appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tickets.map((ticket) => {
            const ageMins = getAgeMinutes(ticket.created_at);
            const colorClass = getWaitColor(ageMins);

            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between overflow-hidden animate-drop-in"
              >
                {/* Ticket Header */}
                <div className={`p-3.5 border-b flex items-center justify-between ${colorClass}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-lg">
                      #{ticket.order_number}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-espresso-900/60 backdrop-blur-sm">
                      {ticket.table_label || ticket.order_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ageMins}m</span>
                  </div>
                </div>

                {/* Items in ticket */}
                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-60">
                  {ticket.items.map((line, idx) => (
                    <div
                      key={idx}
                      className="border-b border-cream-100 dark:border-espresso-700 pb-2 last:border-none"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-sm text-espresso-900 dark:text-cream-100 leading-tight">
                          <span className="text-vintage-orange mr-1 font-black">
                            {line.quantity}x
                          </span>
                          {line.item_name}
                        </span>
                      </div>

                      {line.variant_name && (
                        <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 pl-4 mt-0.5">
                          • {line.variant_name}
                        </p>
                      )}

                      {line.modifiers && line.modifiers.length > 0 && (
                        <p className="text-[11px] text-espresso-700/80 dark:text-cream-300/80 pl-4 mt-0.5 font-medium">
                          + {line.modifiers.join(", ")}
                        </p>
                      )}

                      {line.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 pl-4 mt-0.5 font-bold italic">
                          ⚠️ {line.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Advancement Action Button (>= 48px tap target) */}
                <div className="p-3 border-t border-cream-200 dark:border-espresso-700 bg-cream-50/70 dark:bg-espresso-900/50">
                  <button
                    onClick={() => handleUpdateStatus(ticket)}
                    className={`w-full h-12 rounded-2xl text-xs font-bold font-serif flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                      ticket.status === "PENDING"
                        ? "bg-vintage-orange hover:bg-vintage-orange-hover text-white"
                        : ticket.status === "PREPARING"
                        ? "bg-sage hover:bg-sage-dark text-white"
                        : "bg-espresso-800 text-white"
                    }`}
                  >
                    {ticket.status === "PENDING" && (
                      <>
                        <Flame className="w-4 h-4" />
                        <span>Start Preparing</span>
                      </>
                    )}
                    {ticket.status === "PREPARING" && (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Mark Ready</span>
                      </>
                    )}
                    {ticket.status === "READY" && (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Bump & Serve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
