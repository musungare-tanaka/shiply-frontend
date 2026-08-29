import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./components/layouts/dashboard_layout/page", async () => {
  const { useLocation } = await import("react-router-dom");

  return {
    default: () => {
      const location = useLocation();

      return (
        <div>
          Dashboard route: {location.pathname}
          {location.search}
        </div>
      );
    },
  };
});

vi.mock("./components/github/GitHubImportPage", () => ({
  default: () => <div>GitHub import page</div>,
}));

import { AppRoutes } from "./App";

const renderAtRoute = (initialEntry: string) => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <AppRoutes />
  </MemoryRouter>,
);

describe("App auth access", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the login page at /login", () => {
    renderAtRoute("/login");

    expect(screen.getByRole("heading", { name: /login to your shiply account/i })).toBeInTheDocument();
  });

  it("renders the signup page at /signup", () => {
    renderAtRoute("/signup");

    expect(screen.getByRole("heading", { name: /create your shiply account/i })).toBeInTheDocument();
  });

  it("redirects authenticated users away from guest-only routes", () => {
    localStorage.setItem("token", "existing-session");

    renderAtRoute("/forgot-password");

    expect(screen.getByText("Dashboard route: /dashboard")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login and returns them to the original route after login", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "jwt-token",
        user: {
          email: "jane@example.com",
          fullName: "Jane Doe",
          role: "USER",
          status: "ACTIVE",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAtRoute("/dashboard/projects?tab=details");

    expect(screen.getByRole("heading", { name: /login to your shiply account/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard route: /dashboard/projects?tab=details")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9091/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(localStorage.getItem("token")).toBe("jwt-token");
    expect(localStorage.getItem("userEmail")).toBe("jane@example.com");
  });

  it("creates a session and routes new users to the dashboard after signup", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "signup-token",
        user: {
          email: "new@example.com",
          fullName: "New User",
          role: "USER",
          status: "ACTIVE",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAtRoute("/signup");

    await user.type(screen.getByLabelText(/full name/i), "New User");
    await user.type(screen.getByLabelText(/^email$/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard route: /dashboard")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9091/auth/register",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(localStorage.getItem("token")).toBe("signup-token");
    expect(localStorage.getItem("fullName")).toBe("New User");
  });

  it("exposes log in and sign up entry points on the landing page", () => {
    renderAtRoute("/");

    const loginLinks = screen.getAllByRole("link", { name: /log in/i });
    const signupLinks = screen.getAllByRole("link", { name: /sign up/i });

    expect(loginLinks.length).toBeGreaterThan(0);
    expect(signupLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute("href", "/login");
    expect(signupLinks[0]).toHaveAttribute("href", "/signup");
  });
});
