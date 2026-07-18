export type ServiceType = "APP" | "DATABASE";

export type ServiceStatus = "PENDING" | "PROVISIONING" | "RUNNING" | "FAILED";

export type DatabaseType = "POSTGRESQL" | "MYSQL" | "REDIS" | "MONGODB";

export interface Project {
  id: string;
  name: string;
  userId: string;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface Service {
  id: string;
  projectId: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  databaseConfig?: DatabaseServiceConfig | null;
  applicationConfig?: ApplicationServiceConfig | null;
}

export interface DatabaseServiceConfig {
  databaseType: DatabaseType;
  version: string;
}

export interface ApplicationServiceConfig {
  repositoryUrl: string;
  branch: string;
  repositoryProvider: string;
  githubInstallationId?: number | null;
  githubRepositoryId?: number | null;
  repositoryOwner?: string | null;
  repositoryName?: string | null;
  defaultBranch?: string | null;
  applicationRootDirectory?: string | null;
  runtimeTemplate?: string | null;
  buildCommand?: string | null;
  startCommand?: string | null;
  exposedPort?: number | null;
  environmentVariables?: ApplicationEnvironmentVariable[];
  autoDeployEnabled: boolean;
  repositoryAccessRevoked: boolean;
  linkedDatabaseServiceId?: string | null;
  linkedDatabaseServiceName?: string | null;
}

export interface ApplicationEnvironmentVariable {
  key: string;
  value?: string | null;
  secret: boolean;
}

export interface CreateProjectInput {
  name: string;
}

export interface CreateDatabaseServiceInput {
  name: string;
  databaseType: DatabaseType;
  version: string;
}

export interface CreateApplicationServiceInput {
  name: string;
  repositoryUrl?: string | null;
  branch?: string | null;
  linkedDatabaseServiceId?: string | null;
  githubInstallationId?: number | null;
  githubRepositoryId?: number | null;
  repositoryOwner?: string | null;
  repositoryName?: string | null;
  defaultBranch?: string | null;
  applicationRootDirectory?: string | null;
  runtimeTemplate?: string | null;
  buildCommand?: string | null;
  startCommand?: string | null;
  exposedPort?: number | null;
  environmentVariables?: ApplicationEnvironmentVariable[] | null;
  autoDeployEnabled?: boolean | null;
}

export interface GitHubRepository {
  repositoryId: number;
  installationId: number;
  installationAccountLogin: string;
  installationAccountType: string;
  owner: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  privateRepository: boolean;
  visibility: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
}

export interface GitHubInstallationLinkResponse {
  installationId: number;
  accountLogin: string;
  accountType: string;
  status: string;
  repositories: GitHubRepository[];
}

export interface GitHubInstallationConnection {
  installationId: number;
  accountLogin: string;
  accountType: string;
  status: string;
  repositoryCount: number;
  lastRepositorySyncAt?: string | null;
  reconnectRequired: boolean;
}

export interface GitHubRepositoryPage {
  items: GitHubRepository[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GitHubRepositoryAnalysis {
  branch: string;
  applicationRootDirectory: string;
  visibleEntries: string[];
  detectedProjectTypes: string[];
}

export interface GitHubInstallUrlResponse {
  url: string;
}

export interface GitHubProjectImportInput {
  projectName: string;
  serviceName: string;
  installationId: number;
  repositoryId: number;
  branch: string;
  autoDeploy: boolean;
  linkedDatabaseServiceId?: string | null;
}
