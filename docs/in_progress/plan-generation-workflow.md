# Plan: Plan-generation workflow (roadmap "End of plan")

Status: **in progress** — saved for reference before implementation.

Implements roadmap `docs/ROADMAP.md` → "Workflows discovery → Every end of plan":
gather progress + likes/dislikes → fixed expert rules + context → AI generates new
plan → update base template & app state. (CSV export for trainer: roadmap step 4,
out of scope.)

Related: `docs/in_progress/weekly-progress-workflow.md` (WF1).

## Decisions (from user)

- Generated plan supports **swimming/cardio** day types (schema enum + UI labels)
- After activation, **progress.json resets to week 1** of the new plan (closes WF1's deferred 4.2)
- Quiz = simple modal with one optional free textarea; submit triggers the workflow
- Output contract: 7 days/week Mon→Sun **including explicit rest days** (matches
  progress.json convention; lets rule 4 attach light-activity notes)

## Data flow

```
Quiz textarea (optional) ──────────────────────────────┐
progress/*.json + progress.json ─► summarizeProgressHistory (LLM 1) ─┐
client_profile.json ─────────────► summarizeClientProfile  (LLM 2) ──┼─► generateNewPlan (LLM 3, structured)
training_rules.md ──(appended to generation system prompt)───────────┘         │
                                     ┌─────────────────────────────────────────┤
                                     ▼                                         ▼
              program/program_<datetimestamp>.json + overwrite program.json   progress.json reset to week 1
```

## Workflow steps / dependency graph

| # | Activity | Input | Output | Depends on |
|---|----------|-------|--------|------------|
| 1 | `summarizeProgressHistory()` | fs: all `progress_*.json` + in-flight `progress.json` | `progressSummary` (text) | — |
| 2 | `summarizeClientProfile()` | fs: `client_profile.json` | `profileSummary` (text) | — |
| 3 | `generateNewPlan(...)` | summaries + `quizNotes` (workflow arg) + fs: `training_rules.md`, current `program.json` | `{ program, rationale }` | 1, 2 |
| 4 | `activateNewProgram({ program })` | program from 3 | `programFileName` | 3 |
| 5 | `resetProgressForNewPlan({ program })` | program from 3 | fresh `progress.json` | 3 (not 4) |

- Parallel group A: steps 1+2 (`Promise.all`) — independent LLM calls.
- Barrier: step 3 needs both summaries.
- Parallel group B: steps 4+5 — write different files, no conflicts.
- Timeouts/retries: summaries 2min / 2 attempts; generation 3min / 2 attempts; fs writes 30s.
- Expected latency ≈ 30–90s → blocking HTTP + spinner (same tradeoff as WF1).

## 1. Agent core

`fetchAgentObject<T>({ messages, apiKey, system, schema })` in `src/agent/agent-core.ts`
wrapping `generateObject` (ai SDK) — schema-validated output, not free text.

## 2. Temporal

- `src/temporal/schemas.ts` — `generatedPlanSchema`: mirrors `program.json`
  (`type: z.enum(["upper body", "leg day", "rest", "swimming", "cardio"])`) **plus**
  `rationale: string` (returned to UI, stripped before writing files)
- `src/temporal/prompts.ts` — `PROGRESS_SUMMARY_PROMPT`, `PROFILE_SUMMARY_PROMPT`,
  `PLAN_GENERATION_SYSTEM_PROMPT` (English scaffolding, Spanish plan content);
  `training_rules.md` appended to the generation system prompt at runtime
- `src/temporal/progressFile.ts` — generalize `timestampedFileName(prefix, date)`
  (`buildProgressFileName` stays as wrapper); add `CLIENT_PROFILE_FILE`,
  `TRAINING_RULES_FILE`, `PROGRAM_DIR`, `buildProgramFileName`
- `src/temporal/activities.ts` — 5 new activities (see table)
- `src/temporal/workflows.ts` — `planGenerationWorkflow(quizNotes?)`
- `src/temporal/server.ts` — `POST /api/workflows/plan-generation`, body `{ quizNotes?: string }`

## 3. UI

- Add shadcn `Dialog` (CLI; uses already-installed `@base-ui/react`, no new deps)
- `GeneratePlanButton.tsx` in `PageHeading` next to "Completar semana": modal +
  optional textarea → "Generar plan" → loading → success shows `rationale` in modal;
  Plan page refreshes from overwritten `program.json` (Vite HMR)
- `Program.tsx` — dayTypeLabels + "swimming" → "Natación", "cardio" → "Cardio"
- `src/types/types.ts` — extend `ExcersiseDay["type"]` union

## 4. Housekeeping & verification

- Test: `generatedPlanSchema.parse()` against current `program.json` (drift guard)
- CLAUDE.md structure update
- `pnpm build` / `test` / lint → E2E via curl (3 LLM calls)
