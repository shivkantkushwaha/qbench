# QBench — Exam Question Generator with Quality Check

QBench is an academic assessment engineering workbench and prompt-engineering testbed built with Next.js App Router, TypeScript, Tailwind CSS, Zod, and Google's official `@google/genai` SDK. It helps educators author exam questions mapped to Bloom's Revised Taxonomy, audit them independently across 7 psychometric criteria, apply targeted refinements, and compare prompt architectures (`V1`, `V2`, `V3`) side by side.

---

## Key Features

- **Stage 1 — Question Generator:** Generates MCQ, Short Answer, Long Answer, and Descriptive questions from subject, topic, syllabus details, Bloom's Taxonomy tier (`Remember` to `Create`), question count, and marks per question.
- **Stage 2 — Independent Quality Review:** Separate AI reviewer call auditing each question against 7 criteria (factual correctness, topic & syllabus relevance, Bloom's alignment, clarity, answer-key correctness, marking-scheme completeness, and marks consistency) with a 100-point rubric and `PASS` / `NEEDS_IMPROVEMENT` / `FAIL` verdicts.
- **Stage 3 — Targeted Question Refinement:** Separate AI refiner call that fixes only reviewer-flagged issues while preserving topic, learning objective, Bloom's level, question type, and marks—with a side-by-side Before/After comparison.
- **Prompt Experimentation Lab:**
  - Compare **V1 (Baseline / Zero-shot)**, **V2 (Structured with Constraints & Examples)**, and **V3 (Multi-Stage: Generation + Independent Review + Refinement)** on the exact same input.
  - Includes **12 editable sample test cases** covering valid inputs, Bloom's variations, question types, missing topic, empty syllabus, invalid marks, overly long topics, conflicting instructions, vague objectives, and odd marks distributions.
  - **6-criterion Human Evaluation Rubric** (`PASS` / `FAIL` + evaluator comments), clearly separated from automated AI reviewer feedback.
  - Browser `localStorage` persistence and **CSV / JSON export** of actual recorded results (no fabricated benchmark scores).
- **Teacher-in-the-Loop Design:** Explicitly treats AI review as decision support; teachers must verify all final examination materials.

---

## Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide Icons
- **Validation:** Zod v4 (input validation & structured AI output validation)
- **AI SDK & Provider:** `@google/genai` (Google Gemini API, server-side only)
- **Storage:** Browser `localStorage` only (no external database, ORM, Redis, or authentication)

---

## Architecture Overview

All Gemini API requests execute exclusively inside Next.js Route Handlers (`src/app/api/*`) so `GEMINI_API_KEY` is never exposed to the browser.

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # Stage 1: Question generation (V1/V2/V3)
│   │   ├── review/route.ts        # Stage 2: Independent quality review
│   │   ├── refine/route.ts        # Stage 3: Targeted question refinement
│   │   ├── experiment/route.ts    # Prompt Lab runner (V1/V2 single-stage, V3 multi-stage)
│   │   └── health/route.ts        # Server configuration health check
│   └── page.tsx                   # Main workspace & tab orchestration
├── components/
│   ├── dashboard/DashboardView.tsx
│   ├── generator/GeneratorView.tsx
│   ├── results/ResultsView.tsx
│   ├── review/QualityReviewView.tsx
│   └── prompts/PromptLabView.tsx
└── lib/
    ├── gemini.ts                  # @google/genai client, model fallback & 3-stage workflows
    ├── api-error.ts               # Shared HTTP error mapping (400, 401, 429, 500)
    ├── experiment-test-cases.ts   # 12 editable test cases for the Prompt Lab
    ├── mock-data.ts               # Clearly labeled sample preview data & prompt metadata
    ├── prompts/
    │   ├── question-generator.ts  # V1, V2, V3 generation prompts
    │   ├── quality-evaluator.ts   # Stage 2 independent reviewer prompt
    │   └── question-refiner.ts    # Stage 3 targeted refinement prompt
    ├── schemas/
    │   ├── common.ts              # Shared enums (Bloom, QuestionType, Difficulty)
    │   ├── question.ts            # Stage 1, 2, 3 Zod schemas
    │   └── experiment.ts          # Prompt Lab & Human Evaluation schemas
    └── storage/
        ├── local-history.ts       # Saved question history (localStorage)
        └── experiment-history.ts  # Saved experiment runs + CSV/JSON export
```

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js 20+
- `pnpm` (recommended) or `npm`
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Gemini API key:
```env
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.5-flash
```
> `.env.local` is ignored by `.gitignore` and never committed. `GEMINI_API_KEY` is read strictly on the server.

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000).

### 5. Run Verification Commands
```bash
pnpm run lint
pnpm tsc --noEmit
pnpm run build
```

---

## How the Three AI Stages Work

1. **Stage 1 — Generation (`/api/generate`):** Validates form inputs with `QuestionGeneratorFormInputSchema`, selects `V1`, `V2`, or `V3` prompt templates, requests structured JSON from Gemini, normalizes and validates the output with `QuestionBatchResponseSchema`. Neither review nor refinement runs automatically after generation to keep API usage economical.
2. **Stage 2 — Independent Quality Review (`/api/review`):** Triggered explicitly via **Review Questions**. Receives the original user requirements, generated questions, expected answers, and marking schemes. Uses a low-temperature (`0.2`) audit call to evaluate all 7 criteria, flag errors or uncertainty (`PASS`, `NEEDS_IMPROVEMENT`, `FAIL`), and return a 100-point rubric explanation.
3. **Stage 3 — Targeted Refinement (`/api/refine`):** Triggered explicitly via **Refine Selected Questions** or **Refine All Flagged Questions**. Questions that already `PASS` with zero issues are skipped without an API call. Flagged items are sent with their reviewer feedback (`temperature: 0.3`) to fix only the identified issues while enforcing preservation of `topic`, `bloomLevel`, `questionType`, and `marks`.

---

## Prompt Versions (V1, V2, V3)

- **V1 — Baseline / Zero-Shot:** Minimal role-based instruction requesting the JSON fields (`questionText`, `expectedAnswer`, `markingScheme`, `bloomExplanation`) without explicit Bloom definitions, distractor rules, or self-audit constraints.
- **V2 — Structured Prompt with Constraints & Examples:** Adds explicit Bloom's Revised Taxonomy tier guidance (`remember` through `create`), syllabus boundary rules (no inventing unmentioned modules), marks-sum rules, distractor rationale rules for MCQs, and formatting examples.
- **V3 — Multi-Stage Pipeline (Generation + Review + Refinement):** Uses a 5-constraint self-auditing generation prompt (`V3_SYSTEM_PROMPT`) for Stage 1; in the Prompt Experimentation Lab, V3 executes the full three-stage pipeline (Stage 1 Generation -> Stage 2 Independent Review -> Stage 3 Targeted Refinement on flagged items).

---

## Viva Discussion Guide: Prompt Engineering Design

Use this summary when explaining QBench's prompt architecture in an academic viva:

1. **Why separate Generation, Review, and Refinement into 3 AI calls?**
   - Asking a single prompt to generate and grade itself creates confirmation bias ("rubber-stamping"). Separating Stage 2 into an independent, low-temperature (`0.2`) auditor call with an explicit mandate to flag errors and uncertainty produces critical, actionable feedback. Separating Stage 3 (`0.3` temperature) ensures surgical fixes rather than full rewrites.
2. **How do V1, V2, and V3 differ empirically?**
   - **V1** tests baseline LLM capability with minimal scaffolding, often revealing weaker Bloom calibration or rubric arithmetic drift.
   - **V2** reduces structural and pedagogical errors using explicit taxonomy definitions, syllabus boundaries, and formatting examples.
   - **V3** enforces 5 hard constraints during generation and pairs them with independent review and targeted refinement, trading higher latency/token cost for verifiable quality.
3. **Why distinguish Automated Reviewer Feedback from Human Evaluation?**
   - An LLM reviewer score (e.g., 92/100) is heuristic assistance, **not** mathematical proof of correctness. QBench therefore separates AI audit output from the 6-criterion Human Evaluator Rubric (`PASS`/`FAIL` + comments) and requires teacher sign-off.
4. **How are invalid or adversarial inputs handled?**
   - Strict Zod schemas reject missing topics, empty syllabus details, invalid marks (`<= 0`), and oversized inputs before calling Gemini. In the Prompt Lab, edge-case test inputs return structured `validation_error` records so students can demonstrate guardrail behavior alongside prompt outputs.

---

## Known Limitations

- **No External Database:** Saved questions and experiment runs are stored in browser `localStorage` and are local to the current browser profile.
- **Model Availability & Quotas:** Free-tier Gemini API keys are subject to rate limits (`429`) and model availability changes; `src/lib/gemini.ts` includes a fallback chain (`GEMINI_MODEL` -> `gemini-3.5-flash` -> `gemini-3.8-flash`) and descriptive error messages.
- **Latency on Multi-Stage V3 Runs:** Because V3 in the Prompt Lab executes up to 3 sequential Gemini calls, end-to-end execution takes longer than V1 or V2.
- **Human Verification Required:** Automated quality review can still miss subtle domain nuances; final academic sign-off remains the educator's responsibility.
