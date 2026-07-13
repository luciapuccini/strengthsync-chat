import { tool } from "ai";
import { z } from "zod";
import staticData from "../../../app/dashboard/data.json";

export function queryStaticData() {
  return tool({
    description: `Get the user's data from the dashboard. Use this tool when requested about "documents" "sales" "revenue" "customers"`,
    inputSchema: z.object({
      userInput: z
        .string()
        .describe("User's search query for his static dashboard related data"),
    }),
    execute: async ({ userInput }) => {
      console.log("🚀 TOOL CALL~ userInput:", userInput);
      try {
        const data = staticData;
        return {
          userInput,
          data,
        };
      } catch (err) {
        return {
          error: `Data search failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });
}
