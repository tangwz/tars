import type { OAuthSessionStatus } from "@/features/runtime/runtimeTypes";

interface RuntimeOAuthPollingOptions {
  sessionId: string;
  poll: (sessionId: string) => Promise<OAuthSessionStatus>;
  signal?: AbortSignal;
  intervalMs?: number;
  onPending?: (status: Extract<OAuthSessionStatus, { state: "pending" }>) => void;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const cleanup = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", handleAbort);
    };

    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Runtime OAuth polling aborted", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort, { once: true });
    }
  });
}

export async function pollRuntimeOAuthSessionUntilSettled(options: RuntimeOAuthPollingOptions): Promise<OAuthSessionStatus> {
  const { sessionId, poll, signal, intervalMs = 1_000, onPending } = options;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Runtime OAuth polling aborted", "AbortError");
    }

    const status = await poll(sessionId);

    if (status.state !== "pending") {
      return status;
    }

    onPending?.(status);
    await delay(intervalMs, signal);
  }
}
