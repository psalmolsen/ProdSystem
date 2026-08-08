import React, { useEffect, useState } from "react";
import {
  getPendingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  getApprovedUsers,
  revokeUserAccess,
  type UserDocument,
} from "@/services/firestore/userService";
import type { AccessRequest } from "@/services/firestore/accessRequestService";
import {
  Check,
  X,
  Loader2,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Users,
  Clock,
  ShieldAlert,
  UserX,
} from "lucide-react";

function formatDate(timestamp: any): string {
  if (!timestamp) return "N/A";
  try {
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserDocument[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [pending, approved] = await Promise.all([
        getPendingAccessRequests(),
        getApprovedUsers(),
      ]);
      setRequests(pending);
      setApprovedUsers(approved);
      // Auto switch to approved tab if no pending requests exist
      if (pending.length === 0 && approved.length > 0) {
        setActiveTab("approved");
      }
    } catch (err: any) {
      console.error("Failed to load user access data:", err);
      setActionError("Failed to load access requests and approved accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (uid: string) => {
    setProcessingUid(uid);
    setActionError(null);
    try {
      await approveAccessRequest(uid);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to approve access request:", err);
      setActionError(err.message || "Failed to approve user.");
      setProcessingUid(null);
    }
  };

  const handleReject = async (uid: string) => {
    setProcessingUid(uid);
    setActionError(null);
    try {
      await rejectAccessRequest(uid);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to reject access request:", err);
      setActionError(err.message || "Failed to reject request.");
      setProcessingUid(null);
    }
  };

  const handleRevoke = async (user: UserDocument) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${user.displayName || user.email}?`)) {
      return;
    }
    const targetKey = user.id || user.uid;
    setProcessingUid(targetKey);
    setActionError(null);
    try {
      await revokeUserAccess(targetKey, user.uid);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to revoke user access:", err);
      setActionError(err.message || "Failed to revoke access.");
      setProcessingUid(null);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D2D2D7] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0071E3]/10 text-[#0071E3]">
                <UserCheck className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                User Access & Accounts
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#6E6E73]">
              View active system accounts and approve pending access requests.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D2D2D7] bg-white px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] shadow-sm hover:bg-[#F5F5F7] transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-[#0071E3] text-white shadow-sm"
                : "text-[#6E6E73] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Requests</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "pending"
                  ? "bg-white/20 text-white"
                  : "bg-[#FF9500]/15 text-[#D97706]"
              }`}
            >
              {requests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "approved"
                ? "bg-[#0071E3] text-white shadow-sm"
                : "text-[#6E6E73] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Active Accounts</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "approved"
                  ? "bg-white/20 text-white"
                  : "bg-[#34C759]/15 text-[#28A745]"
              }`}
            >
              {approvedUsers.length}
            </span>
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="grid h-64 place-items-center rounded-2xl border border-[#E5E5EA] bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071E3]" />
              <p className="text-sm font-medium text-[#6E6E73]">Loading user accounts...</p>
            </div>
          </div>
        ) : activeTab === "pending" ? (
          /* PENDING REQUESTS TAB */
          requests.length === 0 ? (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-[#D2D2D7] bg-white p-8 text-center">
              <div>
                <ShieldCheck className="mx-auto h-12 w-12 text-[#34C759]" />
                <h3 className="mt-3 text-lg font-semibold text-[#1D1D1F]">No Pending Requests</h3>
                <p className="mt-1 text-sm text-[#6E6E73]">
                  All access requests have been processed. Switch to Active Accounts to view approved users.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => {
                const isBusy = processingUid === request.uid;
                return (
                  <div
                    key={request.uid}
                    className="flex flex-col justify-between rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all"
                  >
                    <div className="space-y-4">
                      {/* User Header & Photo */}
                      <div className="flex items-start gap-4">
                        {request.photoURL ? (
                          <img
                            src={request.photoURL}
                            alt={request.displayName || "User"}
                            className="h-14 w-14 rounded-full object-cover border border-[#E5E5EA] shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0071E3] text-lg font-semibold text-white shadow-sm">
                            {(request.displayName || request.email || "U")
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center rounded-full bg-[#FF9500]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">
                            {request.status || "pending"}
                          </span>
                          <h2 className="mt-1.5 truncate text-base font-bold text-[#1D1D1F]">
                            {request.displayName || "Google Account User"}
                          </h2>
                          <p className="truncate text-xs font-medium text-[#6E6E73]">
                            {request.email}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="rounded-xl bg-[#F5F5F7] p-3 text-xs border border-[#E5E5EA]">
                        <div className="text-[#6E6E73]">
                          <span className="font-semibold text-[#1D1D1F]">Requested:</span>{" "}
                          {formatDate(request.requestedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(request.uid)}
                        disabled={isBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#34C759] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#2FB34F] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(request.uid)}
                        disabled={isBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#FF3B30]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#FF3B30] hover:bg-[#FFF5F5] hover:border-[#FF3B30] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ACTIVE ACCOUNTS TAB */
          approvedUsers.length === 0 ? (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-[#D2D2D7] bg-white p-8 text-center">
              <div>
                <Users className="mx-auto h-12 w-12 text-[#6E6E73]" />
                <h3 className="mt-3 text-lg font-semibold text-[#1D1D1F]">No Active Accounts</h3>
                <p className="mt-1 text-sm text-[#6E6E73]">
                  No active users are currently registered in the system.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {approvedUsers.map((user) => (
                <div
                  key={user.uid}
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all"
                >
                  <div className="space-y-4">
                    {/* User Header & Photo */}
                    <div className="flex items-start gap-4">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          className="h-14 w-14 rounded-full object-cover border border-[#E5E5EA] shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0071E3] text-lg font-semibold text-white shadow-sm">
                          {(user.displayName || user.email || "U")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#34C759]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#28A745] uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]"></span>
                            Approved Access
                          </span>
                        </div>
                        <h2 className="mt-1.5 truncate text-base font-bold text-[#1D1D1F]">
                          {user.displayName || "Authenticated User"}
                        </h2>
                        <p className="truncate text-xs font-medium text-[#6E6E73]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="rounded-xl bg-[#F5F5F7] p-3 text-xs border border-[#E5E5EA] space-y-1">
                      <div className="flex justify-between text-[#6E6E73]">
                        <span className="font-semibold text-[#1D1D1F]">System Role:</span>
                        <span className="font-bold text-[#0071E3] uppercase">{user.role || "User"}</span>
                      </div>
                      <div className="flex justify-between text-[#6E6E73]">
                        <span className="font-semibold text-[#1D1D1F]">Approved Date:</span>
                        <span>{formatDate(user.approvedAt || user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Revoke Access Action */}
                    <div className="mt-4 flex justify-end pt-3 border-t border-[#E5E5EA]">
                      <button
                        type="button"
                        onClick={() => handleRevoke(user)}
                        disabled={processingUid === (user.id || user.uid)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF3B30]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#FF3B30] hover:bg-[#FFF5F5] hover:border-[#FF3B30] transition-all disabled:opacity-50 cursor-pointer"
                        title="Revoke and remove system access for this account"
                      >
                        {processingUid === (user.id || user.uid) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>Revoke Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
