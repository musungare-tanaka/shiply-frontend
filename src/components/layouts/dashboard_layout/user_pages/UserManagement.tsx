import { useEffect, useState } from "react";
import BASE_URL, { getErrorMessage } from "../../../../util/util";
import { getAuthToken, getCurrentUserEmail, logout } from "../../../../util/auth";

interface AdminUser {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
}

interface AdminUserListResponse {
  users: AdminUser[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

interface AdminUserSummaryResponse {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  suspendedUsers: number;
  deactivatedUsers: number;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Harare",
  }).format(new Date(value));
};

const UserManagement = () => {
  const [summary, setSummary] = useState<AdminUserSummaryResponse | null>(null);
  const [usersResponse, setUsersResponse] = useState<AdminUserListResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const logoutAndRedirect = () => {
    logout();
    window.location.href = "/login";
  };

  const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const token = getAuthToken();
    if (!token) {
      logoutAndRedirect();
      throw new Error("Unauthorized");
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401) {
      logoutAndRedirect();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Unable to complete the request"));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  };

  const loadData = async (page = 0) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        size: "10",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (roleFilter) {
        params.set("role", roleFilter);
      }
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const [summaryData, usersData] = await Promise.all([
        fetchJson<AdminUserSummaryResponse>(`${BASE_URL}/api/admin/users/summary`),
        fetchJson<AdminUserListResponse>(`${BASE_URL}/api/admin/users?${params.toString()}`),
      ]);

      setSummary(summaryData);
      setUsersResponse(usersData);
      if (selectedUser) {
        const refreshedSelectedUser = usersData.users.find((user) => user.id === selectedUser.id);
        if (refreshedSelectedUser) {
          setSelectedUser(refreshedSelectedUser);
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, roleFilter, statusFilter]);

  const openUser = async (userId: number) => {
    try {
      setError("");
      const user = await fetchJson<AdminUser>(`${BASE_URL}/api/admin/users/${userId}`);
      setSelectedUser(user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load user details");
    }
  };

  const updateStatus = async (status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED") => {
    if (!selectedUser) {
      return;
    }

    const reason = window.prompt(`Optional reason for setting status to ${status}:`) ?? "";

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      const updatedUser = await fetchJson<AdminUser>(`${BASE_URL}/api/admin/users/${selectedUser.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, reason }),
      });
      setSelectedUser(updatedUser);
      setSuccess(`User status updated to ${status}.`);
      await loadData(usersResponse?.page ?? 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const updateRole = async (role: "USER" | "ADMIN") => {
    if (!selectedUser) {
      return;
    }

    if (!window.confirm(`Change ${selectedUser.email} to ${role}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      const updatedUser = await fetchJson<AdminUser>(`${BASE_URL}/api/admin/users/${selectedUser.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      setSelectedUser(updatedUser);
      setSuccess(`User role updated to ${role}.`);
      await loadData(usersResponse?.page ?? 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = selectedUser?.email === getCurrentUserEmail();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="app-page-title">User Management</h1>
          <p className="app-page-subtitle">
            Search, filter, and manage users without leaving the shared Shiply dashboard.
          </p>
        </div>
      </div>

      {error ? <div className="app-danger-panel text-sm font-medium">{error}</div> : null}
      {success ? <div className="app-card border-green-200 bg-green-50 text-sm font-medium text-green-700">{success}</div> : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Users" value={summary.totalUsers} />
          <StatCard label="Active" value={summary.activeUsers} />
          <StatCard label="Admins" value={summary.adminUsers} />
          <StatCard label="Suspended" value={summary.suspendedUsers} />
          <StatCard label="Deactivated" value={summary.deactivatedUsers} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="app-card space-y-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
            <input
              className="app-input"
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select className="app-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select className="app-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button type="button" className="app-button-primary" onClick={() => setSearch(searchInput)}>
              Search
            </button>
          </div>

          {loading ? (
            <div className="app-loading-state min-h-[18rem]">Loading users...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="app-muted">
                      <th className="px-3 py-3 font-semibold">Name</th>
                      <th className="px-3 py-3 font-semibold">Email</th>
                      <th className="px-3 py-3 font-semibold">Role</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Created</th>
                      <th className="px-3 py-3 font-semibold">Last Access</th>
                      <th className="px-3 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResponse?.users.map((user) => (
                      <tr key={user.id} className="border-t" style={{ borderColor: "var(--app-border)" }}>
                        <td className="px-3 py-3 font-medium">{user.fullName || "No name set"}</td>
                        <td className="px-3 py-3">{user.email}</td>
                        <td className="px-3 py-3">{user.role}</td>
                        <td className="px-3 py-3">
                          <StatusPill status={user.status} />
                        </td>
                        <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-3 py-3">{formatDate(user.lastLoginAt)}</td>
                        <td className="px-3 py-3">
                          <button type="button" className="app-link" onClick={() => void openUser(user.id)}>
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="app-muted text-sm">
                  Showing page {(usersResponse?.page ?? 0) + 1} of {Math.max(usersResponse?.totalPages ?? 1, 1)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="app-button-secondary"
                    disabled={!usersResponse || usersResponse.page === 0}
                    onClick={() => void loadData((usersResponse?.page ?? 0) - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="app-button-secondary"
                    disabled={!usersResponse || (usersResponse.page ?? 0) >= (usersResponse.totalPages ?? 1) - 1}
                    onClick={() => void loadData((usersResponse?.page ?? 0) + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="app-card">
          {selectedUser ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{selectedUser.fullName || "No name set"}</h2>
                <p className="app-muted mt-2 break-all text-sm">{selectedUser.email}</p>
              </div>

              <div className="grid gap-3">
                <DetailRow label="Role" value={selectedUser.role} />
                <DetailRow label="Status" value={selectedUser.status} />
                <DetailRow label="Created" value={formatDate(selectedUser.createdAt)} />
                <DetailRow label="Updated" value={formatDate(selectedUser.updatedAt)} />
                <DetailRow label="Last Access" value={formatDate(selectedUser.lastLoginAt)} />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Status actions</p>
                <div className="grid gap-2">
                  <button type="button" className="app-button-secondary" disabled={actionLoading || !!isSelf} onClick={() => void updateStatus("ACTIVE")}>
                    Reactivate
                  </button>
                  <button type="button" className="app-button-secondary" disabled={actionLoading || !!isSelf} onClick={() => void updateStatus("SUSPENDED")}>
                    Suspend
                  </button>
                  <button type="button" className="app-button-danger" disabled={actionLoading || !!isSelf} onClick={() => void updateStatus("DEACTIVATED")}>
                    Deactivate
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Role actions</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <button type="button" className="app-button-secondary" disabled={actionLoading || !!isSelf} onClick={() => void updateRole("USER")}>
                    Make USER
                  </button>
                  <button type="button" className="app-button-secondary" disabled={actionLoading || !!isSelf} onClick={() => void updateRole("ADMIN")}>
                    Make ADMIN
                  </button>
                </div>
              </div>

              {isSelf ? (
                <div className="app-warning-panel text-sm">
                  Self-service admin safety is enabled. Your own status and role cannot be changed here.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="app-loading-state min-h-[18rem]">
              Select a user to view details and manage their access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="app-stat-card">
    <p className="app-muted text-sm">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--app-border)" }}>
    <p className="app-muted text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
    <p className="mt-2 text-sm font-medium">{value}</p>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    SUSPENDED: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    DEACTIVATED: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    INACTIVE: "border-slate-500/20 bg-slate-500/10 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.INACTIVE}`}>
      {status}
    </span>
  );
};

export default UserManagement;
