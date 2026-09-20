import { useSyncExternalStore } from "react";
import { API_BASE_URL, ApiError, deploymentFromStreamEvent, getDeployment, getDeploymentStreamToken } from "../lib/api";
import type { DeploymentStatusResponse, DeploymentStreamEvent } from "../lib/types";

const POLL_INTERVAL_MS = 3000;
const terminalStatuses = new Set(["RUNNING", "BUILD_FAILED", "DEPLOY_FAILED"]);

export const isDeploymentTerminal = (status?: string | null) => Boolean(status && terminalStatuses.has(status));

export const isDeploymentActive = (deployment?: DeploymentStatusResponse | null) =>
  Boolean(deployment && !isDeploymentTerminal(deployment.status));

export interface DeploymentStatusState {
  deployment: DeploymentStatusResponse | null;
  error: string | null;
  isLoading: boolean;
  isTracking: boolean;
}

interface DeploymentEntry {
  deployment: DeploymentStatusResponse | null;
  error: string | null;
  isLoading: boolean;
  listeners: Set<() => void>;
  timer: number | null;
  isFetching: boolean;
  snapshot: DeploymentStatusState;
  source: EventSource | null;
  streamFailures: number;
  polling: boolean;
}

const entries = new Map<string, DeploymentEntry>();
const emptyState: DeploymentStatusState = {
  deployment: null,
  error: null,
  isLoading: false,
  isTracking: false,
};

const getEntry = (deploymentId: string) => {
  let entry = entries.get(deploymentId);
  if (!entry) {
    entry = {
      deployment: null,
      error: null,
      isLoading: true,
      listeners: new Set(),
      timer: null,
      isFetching: false,
      snapshot: { deployment: null, error: null, isLoading: true, isTracking: true },
      source: null,
      streamFailures: 0,
      polling: import.meta.env.MODE === "test" || typeof EventSource === "undefined",
    };
    entries.set(deploymentId, entry);
  }
  return entry;
};

const notify = (entry: DeploymentEntry) => entry.listeners.forEach((listener) => listener());

const updateSnapshot = (entry: DeploymentEntry) => {
  entry.snapshot = {
    deployment: entry.deployment,
    error: entry.error,
    isLoading: entry.isLoading,
    isTracking: shouldTrack(entry),
  };
};

const clearTimer = (entry: DeploymentEntry) => {
  if (entry.timer !== null) {
    window.clearTimeout(entry.timer);
    entry.timer = null;
  }
};

const shouldTrack = (entry: DeploymentEntry) => !entry.deployment || !isDeploymentTerminal(entry.deployment.status);

const schedule = (deploymentId: string, entry: DeploymentEntry) => {
  clearTimer(entry);
  if (entry.listeners.size === 0 || !shouldTrack(entry) || !entry.polling) return;

  entry.timer = window.setTimeout(() => {
    entry.timer = null;
    void refresh(deploymentId, entry);
  }, POLL_INTERVAL_MS);
};

const connectStream = async (deploymentId: string, entry: DeploymentEntry) => {
  if (typeof EventSource === "undefined" || entry.source || entry.listeners.size === 0 || !shouldTrack(entry)) return;
  try {
    const { token } = await getDeploymentStreamToken(deploymentId);
    const lastId = typeof entry.deployment?.metadata?.eventId === "string" ? entry.deployment.metadata.eventId : "";
    const query = new URLSearchParams({ token });
    if (lastId) query.set("lastEventId", lastId);
    const source = new EventSource(`${API_BASE_URL}/api/v1/deployments/${encodeURIComponent(deploymentId)}/stream?${query}`);
    entry.source = source;
    source.addEventListener("deployment-status", (raw) => {
      const event = JSON.parse((raw as MessageEvent).data) as DeploymentStreamEvent;
      entry.deployment = deploymentFromStreamEvent(event, entry.deployment);
      entry.error = null; entry.streamFailures = 0; entry.isLoading = false;
      try { localStorage.setItem(`shiply.deployment.${deploymentId}`, JSON.stringify(entry.deployment)); } catch { /* optional cross-tab cache */ }
      updateSnapshot(entry); notify(entry);
      if (isDeploymentTerminal(event.status)) { source.close(); entry.source = null; }
    });
    source.onerror = () => {
      source.close(); entry.source = null; entry.streamFailures += 1;
      if (entry.streamFailures >= 3) { entry.polling = true; schedule(deploymentId, entry); }
      else window.setTimeout(() => void connectStream(deploymentId, entry), 1000);
    };
  } catch {
    entry.streamFailures += 1;
    if (entry.streamFailures >= 3) { entry.polling = true; schedule(deploymentId, entry); }
    else window.setTimeout(() => void connectStream(deploymentId, entry), 1000);
  }
};

const refresh = async (deploymentId: string, entry: DeploymentEntry) => {
  if (entry.isFetching || entry.listeners.size === 0) return;

  entry.isFetching = true;
  entry.isLoading = !entry.deployment;
  updateSnapshot(entry);
  notify(entry);

  try {
    entry.deployment = await getDeployment(deploymentId);
    entry.error = null;
    if (!entry.polling) void connectStream(deploymentId, entry);
  } catch (error) {
    // Deployment events are persisted asynchronously, so a new deployment can briefly be absent.
    if (!(error instanceof ApiError && error.status === 404 && !entry.deployment)) {
      entry.error = error instanceof Error ? error.message : "Failed to load deployment status";
    }
  } finally {
    entry.isFetching = false;
    entry.isLoading = false;
    updateSnapshot(entry);
    notify(entry);
    schedule(deploymentId, entry);
  }
};

const subscribe = (deploymentId: string, listener: () => void) => {
  const entry = getEntry(deploymentId);
  entry.listeners.add(listener);
  if (!entry.isFetching && entry.timer === null && shouldTrack(entry)) {
    void refresh(deploymentId, entry);
  }

  return () => {
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) { clearTimer(entry); entry.source?.close(); entry.source = null; }
  };
};

const snapshot = (deploymentId?: string): DeploymentStatusState => {
  if (!deploymentId) return emptyState;
  return getEntry(deploymentId).snapshot;
};

export const useDeploymentStatus = (deploymentId?: string | null) => {
  const id = deploymentId?.trim();
  return useSyncExternalStore(
    (listener) => (id ? subscribe(id, listener) : () => undefined),
    () => snapshot(id),
    () => emptyState,
  );
};
