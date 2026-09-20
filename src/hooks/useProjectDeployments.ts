import { useEffect, useState } from "react";
import { API_BASE_URL, deploymentFromStreamEvent, getProjectDeployments, getProjectDeploymentStreamToken } from "../lib/api";
import type { DeploymentStatusResponse, DeploymentStreamEvent } from "../lib/types";

export interface ProjectDeploymentsState {
  deployments: DeploymentStatusResponse[];
  timelines: Record<string, DeploymentStreamEvent[]>;
  isLoading: boolean;
  error: string | null;
}

export const useProjectDeployments = (projectId?: string | null): ProjectDeploymentsState => {
  const [state, setState] = useState<ProjectDeploymentsState>({ deployments: [], timelines: {}, isLoading: Boolean(projectId), error: null });
  useEffect(() => {
    if (!projectId) return;
    let stopped = false; let source: EventSource | null = null; let failures = 0; let pollTimer: number | null = null; let reconnectTimer: number | null = null;
    const load = async () => {
      try { const deployments = await getProjectDeployments(projectId); if (!stopped) setState((s) => ({ ...s, deployments, isLoading: false, error: null })); }
      catch (error) { if (!stopped) setState((s) => ({ ...s, isLoading: false, error: error instanceof Error ? error.message : "Failed to load deployments" })); }
    };
    const poll = async () => { await load(); if (!stopped) pollTimer = window.setTimeout(poll, 3000); };
    const connect = async () => {
      if (import.meta.env.MODE === "test" || typeof EventSource === "undefined") { void poll(); return; }
      try {
        const { token } = await getProjectDeploymentStreamToken(projectId);
        source = new EventSource(`${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/deployments/stream?token=${encodeURIComponent(token)}`);
        source.addEventListener("deployment-status", (raw) => {
          const event = JSON.parse((raw as MessageEvent).data) as DeploymentStreamEvent; failures = 0;
          setState((current) => {
            const previous = current.deployments.find((item) => item.deploymentId === event.deploymentId);
            const deployment = deploymentFromStreamEvent(event, previous);
            const deployments = [deployment, ...current.deployments.filter((item) => item.deploymentId !== event.deploymentId)]
              .sort((a,b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
            const oldTimeline = current.timelines[event.deploymentId] || [];
            const timeline = oldTimeline.some((item) => item.id === event.id) ? oldTimeline : [...oldTimeline, event].sort((a,b) => a.timestamp.localeCompare(b.timestamp));
            try { localStorage.setItem(`shiply.project-deployments.${projectId}`, JSON.stringify(deployments)); } catch { /* optional cross-tab cache */ }
            return { deployments, timelines: { ...current.timelines, [event.deploymentId]: timeline }, isLoading: false, error: null };
          });
        });
        source.onerror = () => { source?.close(); source = null; failures += 1; if (!stopped) { if (failures >= 3) void poll(); else reconnectTimer = window.setTimeout(connect, 1000); } };
      } catch { failures += 1; if (!stopped) { if (failures >= 3) void poll(); else reconnectTimer = window.setTimeout(connect, 1000); } }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === `shiply.project-deployments.${projectId}` && event.newValue) try { const deployments = JSON.parse(event.newValue) as DeploymentStatusResponse[]; setState((s) => ({ ...s, deployments })); } catch { /* ignore malformed cache */ } };
    window.addEventListener("storage", onStorage); void load().then(connect);
    return () => { stopped=true; source?.close(); if(pollTimer)clearTimeout(pollTimer); if(reconnectTimer)clearTimeout(reconnectTimer); window.removeEventListener("storage",onStorage); };
  }, [projectId]);
  return state;
};
