import { useEffect, useState } from "react";
import BASE_URL from "../../../../util/util";
import NoProject from "./NoProject";
import CreateProject from "./CreateProject";
import type { ProjectsData } from "../../../interfaces/ProjectData";


export default function Dashboard() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);
  const [dashboardData, setDashboardData] = useState<ProjectsData | null>(null);

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const checkIfNewUser = async () => {
    try {
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
        throw new Error("Request failed");
      }

      const result = await response.json();
      setIsNewUser(result);

    } catch (error) {
      console.error("Auth validation failed:", error);
      logoutAndRedirect();
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/projects/get-project-data`, {
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
        throw new Error("Failed to fetch dashboard data");
      }

      const result: ProjectsData = await response.json();
      setDashboardData(result);

    } catch (error) {
      console.error("Dashboard fetch failed:", error);
    }
  };

  useEffect(() => {
    checkIfNewUser();
  }, [reload]);

  useEffect(() => {
    if (isNewUser === false) {
      fetchDashboardData();
    }
  }, [isNewUser]);

  if (isNewUser === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        Checking your account...
      </div>
    );
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

  if (!dashboardData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Projects" value={dashboardData.totalProjects} />
        <StatCard title="Active Services" value={dashboardData.activeServices} />
        <StatCard title="CPU Usage" value={`${dashboardData.cpuUsage}%`} />
        <StatCard title="RAM Usage" value={`${dashboardData.ramUsage}%`} />
        <StatCard title="Storage" value={`${dashboardData.storageUsage}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Plan" value={dashboardData.planName} />
        <StatCard title="Balance" value={`$${dashboardData.accountBalance.toFixed(2)}`} />
        <StatCard title="Bandwidth" value={`${dashboardData.bandwidthUsage}%`} />
      </div>
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <p className="text-slate-400 text-sm">{title}</p>
    <h3 className="text-2xl font-semibold text-white mt-1">{value}</h3>
  </div>
);
