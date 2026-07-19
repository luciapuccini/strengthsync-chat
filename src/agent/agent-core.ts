import {
  generateObject,
  generateText,
  stepCountIs,
  streamText,
  type ModelMessage,
  type ToolSet,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { z } from "zod";
import { agentConfig } from "./config.ts";

interface AgentArgs {
  messages: ModelMessage[];
  apiKey: string;
  system: string;
  tools: ToolSet;
  maxSteps?: number;
}

// Shared agent core — runtime-agnostic (Cloudflare Worker chat, Node Temporal
// activities, evals). The API key is an explicit argument on purpose:
// each runtime supplies it its own way (env binding, process.env).
// Prompts and tools are injected per use case; see src/worker/agent/ (chat)
// and src/temporal/ (weekly analysis).

// Streaming variant. Used by the worker for the live chat experience.
export function fetchAgentStreamingText({
  messages,
  apiKey,
  system,
  tools,
  maxSteps = 4,
}: AgentArgs) {
  const openai = createOpenAI({ apiKey });
  return streamText({
    model: openai(agentConfig.openai_base_model),
    messages,
    system,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });
}

// Text variant. Used by Evals and by Temporal activities (one-shot analyses).
export async function fetchAgentStaticText({
  messages,
  apiKey,
  system,
  tools,
  maxSteps = 4,
}: AgentArgs) {
  const openai = createOpenAI({ apiKey });
  const result = await generateText({
    model: openai(agentConfig.openai_base_model),
    messages,
    system,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });
  return {
    text: result.text,
    steps: result.steps,
    toolCalls: result.toolCalls,
  };
}

interface AgentObjectArgs<T extends z.ZodType> {
  messages: ModelMessage[];
  apiKey: string;
  system: string;
  schema: T;
}

// Structured-output variant. Used when the result must be machine-readable
// (e.g. the plan-generation workflow produces a new program_<timestamp>.json).
export async function fetchAgentObject<T extends z.ZodType>({
  messages,
  apiKey,
  system,
  schema,
}: AgentObjectArgs<T>): Promise<{ object: z.infer<T> }> {
  const openai = createOpenAI({ apiKey });
  const result = await generateObject({
    model: openai(agentConfig.openai_base_model),
    messages,
    system,
    schema,
  });
  return { object: result.object as z.infer<T> };
}
