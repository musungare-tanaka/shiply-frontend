"use client";

import { useEffect, useState } from "react";
import BASE_URL from "../../../../util/util";
import NoProject from "./NoProject";
import CreateProject from "./CreateProject";

export default function Dashboard() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0); // 👈 trigger re-check

  const checkIfNewUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/projects/new-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Verification failed");

      const result = await response.json();
      setIsNewUser(result);

    } catch (error) {
      console.error(error);
      setIsNewUser(false);
    }
  };

  useEffect(() => {
    checkIfNewUser();
  }, [reload]); // 👈 re-run when reload changes

  if (isNewUser === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        Checking your account...
      </div>
    );
  }

  // 👉 Show Create Project screen INSIDE dashboard layout
  if (creating) {
    return (
      <CreateProject
        onSuccess={() => {
          setCreating(false);
          setReload(prev => prev + 1); // 👈 force dashboard reload
        }}
        onCancel={() => {
          setCreating(false);
          setReload(prev => prev + 1); // 👈 re-check new user status
        }}
      />
    );
  }

  // 👉 No project yet
  if (isNewUser) {
    return <NoProject onCreate={() => setCreating(true)} />;
  }

  // 👉 Normal dashboard
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
      <div className="text-slate-300">
        <p>Welcome to your dashboard. View your hosting overview here.</p>
      </div>
    </div>
  );
}
