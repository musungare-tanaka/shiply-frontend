const DEFAULT_API_BASE_URL = "http://localhost:8087";
const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export const getErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // Ignore parse errors and use the fallback.
  }

  return fallback;
};

export default BASE_URL;
