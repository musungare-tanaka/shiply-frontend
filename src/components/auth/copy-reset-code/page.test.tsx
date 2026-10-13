import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CopyResetCode from "./page";
import { getPendingResetOtp } from "../resetFlowStorage";

describe("CopyResetCode", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, "", "/copy-reset-code#token=opaque-token");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  const mockCodeResponse = () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: "004271" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("copies all six characters and shows success only after the clipboard write resolves", async () => {
    const fetchMock = mockCodeResponse();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<MemoryRouter><CopyResetCode /></MemoryRouter>);
    expect(await screen.findByLabelText("Password reset code")).toHaveTextContent("004271");
    expect(window.location.hash).toBe("");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9091/auth/password-reset-code",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "opaque-token" }) }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(await screen.findByText("Code copied")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("004271");
  });

  it("provides manual-copy guidance when clipboard access fails", async () => {
    mockCodeResponse();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<MemoryRouter><CopyResetCode /></MemoryRouter>);
    expect(await screen.findByLabelText("Password reset code")).toHaveTextContent("004271");
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(await screen.findByText(/select the code above, then copy it manually/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password reset code")).toBeVisible();
    expect(screen.queryByText("Code copied")).not.toBeInTheDocument();
  });

  it("stages the exact code for the existing verification screen", async () => {
    mockCodeResponse();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn() } });

    render(
      <MemoryRouter initialEntries={["/copy-reset-code"]}>
        <Routes>
          <Route path="/copy-reset-code" element={<CopyResetCode />} />
          <Route path="/verify-reset-otp" element={<div>Existing verification screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByLabelText("Password reset code");
    fireEvent.click(screen.getByRole("button", { name: "Continue to password reset" }));
    await waitFor(() => expect(screen.getByText("Existing verification screen")).toBeInTheDocument());
    expect(getPendingResetOtp()).toBe("004271");
  });
});
