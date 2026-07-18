import { tool } from "ai";
import { z } from "zod";
import staticData from "../../../app/dashboard/program.json";

export function queryStaticData() {
  return tool({
    description: `Get the user's data from the dashboard. Use this tool when requested about "documents" "sales" "revenue" "customers"`,
    inputSchema: z.object({
      userInput: z
        .string()
        .describe("User's search query for his static dashboard related data"),
    }),
    // eval that given a type fromt the dataset the responce cana count how many items
    execute: async ({ userInput }) => {
      console.log("🚀 ~ CALL toll query dta:", userInput);
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
