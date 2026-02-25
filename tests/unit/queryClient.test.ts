import { describe, expect, it } from "vitest";
import { queryClient } from "../../src/lib/query/queryClient";

describe("queryClient", () => {
  it("disables refetchOnWindowFocus", () => {
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it("uses stable retry policy", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
  });

  it("sets stale and gc times", () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(30_000);
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(300_000);
  });
});
