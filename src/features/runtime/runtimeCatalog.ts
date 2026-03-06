import type { AuthMethod, RuntimeAuthMethodSpec, RuntimeCatalogItem, RuntimeId, RuntimeKind } from "@/features/runtime/runtimeTypes";

function buildAuth(methods: ReadonlyArray<[AuthMethod, RuntimeAuthMethodSpec["availability"]]>): RuntimeAuthMethodSpec[] {
  return methods.map(([method, availability]) => ({ method, availability }));
}

export const runtimeCatalog: RuntimeCatalogItem[] = [
  {
    id: "kimi",
    displayName: "KIMI",
    kind: "llm",
    description: "Moonshot AI hosted model runtime for chat and reasoning tasks.",
    auth: buildAuth([["apiKey", "available"]]),
    defaultAuthMethod: "apiKey",
    provider: "moonshot",
  },
  {
    id: "codex",
    displayName: "Codex",
    kind: "coding-agent",
    description: "Coding agent runtime that can be connected with API key or OAuth.",
    auth: buildAuth([
      ["apiKey", "available"],
      ["oauth", "comingSoon"],
    ]),
    defaultAuthMethod: "apiKey",
    provider: "openai",
  },
  {
    id: "gemini-cli",
    displayName: "Gemini",
    kind: "coding-agent",
    description: "CLI-first coding agent runtime for project assistance workflows.",
    auth: buildAuth([
      ["apiKey", "available"],
      ["oauth", "available"],
    ]),
    defaultAuthMethod: "oauth",
    provider: "google",
  },
  {
    id: "glm",
    displayName: "GLM",
    kind: "llm",
    description: "Zhipu GLM runtime for general-purpose LLM requests.",
    auth: buildAuth([["apiKey", "available"]]),
    defaultAuthMethod: "apiKey",
    provider: "zhipu",
  },
];

const runtimeCatalogById = Object.fromEntries(runtimeCatalog.map((item) => [item.id, item])) as Record<RuntimeId, RuntimeCatalogItem>;

export function getRuntimeCatalogItem(runtimeId: RuntimeId): RuntimeCatalogItem {
  return runtimeCatalogById[runtimeId];
}

export function listRuntimeCatalog(kind: "all" | RuntimeKind = "all"): RuntimeCatalogItem[] {
  if (kind === "all") {
    return runtimeCatalog;
  }

  return runtimeCatalog.filter((item) => item.kind === kind);
}
