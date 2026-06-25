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
  linkedDatabaseServiceId?: string | null;
  linkedDatabaseServiceName?: string | null;
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
  repositoryUrl: string;
  branch?: string | null;
  linkedDatabaseServiceId?: string | null;
}
