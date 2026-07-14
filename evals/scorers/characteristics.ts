import { ClosedQA } from "autoevals";
import type { EvalScorer } from "braintrust";

import type { GoldenTestCase } from "../chat.eval";
import type { AgentOutput } from "../chat.eval";

// LLM-as-judge: checks every expectedCharacteristic against result.text.
// Each criterion is evaluated independently via ClosedQA and averaged.
export const characteristicsScorer: EvalScorer<
  GoldenTestCase,
  AgentOutput,
  GoldenTestCase
> = async ({ input, output, expected }) => {
  const criteria = expected.expectedCharacteristics ?? [];

  if (criteria.length === 0) return null;

  const results = await Promise.all(
    criteria.map((criterion) =>
      ClosedQA({
        input: input.input,
        output: output.text,
        criteria: criterion,
      })
    )
  );

  const scores = results.map((r) => r.score ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    name: "Characteristics",
    score: avg,
    metadata: {
      criteria,
      scores: Object.fromEntries(criteria.map((c, i) => [c, scores[i]])),
    },
  };
};
