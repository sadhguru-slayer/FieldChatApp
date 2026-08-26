// Legacy shim — all existing imports from "@/services/api" still work.
// New code should import from "@/services/api" (resolves to api/index.js)
// or directly from sub-modules: "@/services/api/messages", etc.
export * from "./api/index";
