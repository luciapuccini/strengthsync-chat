import type { EvalScorer } from "braintrust";
import type { GoldenTestCase, AgentOutput } from "../chat.eval";

export const containsNumberScorer: EvalScorer<
  GoldenTestCase,
  AgentOutput,
  GoldenTestCase
> = ({ output }) => {
  const contains = output.text.includes("20");
  return {
    name: "ContainsNumber",
    score: contains ? 1 : 0,
    metadata: { expected: "20", found: contains },
  };
};
