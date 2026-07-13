import { queryStaticData } from "./queryStaticData";

// This is node, not "worker" env
export interface ToolEnv {}

export function buildTools(env: ToolEnv) {
  console.log("🚀 TOOLS~ env:", env);
  return {
    queryStaticData: queryStaticData(),
  };
}
