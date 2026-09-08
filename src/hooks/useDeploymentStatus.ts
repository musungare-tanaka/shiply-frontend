import { useSyncExternalStore } from "react";
import { ApiError, getDeployment } from "../lib/api";
import type { DeploymentStatusResponse } from "../lib/types";

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
  if (entry.listeners.size === 0 || !shouldTrack(entry)) return;

  entry.timer = window.setTimeout(() => {
    entry.timer = null;
    void refresh(deploymentId, entry);
  }, POLL_INTERVAL_MS);
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
    if (entry.listeners.size === 0) clearTimer(entry);
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
