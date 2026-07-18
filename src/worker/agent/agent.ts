import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages } from "ai";
import { fetchAgentStreamingText } from "../../agent/agent-core";
import { SYSTEM_PROMPT } from "./system-propmt";
import { buildTools } from "./tools/tools";
import type { Env } from "../env";

export class StrengthSyncAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const messages = await convertToModelMessages(this.messages);

    const result = fetchAgentStreamingText({
      messages,
      apiKey: this.env.OPENAI_API_KEY,
      system: SYSTEM_PROMPT,
      tools: buildTools(),
    });

    return result.toUIMessageStreamResponse();
  }
}
