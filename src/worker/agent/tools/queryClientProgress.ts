import { tool } from "ai";
import { z } from "zod";
import ClientProgress from "../../../app/dashboard/progress.json";

export function queryClientProgress() {
  return tool({
    description: `Get the Client's current plan progress information. useful to answer progression related to previous weeks.`,
    inputSchema: z.object({
      userInput: z
        .string()
        .describe(
          "User's search query for information about historical progress in the current plan",
        ),
    }),
    // eval that given a type fromt the dataset the responce cana count how many items
    execute: async ({ userInput }) => {
      console.log("🚀 ~ CALL client progress:", userInput);
      try {
        const data = ClientProgress;
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
