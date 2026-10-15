import { useCallback, useEffect, useRef, useState } from "react";
import { getDeploymentHistory } from "../lib/api";
import type { DeploymentHistoryItem } from "../lib/types";

const PAGE_SIZE = 20;

export interface DeploymentHistoryState {
  deployments: DeploymentHistoryItem[];
  page: number;
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const initialState: DeploymentHistoryState = {
  deployments: [],
  page: 0,
  totalPages: 0,
  totalElements: 0,
  isLoading: true,
  isLoadingMore: false,
  error: null,
};

export const useDeploymentHistory = (projectId?: string | null) => {
  const [state, setState] = useState<DeploymentHistoryState>(initialState);
  const generation = useRef(0);

  const loadFirstPage = useCallback(async (filterProjectId?: string | null) => {
    const requestGeneration = ++generation.current;
    setState({ ...initialState, isLoading: true });
    try {
      const result = await getDeploymentHistory({ page: 0, size: PAGE_SIZE, projectId: filterProjectId || undefined });
      if (generation.current !== requestGeneration) return;
      setState({
        deployments: result.content,
        page: result.page,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      });
    } catch (error) {
      if (generation.current !== requestGeneration) return;
      setState({ ...initialState, isLoading: false, error: error instanceof Error ? error.message : "Failed to load deployments" });
    }
  }, []);

  useEffect(() => {
    void loadFirstPage(projectId);
    return () => { generation.current += 1; };
  }, [loadFirstPage, projectId]);

  const loadMore = useCallback(async () => {
    if (state.isLoading || state.isLoadingMore || state.page + 1 >= state.totalPages) return;
    const requestGeneration = generation.current;
    const nextPage = state.page + 1;
    setState((current) => ({ ...current, isLoadingMore: true }));
    try {
      const result = await getDeploymentHistory({ page: nextPage, size: PAGE_SIZE, projectId: projectId || undefined });
      if (generation.current !== requestGeneration) return;
      setState((current) => {
        const byId = new Map(current.deployments.map((deployment) => [deployment.deploymentId, deployment]));
        for (const deployment of result.content) byId.set(deployment.deploymentId, deployment);
        return {
          ...current,
          deployments: Array.from(byId.values()),
          page: result.page,
          totalPages: result.totalPages,
          totalElements: result.totalElements,
          isLoadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      if (generation.current !== requestGeneration) return;
      setState((current) => ({ ...current, isLoadingMore: false, error: error instanceof Error ? error.message : "Failed to load more deployments" }));
    }
  }, [projectId, state.isLoading, state.isLoadingMore, state.page, state.totalPages]);

  const refresh = useCallback(async () => {
    const requestGeneration = ++generation.current;
    try {
      const result = await getDeploymentHistory({ page: 0, size: PAGE_SIZE, projectId: projectId || undefined });
      if (generation.current !== requestGeneration) return;
      setState((current) => ({
        ...current,
        deployments: result.content,
        page: result.page,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        isLoadingMore: false,
        error: null,
      }));
    } catch {
      // Background refreshes should not replace the current list or surface a new error.
      setState((current) => current.isLoadingMore ? { ...current, isLoadingMore: false } : current);
    }
  }, [projectId]);

  return {
    ...state,
    retry: () => loadFirstPage(projectId),
    refresh,
    loadMore,
    hasMore: state.page + 1 < state.totalPages,
  };
};
