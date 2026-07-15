import { getAuthToken, logout } from "../util/auth";
import type {
  CreateApplicationServiceInput,
  CreateDatabaseServiceInput,
  CreateProjectInput,
  GitHubBranch,
  GitHubInstallUrlResponse,
  GitHubInstallationLinkResponse,
  GitHubProjectImportInput,
  GitHubRepository,
  Project,
  Service,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:9091").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const buildHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError("You need to log in again", 401);
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const handleUnauthorized = (status: number) => {
  if (status === 401 || status === 403) {
    logout();
    window.location.href = "/login";
  }
};

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
  } catch {
    // Ignore parse failures and fall back to the default.
  }

  return fallback;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    handleUnauthorized(response.status);
    throw new ApiError(await readErrorMessage(response, "Request failed"), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const createProject = (input: CreateProjectInput) =>
  request<Project>("/api/v1/projects", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

export const getProjects = () =>
  request<Project[]>("/api/v1/projects", {
    headers: buildHeaders(),
  });

export const getProject = (projectId: string) =>
  request<Project>("/api/v1/projects/" + projectId, {
    headers: buildHeaders(),
  });

export const deleteProject = (projectId: string) =>
  request<void>("/api/v1/projects/" + projectId, {
    method: "DELETE",
    headers: buildHeaders(),
  });

export const createDatabaseService = (projectId: string, input: CreateDatabaseServiceInput) =>
  request<Service>(`/api/v1/projects/${projectId}/services/database`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

export const createApplicationService = (projectId: string, input: CreateApplicationServiceInput) =>
  request<Service>(`/api/v1/projects/${projectId}/services/application`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

export const getGitHubInstallUrl = () =>
  request<GitHubInstallUrlResponse>("/api/integrations/github/install-url", {
    headers: buildHeaders(),
  });

export const linkGitHubInstallation = (installationId: number, setupAction?: string | null) =>
  request<GitHubInstallationLinkResponse>("/api/integrations/github/installations", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      installationId,
      setupAction: setupAction || undefined,
    }),
  });

export const getGitHubRepositories = () =>
  request<GitHubRepository[]>("/api/integrations/github/repositories", {
    headers: buildHeaders(),
  });

export const getGitHubBranches = (repositoryId: number) =>
  request<GitHubBranch[]>(`/api/integrations/github/repositories/${repositoryId}/branches`, {
    headers: buildHeaders(),
  });

export const importGitHubProject = (input: GitHubProjectImportInput) =>
  request<Project>("/api/integrations/github/projects/import", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

export const unlinkGitHubInstallation = (installationId: number) =>
  request<void>(`/api/integrations/github/installations/${installationId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

export const linkApplicationToDatabase = (appServiceId: string, dbServiceId: string) =>
  request<Service>(`/api/v1/services/${appServiceId}/link/${dbServiceId}`, {
    method: "POST",
    headers: buildHeaders(),
  });

export const deleteService = (serviceId: string) =>
  request<void>(`/api/v1/services/${serviceId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
