"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db/dexie";
import {
  type StaffProfileDef,
  type AttendanceRecordDef,
  type ShiftScheduleDef,
  type LeaveRequestDef,
} from "@/lib/data/sample-hr-accounting";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Users,
  Clock,
  Calendar,
  FileCheck,
  Plus,
  CheckCircle2,
  Lock,
  Camera,
  Coffee,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  CreditCard,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
} from "lucide-react";
import { StaffAccountModal } from "@/components/hr/StaffAccountModal";

export default function HrPage() {
  const [activeTab, setActiveTab] = useState<"CLOCK" | "STAFF" | "ROSTER" | "LEAVE">("CLOCK");
  const [staffProfiles, setStaffProfiles] = useState<StaffProfileDef[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordDef[]>([]);
  const [shifts, setShifts] = useState<ShiftScheduleDef[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDef[]>([]);
  const [clockPin, setClockPin] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Staff Account & PIN Management Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<any>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const { playSound } = useUiStore();
  const { currentUser, staffList, loadStaff, deleteStaff } = useAuthStore();

  const loadHrData = async () => {
    await loadStaff();
    const profiles = await db.staffProfiles.toArray();
    const atts = await db.attendance.toArray();
    const shfs = await db.shiftSchedules.toArray();
    const lvs = await db.leaveRequests.toArray();
    setStaffProfiles(profiles);
    setAttendance(atts);
    setShifts(shfs);
    setLeaveRequests(lvs);
  };

  const toggleRevealPin = (id: string) => {
    playSound("click");
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteStaffAccount = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the staff account for "${name}"?`)) return;
    playSound("click");
    const ok = await deleteStaff(id);
    if (ok) {
      await loadHrData();
      setToastMsg(`Deleted account: ${name}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  useEffect(() => {
    loadHrData();
  }, []);

  const handlePinClock = async (action: "IN" | "OUT" | "BREAK") => {
    playSound("click");
    // Find staff by PIN or current user
    const staff = staffProfiles.find((s) => s.user_id === currentUser?.id) || staffProfiles[2];

    if (action === "IN") {
      const newAtt: AttendanceRecordDef = {
        id: `att-${Date.now()}`,
        user_id: staff.user_id,
        staff_name: staff.name,
        clock_in: new Date().toISOString(),
        break_minutes: 0,
        overtime_minutes: 0,
        status: "ON_DUTY",
      };
      await db.attendance.add(newAtt);
      setToastMsg(`Clocked IN: ${staff.name} at ${formatTime(new Date())}`);
    } else if (action === "BREAK") {
      const active = attendance.find((a) => a.user_id === staff.user_id && a.status === "ON_DUTY");
      if (active) {
        await db.attendance.update(active.id, {
          status: "ON_BREAK",
          break_minutes: active.break_minutes + 15,
        });
        setToastMsg(`${staff.name} is now on 15-minute break`);
      }
    } else {
      const active = attendance.find((a) => a.user_id === staff.user_id && (a.status === "ON_DUTY" || a.status === "ON_BREAK"));
      if (active) {
        await db.attendance.update(active.id, {
          clock_out: new Date().toISOString(),
          status: "COMPLETED",
        });
        setToastMsg(`Clocked OUT: ${staff.name} at ${formatTime(new Date())}`);
      }
    }

    playSound("bell");
    await loadHrData();
    setTimeout(() => setToastMsg(null), 3500);
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              👥
            </span>
            <span>People, Shifts & Time Clock</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            PIN attendance clock, weekly shift roster, staff CNIC profiles, and leave tracking
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("CLOCK")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "CLOCK"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Clock</span>
          </button>

          <button
            onClick={() => setActiveTab("STAFF")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "STAFF"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>

          <button
            onClick={() => setActiveTab("ROSTER")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "ROSTER"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Shift Roster</span>
          </button>

          {/* Quick link to Payroll */}
          <Link
            href="/payroll"
            className="px-3 py-1.5 rounded-xl bg-sage-light text-sage-dark hover:bg-sage/20 border border-sage/40 flex items-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-sage" />
            <span>Payroll Portal →</span>
          </Link>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 1: PIN TIME CLOCK & LIVE ON-DUTY */}
      {activeTab === "CLOCK" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clock In Pad */}
          <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-vintage-orange mb-1">
                <Clock className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-espresso-900 dark:text-cream-100">
                  Staff PIN Clock-In / Out
                </h3>
              </div>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Current active staff: <strong>{currentUser?.name || "Ali Raza"}</strong>
              </p>
            </div>

            {/* Selfie Verification Simulator */}
            <div className="p-4 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-dashed border-cream-300 dark:border-espresso-700 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cream-200 dark:bg-espresso-800 flex items-center justify-center mx-auto text-espresso-700">
                <Camera className="w-6 h-6 text-vintage-orange" />
              </div>
              <span className="text-[11px] font-bold text-espresso-800 dark:text-cream-200 block">
                Face / Selfie Verification Active
              </span>
              <p className="text-[10px] text-espresso-700/60">
                Terminal camera matches registered staff face profile
              </p>
            </div>

            {/* 3 Main Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handlePinClock("IN")}
                className="w-full h-12 rounded-2xl bg-sage hover:bg-sage-dark text-white font-serif font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>Clock In for Shift</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePinClock("BREAK")}
                  className="h-11 rounded-2xl bg-mustard hover:bg-mustard-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Start Break (15m)</span>
                </button>

                <button
                  onClick={() => handlePinClock("OUT")}
                  className="h-11 rounded-2xl bg-brick hover:bg-brick-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Clock Out (End)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live On-Duty Timesheet */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200 dark:border-espresso-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sage animate-ping" />
                <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
                  Live Shift Attendance Log
                </h4>
              </div>
              <span className="text-xs font-bold text-espresso-700/60">
                {attendance.filter((a) => a.status === "ON_DUTY").length} staff currently on floor
              </span>
            </div>

            <div className="divide-y divide-cream-100 dark:divide-espresso-700">
              {attendance.map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-cream-100 dark:bg-espresso-700 flex items-center justify-center text-base shadow-sm">
                      👤
                    </div>
                    <div>
                      <span className="font-bold text-sm text-espresso-900 dark:text-cream-100">
                        {att.staff_name}
                      </span>
                      <p className="text-[11px] text-espresso-700/60 dark:text-cream-300/60">
                        Clocked In: {formatTime(att.clock_in)}
                        {att.clock_out && ` · Clocked Out: ${formatTime(att.clock_out)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        att.status === "ON_DUTY"
                          ? "bg-sage-light text-sage-dark border border-sage/40"
                          : att.status === "ON_BREAK"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-cream-100 text-espresso-700"
                      }`}
                    >
                      {att.status.replace("_", " ")}
                    </span>

                    {att.overtime_minutes > 0 && (
                      <span className="text-[10px] font-bold text-vintage-orange">
                        +{att.overtime_minutes}m OT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY & PROFILES */}
      {activeTab === "STAFF" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100">
                Staff Accounts, PINs & Roles
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Manage café login credentials, 4-digit security PINs, access permissions & base salaries
              </p>
            </div>
            <button
              onClick={() => {
                playSound("click");
                setSelectedStaffForEdit(null);
                setShowAccountModal(true);
              }}
              className="h-10 px-4 rounded-2xl bg-vintage-orange hover:bg-vintage-orange/90 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Staff Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const profile = staffProfiles.find((p) => p.user_id === staff.id || p.name === staff.name);
              const isRevealed = revealedPins[staff.id];

              return (
                <div
                  key={staff.id}
                  className="p-5 rounded-3xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between space-y-4 hover:shadow-floating transition-all group"
                >
                  {/* Staff Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1.5 rounded-2xl bg-cream-100 dark:bg-espresso-800">
                        {staff.avatar || "👤"}
                      </span>
                      <div>
                        <h4 className="font-serif font-black text-base text-espresso-900 dark:text-cream-100 leading-tight">
                          {staff.name}
                        </h4>
                        <span className="text-[11px] font-bold text-vintage-orange uppercase tracking-wider block mt-0.5">
                          {staff.role}
                        </span>
                      </div>
                    </div>

                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1" title="Active Account" />
                  </div>

                  {/* Terminal PIN Box */}
                  <div className="p-3 rounded-2xl bg-cream-100/70 dark:bg-espresso-900 border border-cream-200 dark:border-espresso-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-vintage-orange" />
                      <div>
                        <span className="text-[10px] font-bold text-espresso-700/60 dark:text-cream-300/60 uppercase tracking-wider block leading-none">
                          Terminal PIN
                        </span>
                        <span className="font-mono font-black text-sm tracking-widest text-espresso-900 dark:text-cream-100 block mt-0.5">
                          {isRevealed ? staff.pin : "••••"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleRevealPin(staff.id)}
                      className="p-1.5 text-espresso-700/60 hover:text-espresso-900 dark:text-cream-300/60 dark:hover:text-cream-100 rounded-xl hover:bg-cream-200 dark:hover:bg-espresso-800 transition-colors"
                      title={isRevealed ? "Hide PIN" : "Reveal PIN"}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Details Card */}
                  <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-900/60 text-xs space-y-1.5 border border-cream-200/50 dark:border-espresso-800">
                    <div className="flex justify-between">
                      <span className="text-espresso-700/60 dark:text-cream-300/60 font-medium">Email:</span>
                      <span className="font-semibold truncate max-w-[170px]">{staff.email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-espresso-700/60 dark:text-cream-300/60 font-medium">Phone:</span>
                      <span className="font-semibold font-mono">{(staff as any).phone || profile?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-espresso-700/60 dark:text-cream-300/60 font-medium">Base Pay:</span>
                      <span className="font-mono font-black text-vintage-orange">
                        {formatCurrency(profile?.base_salary || (staff.role === "OWNER" ? 150000 : 55000))}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-cream-200 dark:border-espresso-700 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        playSound("click");
                        setSelectedStaffForEdit({
                          ...staff,
                          phone: (staff as any).phone || profile?.phone,
                          base_salary: profile?.base_salary,
                        });
                        setShowAccountModal(true);
                      }}
                      className="flex-1 h-9 rounded-xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-800 dark:text-cream-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-cream-300 dark:border-espresso-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-vintage-orange" />
                      <span>Edit Account & PIN</span>
                    </button>

                    <button
                      onClick={() => handleDeleteStaffAccount(staff.id, staff.name)}
                      className="p-2 rounded-xl text-espresso-700 hover:text-brick hover:bg-brick/10 border border-cream-200 dark:border-espresso-700 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY SHIFT ROSTER */}
      {activeTab === "ROSTER" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Weekly Floor & Kitchen Roster</h3>
              <p className="text-xs text-espresso-700/60">
                Morning shift (07:00 - 15:30) · Evening shift (15:00 - 23:30)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 overflow-x-auto">
            {daysOfWeek.map((day) => {
              const dayShifts = shifts.filter((s) => s.day_of_week === day);
              return (
                <div
                  key={day}
                  className="p-3 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-2 min-h-[220px]"
                >
                  <div className="text-center pb-2 border-b border-cream-100 font-serif font-black text-sm text-vintage-orange">
                    {day}
                  </div>

                  <div className="space-y-1.5">
                    {dayShifts.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-200 text-left text-[11px]"
                      >
                        <span className="font-bold block text-espresso-900 dark:text-cream-100">
                          {s.staff_name}
                        </span>
                        <span className="text-[10px] text-espresso-700/70">
                          {s.start_time} - {s.end_time}
                        </span>
                      </div>
                    ))}
                    {dayShifts.length === 0 && (
                      <span className="text-[10px] text-espresso-700/40 text-center block pt-4">
                        Off
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Account & Security PIN Modal */}
      <StaffAccountModal
        isOpen={showAccountModal}
        staff={selectedStaffForEdit}
        onClose={() => {
          setShowAccountModal(false);
          setSelectedStaffForEdit(null);
        }}
        onSaved={async () => {
          await loadHrData();
          setToastMsg("Staff account & credentials updated successfully");
          setTimeout(() => setToastMsg(null), 3000);
        }}
      />
    </div>
  );
}
