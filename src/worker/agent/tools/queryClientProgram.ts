import { tool } from "ai";
import { z } from "zod";
import { getCurrentProgram } from "../../../ui/utils/getCurrentProgram";

export function queryClientProgram() {
  return tool({
    description: `Get the Client's current plan Program information. useful to answer Program related to previous weeks.`,
    inputSchema: z.object({
      userInput: z
        .string()
        .describe(
          "User's search query for information about historical Program in the current plan",
        ),
    }),
    // eval that given a type fromt the dataset the responce cana count how many items
    execute: async ({ userInput }) => {
      console.log("🚀 ~ CALL client Program:", userInput);
      try {
        const data = getCurrentProgram();
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
