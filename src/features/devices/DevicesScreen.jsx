import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Monitor, Smartphone, ShieldAlert, LogOut, CheckCircle2, Laptop, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { getMe, getUserTokens, revokeAllUserTokens, deleteToken, getMyUserId, getDeviceId } from "@/services/api";

export function DevicesScreen({ onClose }) {
  const qc = useQueryClient();
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const signOut = useAppStore((s) => s.signOut);
  const currentDeviceId = getDeviceId();

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const { data: rawTokens = [], isLoading, refetch } = useQuery({
    queryKey: ["userTokens"],
    queryFn: () => getUserTokens(),
    refetchInterval: 5000,
  });

  const revokeAllMut = useMutation({
    mutationFn: () => revokeAllUserTokens(),
    onSuccess: (res) => {
      toast.success(res?.message || "All sessions revoked");
      signOut();
    },
    onError: (err) => toast.error(err.message || "Failed to revoke sessions"),
  });

  const deleteTokenMut = useMutation({
    mutationFn: (tokenId) => deleteToken(tokenId),
    onSuccess: (_, variables) => {
      toast.success("Session revoked");
      qc.invalidateQueries({ queryKey: ["userTokens"] });
      // If no active tokens remain or active token was deleted, logout
      const currentToken = localStorage.getItem("refresh_token");
      if (!currentToken || rawTokens.length <= 1) {
        signOut();
      }
    },
    onError: (err) => toast.error(err.message || "Failed to revoke session"),
  });




  const handleBack = () => {
    if (onClose) onClose();
    else setActiveScreen("chat");
  };

  const activeTokens = rawTokens.filter((t) => !t.revoked);

  return (
    <div className="flex h-full w-full flex-col bg-[#0e1621] text-foreground select-none overflow-hidden">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header
        className="flex h-14 items-center justify-between border-b px-4 md:px-6 shrink-0"
        style={{ background: "#17212b", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="grid size-8 place-items-center rounded-lg text-[#5d8aa8] transition-colors hover:bg-white/5 hover:text-[#e3e3e3]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-[#e3e3e3]">Active Sessions & Devices</h1>
            <p className="text-[10px] text-[#5d8aa8]">Manage connected devices and tokens</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="grid size-8 place-items-center rounded-lg text-[#5d8aa8] hover:bg-white/5 hover:text-[#e3e3e3] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </header>

      {/* ── Main Workspace Content ────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-xl space-y-6">

          {/* User Banner */}
          <div
            className="flex items-center gap-4 rounded-2xl border p-4"
            style={{ background: "#182533", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <Avatar src={me?.avatar} name={me?.name || "User"} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-[#e3e3e3]">{me?.name}</h2>
              <p className="text-[11px] text-[#5d8aa8]">@{me?.username} • ID: {me?.userId || "—"}</p>
            </div>
          </div>

          {/* Active Sessions List */}
          <div
            className="space-y-4 rounded-2xl border p-5"
            style={{ background: "#182533", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wider text-[#5d8aa8] uppercase">
                Active Tokens ({activeTokens.length})
              </h3>

              {activeTokens.length > 0 && (
                <button
                  type="button"
                  onClick={() => revokeAllMut.mutate()}
                  disabled={revokeAllMut.isPending}
                  className="text-[11px] font-medium text-red-400 hover:underline disabled:opacity-50"
                >
                  {revokeAllMut.isPending ? "Revoking..." : "Revoke All Sessions"}
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="py-6 text-center text-xs text-[#5d8aa8]/70">Loading active sessions...</p>
            ) : activeTokens.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="size-8 text-emerald-400/60 mx-auto mb-2" />
                <p className="text-xs font-medium text-[#e3e3e3]">Current session only</p>
                <p className="text-[11px] text-[#5d8aa8]/70 mt-0.5">No other active refresh tokens found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTokens.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#1c2633] p-3 transition-colors hover:border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-[#5d8aa8]">
                        {t.device_name?.toLowerCase().includes("mobile") ? (
                          <Smartphone className="size-4" />
                        ) : (
                          <Laptop className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#e3e3e3] truncate">
                            {t.device_name || "Fieldchat Web Client"}
                          </p>
                          {(t.device_id === currentDeviceId || (idx === 0 && !t.device_id)) && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[9px] font-medium text-emerald-400 border border-emerald-500/20">
                              This Device (Active)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#5d8aa8] truncate">
                          IP: {t.ip_address || "127.0.0.1"} • Created: {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTokenMut.mutate(t.id)}
                      disabled={deleteTokenMut.isPending}
                      className="ml-2 grid size-7 shrink-0 place-items-center rounded-lg text-[#5d8aa8] hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Revoke Session"
                    >
                      <LogOut className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div
            className="flex items-start gap-3 rounded-2xl border p-4 text-xs text-[#5d8aa8]"
            style={{ background: "rgba(93,138,168,0.05)", borderColor: "rgba(93,138,168,0.15)" }}
          >
            <ShieldAlert className="size-4 shrink-0 text-[#8ab4d0] mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Tokens are issued upon authentication. Revoking a session will immediately invalidate access for that client device.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
