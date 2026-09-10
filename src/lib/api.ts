import { getAuthToken, logout } from "../util/auth";
import type {
  GitHubInstallationConnection,
  CreateApplicationServiceInput,
  CreateDatabaseServiceInput,
  CreateProjectInput,
  DeployApplicationServiceResponse,
  DeploymentStatusResponse,
  GitHubRepositoryAnalysis,
  GitHubBranch,
  GitHubInstallUrlResponse,
  GitHubInstallationLinkResponse,
  GitHubRepositoryPage,
  GitHubProjectImportInput,
  GitHubRepository,
  Project,
  Service,
  BillingOverview,
  PaymentResponse,
  PaymentHistoryPage,
  PaymentStatus,
  SubscriptionTier,
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

export const getBillingOverview = () =>
  request<BillingOverview>("/api/payments/overview", { headers: buildHeaders() });

export const initiatePayment = (tier: SubscriptionTier, ecocashNumber: string, saveNumber: boolean) =>
  request<PaymentResponse>("/api/payments", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ tier, ecocashNumber, saveNumber }),
  });

export const getPaymentStatus = (merchantReference: string) =>
  request<PaymentResponse>(`/api/payments/${encodeURIComponent(merchantReference)}`, {
    headers: buildHeaders(),
  });

export interface PaymentHistoryFilters {
  page?: number;
  size?: number;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

export const getPaymentHistory = (filters: PaymentHistoryFilters = {}) => {
  const query = new URLSearchParams();
  query.set("page", String(filters.page ?? 0));
  query.set("size", String(filters.size ?? 20));
  if (filters.status) query.set("status", filters.status);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  return request<PaymentHistoryPage>(`/api/payments/history?${query.toString()}`, { headers: buildHeaders() });
};

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

export const getGitHubInstallations = () =>
  request<GitHubInstallationConnection[]>("/api/integrations/github/installations", {
    headers: buildHeaders(),
  });

export const getGitHubRepositoriesByInstallation = (installationId: number, query = "", page = 0, size = 20) =>
  request<GitHubRepositoryPage>(
    `/api/integrations/github/repositories?installationId=${installationId}&query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    {
      headers: buildHeaders(),
    },
  );

export const getGitHubBranches = (repositoryId: number) =>
  request<GitHubBranch[]>(`/api/integrations/github/repositories/${repositoryId}/branches`, {
    headers: buildHeaders(),
  });

export const analyzeGitHubRepository = (repositoryId: number, branch?: string | null, applicationRootDirectory?: string | null) => {
  const params = new URLSearchParams();
  if (branch?.trim()) {
    params.set("branch", branch.trim());
  }
  if (applicationRootDirectory?.trim()) {
    params.set("applicationRootDirectory", applicationRootDirectory.trim());
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<GitHubRepositoryAnalysis>(`/api/integrations/github/repositories/${repositoryId}/analysis${suffix}`, {
    headers: buildHeaders(),
  });
};

export const refreshGitHubInstallation = (installationId: number) =>
  request<GitHubInstallationConnection>(`/api/integrations/github/installations/${installationId}/refresh`, {
    method: "POST",
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

export const triggerDeploy = (serviceId: string) =>
  request<DeployApplicationServiceResponse>(`/api/v1/services/${serviceId}/deploy`, {
    method: "POST",
    headers: buildHeaders(),
  });

export const getDeployment = (deploymentId: string) =>
  request<DeploymentStatusResponse>(`/api/v1/deployments/${deploymentId}`, {
    headers: buildHeaders(),
  });

export const getProjectDeployments = (projectId: string) =>
  request<DeploymentStatusResponse[]>(`/api/v1/projects/${projectId}/deployments`, {
    headers: buildHeaders(),
  });
