import { useEffect, useState } from "react";
import PasswordField from "../../../auth/PasswordField";
import BASE_URL, { getErrorMessage } from "../../../../util/util";
import {
  getAuthToken,
  logout,
  setAuthSession,
} from "../../../../util/auth";

interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const logoutAndRedirect = () => {
    logout();
    window.location.href = "/login";
  };

  const loadProfile = async () => {
    const token = getAuthToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to load your profile"));
      }

      const data: UserProfile = await response.json();
      setProfile(data);
      setFullName(data.fullName ?? "");
      setAuthSession({
        token,
        user: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          status: data.status,
        },
      });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to load your profile");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const token = getAuthToken();
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setProfileSaving(true);
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
        }),
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to update your profile"));
      }

      const data: UserProfile = await response.json();
      setProfile(data);
      setFullName(data.fullName ?? "");
      setAuthSession({
        token,
        user: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          status: data.status,
        },
      });
      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await fetch(`${BASE_URL}/api/users/me/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to change your password"));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully.");
      void loadProfile();
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change your password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (profileLoading) {
    return <div className="app-loading-state">Loading your profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-page-title">Settings</h1>
        <p className="app-page-subtitle">
          Update your profile details and password from one place.
        </p>
      </div>

      {profileError ? (
        <div className="app-danger-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium">{profileError}</p>
            <button type="button" className="app-button-secondary" onClick={() => void loadProfile()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {profile ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="app-card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Profile</h2>
              <p className="app-muted mt-2 text-sm">
                Keep your account details current for your shared Shiply portal.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              {profileSuccess ? <p className="text-sm text-green-600">{profileSuccess}</p> : null}

              <div>
                <label className="app-label">Full Name</label>
                <input
                  className="app-input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Doe"
                  disabled={profileSaving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoField label="Email" value={profile.email} />
                <InfoField label="Role" value={profile.role} />
                <InfoField label="Status" value={profile.status} />
                <InfoField label="Last Access" value={formatDate(profile.lastLoginAt)} />
                <InfoField label="Created" value={formatDate(profile.createdAt)} />
                <InfoField label="Updated" value={formatDate(profile.updatedAt)} />
              </div>

              <button type="submit" className="app-button-primary" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </form>
          </div>

          <div className="app-card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <p className="app-muted mt-2 text-sm">
                Protect your account by updating your password without leaving this page.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              {passwordError ? <p className="text-sm text-red-500">{passwordError}</p> : null}
              {passwordSuccess ? <p className="text-sm text-green-600">{passwordSuccess}</p> : null}

              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                autoComplete="current-password"
                disabled={passwordLoading}
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                required
                autoComplete="new-password"
                disabled={passwordLoading}
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                autoComplete="new-password"
                disabled={passwordLoading}
              />

              <button type="submit" disabled={passwordLoading} className="app-button-primary">
                {passwordLoading ? "Updating..." : "Change password"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--app-border)" }}>
    <p className="app-muted text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
    <p className="mt-2 text-sm font-medium">{value}</p>
  </div>
);
