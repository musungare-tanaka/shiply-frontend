import { useEffect, useState } from "react";
import BASE_URL, { getErrorMessage } from "../../../../util/util";
import NoProject from "./NoProject";
import CreateProject from "./CreateProject";
import type { ProjectsData } from "../../../interfaces/ProjectData";
import { getCurrentUserFullName, getCurrentUserRole, getCurrentUserStatus, logout } from "../../../../util/auth";

export default function Dashboard() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);
  const [dashboardData, setDashboardData] = useState<ProjectsData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const logoutAndRedirect = () => {
    logout();
    window.location.href = "/login";
  };

  const checkIfNewUser = async () => {
    try {
      setDashboardError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/new-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load your account"));
      }

      const result = await response.json();
      setIsNewUser(result);

    } catch (error) {
      console.error("Auth validation failed:", error);
      setDashboardError(error instanceof Error ? error.message : "Failed to load your account");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setDashboardError(null);
      setIsLoadingDashboard(true);
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/get-dashboard-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load dashboard data"));
      }

      const result: ProjectsData = await response.json();
      setDashboardData(result);

    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard data");
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    void checkIfNewUser();
  }, [reload]);

  useEffect(() => {
    if (isNewUser === false) {
      void fetchDashboardData();
    }
  }, [isNewUser]);

  if (isNewUser === null && !dashboardError) {
    return (
      <div className="app-loading-state min-h-[70vh]">
        Checking your account...
      </div>
    );
  }

  if (isNewUser === null && dashboardError) {
    return <ErrorState message={dashboardError} onRetry={() => setReload((prev) => prev + 1)} />;
  }

  if (creating) {
    return (
      <CreateProject
        onSuccess={() => {
          setCreating(false);
          setReload(prev => prev + 1);
        }}
        onCancel={() => {
          setCreating(false);
          setReload(prev => prev + 1);
        }}
      />
    );
  }

  if (isNewUser) {
    return <NoProject onCreate={() => setCreating(true)} />;
  }

  if (isLoadingDashboard) {
    return (
      <div className="app-loading-state min-h-[70vh]">
        Loading dashboard...
      </div>
    );
  }

  if (dashboardError) {
    return <ErrorState message={dashboardError} onRetry={() => void fetchDashboardData()} />;
  }

  if (!dashboardData) {
    return <ErrorState message="No dashboard data is available yet." onRetry={() => void fetchDashboardData()} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-page-title">Dashboard</h1>
        <p className="app-page-subtitle">
          A quick view of your current projects, services, and plan status.
        </p>
      </div>

      <div className="app-card">
        <p className="text-lg font-semibold">
          {getCurrentUserFullName() || "Welcome back"}
        </p>
        <p className="app-muted mt-2 text-sm">
          Role: {getCurrentUserRole() || "USER"} • Account status: {getCurrentUserStatus() || "ACTIVE"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Projects" value={dashboardData.totalProjects} />
        <StatCard title="Active Services" value={dashboardData.activeServices} />
        <StatCard title="Plan" value={dashboardData.planName} />
      </div>
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="app-stat-card">
    <p className="app-muted text-sm">{title}</p>
    <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex min-h-[70vh] items-center justify-center px-4">
    <div className="app-danger-panel w-full max-w-md text-center">
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onRetry}
        className="app-button-secondary mt-4"
      >
        Try Again
      </button>
    </div>
  </div>
);
