import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { subscribeToWebPush } from "@/services/api";
import { cn } from "@/lib/utils";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if browser supports notifications
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    // Check if permission is default and user hasn't dismissed it recently
    const isDefault = Notification.permission === "default";
    const dismissedTime = localStorage.getItem("fc_notifications_dismissed");
    
    // Prompt again after 3 days if they dismissed it earlier
    const cooldownDays = 3;
    let isCooldownOver = true;
    if (dismissedTime) {
      const diff = Date.now() - parseInt(dismissedTime, 10);
      isCooldownOver = diff > cooldownDays * 24 * 60 * 60 * 1000;
    }

    if (isDefault && isCooldownOver) {
      // Delay showing for 2 seconds to let the user settle in
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("[NotificationPrompt] Permission granted! Subscribing...");
        await subscribeToWebPush();
      } else {
        console.warn("[NotificationPrompt] Permission denied:", permission);
        localStorage.setItem("fc_notifications_dismissed", Date.now().toString());
      }
    } catch (err) {
      console.error("[NotificationPrompt] Error requesting permission:", err);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("fc_notifications_dismissed", Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-5",
        // Desktop: bottom-6 right-6. Mobile: bottom-24 left-4 right-4 (above bottom nav)
        "bottom-24 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-[360px]"
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Decorative background gradient glow */}
        <div className="absolute -right-10 -top-10 -z-10 size-24 rounded-full bg-indigo-500/10 blur-xl" />
        <div className="absolute -left-10 -bottom-10 -z-10 size-24 rounded-full bg-violet-500/10 blur-xl" />

        <div className="flex gap-3">
          {/* Animated Bell Icon */}
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-xl bg-indigo-400/20 opacity-75" />
            <Bell className="size-5 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <h3 className="text-xs font-semibold text-zinc-100 tracking-tight">
              Stay in the loop
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              Enable push notifications to receive real-time messages instantly, even when Fieldchat is closed.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <button
            onClick={handleDismiss}
            className="rounded-xl px-3 py-1.5 text-[10.5px] font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleEnable}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-[10.5px] font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/10 border border-indigo-500/20"
          >
            Enable Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
