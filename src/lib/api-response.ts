export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;
  const fallback = response.status >= 500
    ? `The server is temporarily unavailable (HTTP ${response.status}). Please try again later.`
    : response.ok
      ? "The server returned an unexpected response. Please try again."
      : `Request failed (HTTP ${response.status}). Please try again.`;
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(fallback, response.status);
  }
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result ? result.error : undefined;
    throw new ApiError(typeof message === "string" && message.trim() ? message : fallback, response.status);
  }
  return result as T;
}
