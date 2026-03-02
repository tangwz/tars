import type { RuntimeCatalogItem, RuntimeId, RuntimeKind } from "@/features/runtime/runtimeTypes";

export const runtimeCatalog: RuntimeCatalogItem[] = [
  {
    id: "kimi",
    displayName: "KIMI",
    kind: "llm",
    description: "Moonshot AI hosted model runtime for chat and reasoning tasks.",
    authMethods: ["apiKey"],
    defaultAuthMethod: "apiKey",
  },
  {
    id: "codex",
    displayName: "Codex",
    kind: "coding-agent",
    description: "Coding agent runtime that can be connected with API key or OAuth.",
    authMethods: ["apiKey", "oauth"],
    defaultAuthMethod: "oauth",
  },
  {
    id: "gemini-cli",
    displayName: "gemini cli",
    kind: "coding-agent",
    description: "CLI-first coding agent runtime for project assistance workflows.",
    authMethods: ["apiKey", "oauth"],
    defaultAuthMethod: "oauth",
  },
  {
    id: "glm",
    displayName: "GLM",
    kind: "llm",
    description: "Zhipu GLM runtime for general-purpose LLM requests.",
    authMethods: ["apiKey"],
    defaultAuthMethod: "apiKey",
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
