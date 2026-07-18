import { tool } from "ai";
import { z } from "zod";
import ClientProfile from "../../../app/client_profile.json";

export function queryClientProfile() {
  return tool({
    description: `Get the Client's profile information. Client current state, goals and preferences for the strenght plan.`,
    inputSchema: z.object({
      userInput: z
        .string()
        .describe(
          "User's search query for information about his strenght training program",
        ),
    }),
    // eval that given a type fromt the dataset the responce cana count how many items
    execute: async ({ userInput }) => {
      console.log("🚀 ~ CALL clietn profile:", userInput);
      try {
        const data = ClientProfile;
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
