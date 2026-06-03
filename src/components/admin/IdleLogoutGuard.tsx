"use client";

/**
 * Idle-logout guard.
 *
 * For HIPAA compliance: signs the user out after 15 minutes of inactivity,
 * with a 2-minute warning modal so they aren't surprised. Tracks mouse,
 * keyboard, touch, scroll, and tab-visibility as activity signals.
 *
 * Activity events are ignored once the warning modal is showing — the user
 * has to explicitly click "Stay signed in" to extend their session.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before logout

// Public routes inside /admin where we should not run the guard.
const PUBLIC_ADMIN_PREFIXES = [
  "/admin/login",
  "/admin/reset-password",
  "/admin/setup",
];

export default function IdleLogoutGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isPublicPage = PUBLIC_ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const inWarningRef = useRef(false);
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    logoutTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const signOutNow = useCallback(async () => {
    clearAllTimers();
    inWarningRef.current = false;
    setSecondsLeft(null);
    await supabase.auth.signOut();
    router.push("/admin/login?reason=timeout");
  }, [clearAllTimers, router, supabase]);

  const armTimers = useCallback(() => {
    if (isPublicPage) return;
    clearAllTimers();
    inWarningRef.current = false;
    setSecondsLeft(null);

    warningTimerRef.current = window.setTimeout(() => {
      inWarningRef.current = true;
      const warningStartedAt = Date.now();
      setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
      countdownRef.current = window.setInterval(() => {
        const remaining = WARNING_BEFORE_MS - (Date.now() - warningStartedAt);
        setSecondsLeft(Math.max(0, Math.floor(remaining / 1000)));
      }, 1000);
    }, IDLE_LIMIT_MS - WARNING_BEFORE_MS);

    logoutTimerRef.current = window.setTimeout(() => {
      signOutNow();
    }, IDLE_LIMIT_MS);
  }, [clearAllTimers, isPublicPage, signOutNow]);

  const onActivity = useCallback(() => {
    if (inWarningRef.current) return; // ignore until user explicitly chooses
    armTimers();
  }, [armTimers]);

  useEffect(() => {
    if (isPublicPage) {
      clearAllTimers();
      inWarningRef.current = false;
      setSecondsLeft(null);
      return;
    }

    armTimers();

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !inWarningRef.current) {
        armTimers();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      clearAllTimers();
    };
  }, [isPublicPage, armTimers, onActivity, clearAllTimers]);

  if (isPublicPage || secondsLeft === null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="idle-title" className="mb-2 text-lg font-semibold text-slate-900">
          Still there?
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          For data security, you&apos;ll be signed out in{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {mm}:{ss}
          </span>{" "}
          due to inactivity.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={signOutNow}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
          >
            Sign out
          </button>
          <button
            onClick={armTimers}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 cursor-pointer"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
