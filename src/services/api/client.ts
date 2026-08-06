const API_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined;

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

export function isApiConfigured(): boolean {
  return typeof API_URL === "string" && API_URL.trim().length > 0;
}

export async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  if (!isApiConfigured()) {
    throw new Error("VITE_GOOGLE_APPS_SCRIPT_URL is not configured.");
  }

  const searchParams = new URLSearchParams({ action, ...params });
  const url = `${API_URL}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (result.status === "error") {
    throw new Error(result.message || "API error occurred");
  }

  return result.data as T;
}

export async function apiPost<T>(action: string, payload: unknown): Promise<T> {
  if (!isApiConfigured()) {
    throw new Error("VITE_GOOGLE_APPS_SCRIPT_URL is not configured.");
  }

  // Use text/plain to avoid CORS preflight (OPTIONS) triggers in Google Apps Script
  const response = await fetch(API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (result.status === "error") {
    throw new Error(result.message || "API error occurred");
  }

  return result.data as T;
}
