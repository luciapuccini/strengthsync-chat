import { generateText, stepCountIs, streamText, type ModelMessage } from "ai";
import { SYSTEM_PROMPT } from "./system-propmt";
import { agentConfig } from "./config";
import { createOpenAI } from "@ai-sdk/openai";
import { buildTools } from "./tools/tools";

interface AgentArgs {
  messages: ModelMessage[];
  apiKey: string;
}
// WIP:
const env = process.env;
// CLOAUDFLARE CLASS
// Streaming variant. Used by the worker for the live chat experience.
export function fetchAgentStreamingText({ messages, apiKey }: AgentArgs) {
  const openai = createOpenAI({ apiKey });
  return streamText({
    model: openai(agentConfig.openai_base_model),
    messages,
    system: SYSTEM_PROMPT,
    tools: buildTools(env),
    stopWhen: stepCountIs(4),
  });
}

// Text variant. Used by Evals.
export function fetchAgentStaticText({
  messages,
  apiKey,
  //   maxSteps = 8,
}: AgentArgs) {
  // const getResponse = agentConfig.isEval ? generateText : streamText;

  const openai = createOpenAI({ apiKey });
  return generateText({
    model: openai(agentConfig.openai_base_model),
    messages,
    system: SYSTEM_PROMPT,
    // tools: buildTools(env),
    // stopWhen: stepCountIs(maxSteps),
  });
}
