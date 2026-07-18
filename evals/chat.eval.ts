// The Agent eval. One eval definition (dataset + task + scorers)
// that we run many times as we improve the agent. Every run becomes a new
// experiment in Braintrust, automatically tagged with the current git
// branch, commit, dirty flag, and commit message — no manual naming needed.
// You compare experiments in the dashboard via the auto collected metadata.
//
// Run with:
//   npm run eval

import { config } from "dotenv";
import { Eval } from "braintrust";
import type { ModelMessage } from "ai";

import { fetchAgentStaticText } from "../src/agent/agent-core";
import { SYSTEM_PROMPT } from "../src/worker/agent/system-propmt";
import { buildTools } from "../src/worker/agent/tools/tools";
import { toolChoiceScorer } from "./scorers/toolchoice";
import { characteristicsScorer } from "./scorers/characteristics";
import { containsNumberScorer } from "./scorers/containsNumber";

import dataset from "./dataset.json";

config({ path: ".dev.vars" });

export type GoldenTestCase = (typeof dataset)[number];
const testCases: GoldenTestCase[] = dataset;

// Always returns a single user turn.
export function buildMessages(tc: GoldenTestCase): ModelMessage[] {
  // could simulate a conversation to eval a pre-conversation state
  return [{ role: "user", content: tc.input }];
}

export interface AgentOutput {
  text: string;
  toolCalls: string[];
}

Eval<GoldenTestCase, AgentOutput, GoldenTestCase>("StrengthSync Agent", {
  data: () =>
    testCases.map((tc) => ({
      input: tc,
      expected: tc,
      metadata: {
        id: tc.id,
        difficulty: tc.difficulty,
        category: tc.category,
      },
    })),

  task: async (testCase) => {
    const result = await fetchAgentStaticText({
      messages: buildMessages(testCase),
      apiKey: process.env.OPENAI_API_KEY,
      system: SYSTEM_PROMPT,
      tools: buildTools(),
    });
    return { text: result.text, toolCalls: result.toolCalls };
  },

  scores: [toolChoiceScorer, characteristicsScorer, containsNumberScorer],
});
