export interface AuthUser {
  email: string;
  fullName?: string | null;
  role: string;
  status?: string | null;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

const AUTH_KEYS = {
  token: "token",
  email: "userEmail",
  fullName: "fullName",
  role: "userRole",
  status: "userStatus",
} as const;

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(AUTH_KEYS.token);
};

export const setAuthSession = (payload: AuthPayload) => {
  localStorage.setItem(AUTH_KEYS.token, payload.token);
  localStorage.setItem(AUTH_KEYS.email, payload.user.email);
  localStorage.setItem(AUTH_KEYS.role, payload.user.role);

  if (payload.user.fullName) {
    localStorage.setItem(AUTH_KEYS.fullName, payload.user.fullName);
  } else {
    localStorage.removeItem(AUTH_KEYS.fullName);
  }

  if (payload.user.status) {
    localStorage.setItem(AUTH_KEYS.status, payload.user.status);
  } else {
    localStorage.removeItem(AUTH_KEYS.status);
  }
};

export const getAuthToken = (): string | null => localStorage.getItem(AUTH_KEYS.token);

export const getCurrentUserRole = (): string | null => localStorage.getItem(AUTH_KEYS.role);

export const getCurrentUserEmail = (): string | null => localStorage.getItem(AUTH_KEYS.email);

export const getCurrentUserStatus = (): string | null => localStorage.getItem(AUTH_KEYS.status);

export const getCurrentUserFullName = (): string | null => localStorage.getItem(AUTH_KEYS.fullName);

export const isAdmin = (): boolean => getCurrentUserRole() === "ADMIN";

export const logout = () => {
  localStorage.removeItem(AUTH_KEYS.token);
  localStorage.removeItem(AUTH_KEYS.email);
  localStorage.removeItem(AUTH_KEYS.fullName);
  localStorage.removeItem(AUTH_KEYS.role);
  localStorage.removeItem(AUTH_KEYS.status);
};
