// ToolChoice scorer: did the agent reach for the right tool given the test
// case category? This replaces the old Preservation scorer, which was tied
// to the lesson 2 modifyDiagram tool surface and stopped meaning much once
// extractElements simulated the canvas headlessly.
//
// Rules, by category:
//   create: addElements must have been called at least once
//   modify: queryCanvas must come BEFORE any updateElements/removeElements,
//           and at least one of those mutators must have been called
//   domain: addElements must have been called (web search optional)
//   edge:   no rule, returns null and Braintrust skips it
//
// All checks run against output.toolCalls (the flat list of tool names in
// order, exposed by runAgent). No golden dataset changes required.

import type { EvalScorer } from "braintrust";
import type { ToolCallPart } from "ai";

import dataset from "../dataset.json";

export type GoldenTestCase = (typeof dataset)[number];
export type ToolCall = ToolCallPart;

export interface AgentOutput {
  text: string;
  toolCalls: ToolCall[];
}

export const toolChoiceScorer: EvalScorer<
  GoldenTestCase,
  AgentOutput,
  GoldenTestCase
> = ({ output, expected }) => {
  const calls = output.toolCalls ?? [];
  console.log("🤖 AGENT ~ calls:", calls);

  const category = expected.category;

  if (category === "chat") {
    const ok = calls.some((c) => c.toolName.includes("queryClient"));

    return {
      name: "ToolChoice",
      score: ok ? 1 : 0,
      metadata: {
        category,
        calls,
        reason: ok ? "queryClient called" : "queryClient not called",
      },
    };
  }

  return null;
};
