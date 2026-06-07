const DEFAULT_GOOGLE_CLIENT_ID =
  "356939529214-n1gum5u8ip0auuirjrl958g8g7jgap3b.apps.googleusercontent.com";

let googleScriptPromise: Promise<void> | null = null;

interface GoogleResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement | null,
    config: {
      theme: string;
      size: string;
      width: number;
    },
  ) => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID;

export const loadGoogleIdentityScript = (): Promise<void> => {
  if (window.google) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google sign-in")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const renderGoogleButton = async (
  elementId: string,
  callback: (response: GoogleResponse) => void,
): Promise<void> => {
  await loadGoogleIdentityScript();

  const element = document.getElementById(elementId);
  if (!element || !window.google) {
    throw new Error("Google sign-in is unavailable");
  }

  element.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback,
  });

  window.google.accounts.id.renderButton(element, {
    theme: "outline",
    size: "large",
    width: 300,
  });
};
