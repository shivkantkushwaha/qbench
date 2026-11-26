import {
  AssessmentQuestion,
  AssessmentQualityReview,
  PromptVersionData,
  ActivityLogItem,
} from "@/types";

/**
 * Notice: This is realistic educational demo data designed for initial UI preview.
 * It is clearly tagged as demo data so it is never mistaken for live AI output.
 */
export const DEMO_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "demo-q1",
    questionNumber: 1,
    subject: "Operating Systems (CS301)",
    topic: "Virtual Memory Page Replacement",
    syllabusObjective: "Analyze page fault frequency and compare FIFO, LRU, and Optimal replacement policies under fixed allocation.",
    questionType: "multiple_choice",
    bloomLevel: "apply",
    marks: 2,
    isDemo: true,
    questionText:
      "Consider a virtual memory system with 3 initially empty physical page frames. A process accesses memory pages in the following reference sequence:\n\nReference String: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3\n\nUsing the Least Recently Used (LRU) page replacement algorithm, what is the exact number of page faults that occur, and which page resides in the most recently accessed frame after the sequence completes?",
    options: [
      {
        id: "A",
        text: "8 page faults; page 3 resides in the frame",
        isCorrect: false,
        distractorRationale: "Calculated if page hits are erroneously counted as replacement misses.",
      },
      {
        id: "B",
        text: "7 page faults; page 3 resides in the frame",
        isCorrect: true,
        distractorRationale: "Correct trace: Faults on 7, 0, 1 (initial loading), 2 (replaces 7), hit on 0, 3 (replaces 1), hit on 0, 4 (replaces 2), 2 (replaces 3), 3 (replaces 0). Total 7 faults.",
      },
      {
        id: "C",
        text: "6 page faults; page 2 resides in the frame",
        isCorrect: false,
        distractorRationale: "Confuses LRU with Optimal (Belady's anomaly) lookahead replacement.",
      },
      {
        id: "D",
        text: "9 page faults; page 4 resides in the frame",
        isCorrect: false,
        distractorRationale: "Assumes FIFO behavior without updating LRU timestamp on intermediate hits.",
      },
    ],
    answerKey: "Option B (7 page faults; page 3 resides in the frame)",
    expectedAnswer: "Option B: Total 7 page faults occur (faults on 7, 0, 1, 2, 3, 4, 2). Page 3 resides in the most recently accessed frame.",
    bloomExplanation: "Requires students to apply the formal LRU replacement policy algorithm step-by-step to a novel concrete access sequence.",
    difficulty: "medium",
    markingScheme: [
      {
        step: "Frame State Tracing",
        marks: 1.0,
        criteria: "Correctly maintains stack / recency list at each step without FIFO inversion.",
      },
      {
        step: "Final Fault Count & Final State",
        marks: 1.0,
        criteria: "Accurately identifies 7 faults and concludes with pages [4, 2, 3] in memory.",
      },
    ],
  },
  {
    id: "demo-q2",
    questionNumber: 2,
    subject: "Operating Systems (CS301)",
    topic: "Process Synchronization & Concurrency",
    syllabusObjective: "Evaluate mutual exclusion primitives and detect deadlock vulnerability in semaphore implementations.",
    questionType: "short_answer",
    bloomLevel: "analyze",
    marks: 5,
    isDemo: true,
    questionText:
      "Two concurrent threads P1 and P2 share two binary semaphores S and Q, both initialized to 1.\n\nThread P1 execution code:\n  wait(S);\n  wait(Q);\n  critical_section_1();\n  signal(Q);\n  signal(S);\n\nThread P2 execution code:\n  wait(Q);\n  wait(S);\n  critical_section_2();\n  signal(S);\n  signal(Q);\n\n(a) Identify the specific Coffman condition satisfied in this sequence that permits a deadlock to occur.\n(b) Illustrate an interleaving sequence that leads directly to deadlock.\n(c) Propose a minimal modification to Thread P2 to eliminate deadlock while retaining mutual exclusion.",
    answerKey:
      "(a) Circular Wait condition is satisfied due to asymmetric lock acquisition order.\n(b) Interleaving: P1 executes wait(S) -> Context Switch -> P2 executes wait(Q) -> P1 attempts wait(Q) (blocks) -> P2 attempts wait(S) (blocks).\n(c) Enforce global lock ordering: Modify P2 to acquire S first then Q (wait(S); wait(Q); ... signal(Q); signal(S);).",
    expectedAnswer:
      "Detailed solution covers: (a) Circular Wait condition from asymmetric lock hierarchy; (b) Interleaved timeline leading to mutual deadlock; (c) Restructuring P2 to acquire semaphore S before Q.",
    bloomExplanation:
      "Targets Bloom L4 (Analyze) by requiring decomposition of concurrent interleavings and diagnostic root-cause determination.",
    difficulty: "hard",
    markingScheme: [
      {
        step: "Coffman Condition Identification",
        marks: 1.5,
        criteria: "States Circular Wait (and Hold & Wait) with specific reference to resource dependency.",
      },
      {
        step: "Interleaving Trace Diagram",
        marks: 1.5,
        criteria: "Provides exact interleaved timeline demonstrating mutual blocking.",
      },
      {
        step: "Remediation via Resource Hierarchy",
        marks: 2.0,
        criteria: "Reorders semaphore acquisition in P2 to strictly match P1 hierarchy.",
      },
    ],
  },
  {
    id: "demo-q3",
    questionNumber: 3,
    subject: "Database Management Systems (CS304)",
    topic: "Indexing & Query Optimization",
    syllabusObjective: "Evaluate secondary indexing structures and disk I/O cost trade-offs between B+ Trees and Hash Indexing.",
    questionType: "long_answer",
    bloomLevel: "evaluate",
    marks: 10,
    isDemo: true,
    questionText:
      "A banking transaction database processes 10,000,000 transaction records. Two query workloads dominate the system:\n- Workload 1: Exact account balance lookups (WHERE AccountID = ?)\n- Workload 2: Auditing date-range reports (WHERE Timestamp BETWEEN ? AND ?)\n\n(a) Evaluate the computational and disk I/O performance of a Hash Index versus a clustered B+ Tree index for both workloads.\n(b) Explain why a Hash Index fails to efficiently satisfy Workload 2.\n(c) Derive the maximum number of disk block accesses required to find an arbitrary record in a 3-level B+ Tree assuming a fanout of 100, where data pointers reside exclusively in leaf nodes.",
    answerKey:
      "(a) Hash index achieves O(1) expected disk access for Workload 1, but cannot support Workload 2. B+ Tree achieves O(log_B N) for Workload 1 and provides sequential leaf scans for Workload 2.\n(b) Hash functions destroy key ordering; range queries require full table scans across all hash buckets.\n(c) Height = 3: Root access (1 block) + Internal node (1 block) + Leaf node (1 block) + Data block fetch (1 block) = 4 disk I/O operations in the worst case without buffer caching.",
    expectedAnswer:
      "Comprehensive evaluation of Hash vs B+ Tree access times for point vs range queries, with step-by-step block access derivation for height=3 B+ Tree.",
    bloomExplanation:
      "Targets Bloom L5 (Evaluate) by requiring justification of storage data structures and formal disk I/O derivation under workload constraints.",
    difficulty: "hard",
    markingScheme: [
      {
        step: "Index Comparative Analysis",
        marks: 3.5,
        criteria: "Comprehensive evaluation of point lookups vs sequential range scans for both structures.",
      },
      {
        step: "Hash Index Range Limitation",
        marks: 2.5,
        criteria: "Correct technical explanation regarding non-order-preserving properties of hash functions.",
      },
      {
        step: "B+ Tree Height & I/O Derivation",
        marks: 4.0,
        criteria: "Clear step-by-step block access derivation accounting for index levels plus data record fetch.",
      },
    ],
  },
  {
    id: "demo-q4",
    questionNumber: 4,
    subject: "Computer Networks (CS305)",
    topic: "Transport Layer Reliability & Congestion Control",
    syllabusObjective: "Design and synthesize congestion control mechanisms handling sudden packet loss over high-delay bandwidth-delay product links.",
    questionType: "descriptive",
    bloomLevel: "create",
    marks: 8,
    isDemo: true,
    questionText:
      "TCP Reno and TCP CUBIC handle congestion window recovery differently upon encountering packet loss. Design a congestion window adaptation algorithm for an underwater acoustic sensor network characterized by severe round-trip times (RTT ~ 2000ms) and random transmission loss.\n\nYour response must detail:\n1. How your mechanism differentiates between link-layer bit error loss and actual buffer congestion.\n2. The mathematical formula for updating the congestion window (CWND) during steady state versus packet loss events.\n3. The fairness criteria your algorithm satisfies when coexisting with standard TCP flows.",
    answerKey:
      "Key architectural points:\n1. Loss Discrimination: Uses explicit round-trip delay queuing measurements (RTT variance) or ECN (Explicit Congestion Notification) rather than assuming all losses are caused by buffer overflow.\n2. Adaptation Formula: Multiplicative decrease is scaled inversely with measured queuing delay instead of a constant factor of 0.5.\n3. Fairness: Maintains TCP-friendliness over long observation epochs by bounding window growth to Reno-equivalent rates during detected network saturation.",
    expectedAnswer:
      "Synthesizes an underwater congestion control algorithm differentiating random vs queue loss with mathematical CWND scaling formulas and TCP fairness bounds.",
    bloomExplanation:
      "Targets Bloom L6 (Create) by demanding synthesis of a novel protocol adaptation formula for non-standard propagation environments.",
    difficulty: "hard",
    markingScheme: [
      {
        step: "Loss Discrimination Architecture",
        marks: 3.0,
        criteria: "Proposes verifiable delay gradient or explicit feedback mechanism to isolate random loss.",
      },
      {
        step: "CWND Mathematical Formulation",
        marks: 3.0,
        criteria: "Clear equation defining steady-state increment and congestion back-off coefficients.",
      },
      {
        step: "Protocol Fairness & Coexistence",
        marks: 2.0,
        criteria: "Demonstrates understanding of AIMD convergence and resource fairness guarantees.",
      },
    ],
  },
];

/**
 * Realistic Quality Review Report corresponding to the sample dataset
 */
export const DEMO_QUALITY_REVIEW: AssessmentQualityReview = {
  overallStatus: "NEEDS_IMPROVEMENT",
  overallScore: 89,
  rubricExplanation:
    "Sample preview scored out of 100 across 7 criteria (Factual Correctness, Topic & Syllabus Relevance, Bloom Alignment, Clarity, Answer-Key Correctness, Marking-Scheme Completeness, Marks Consistency). Items 1–3 pass (92–96/100); Item 4 is flagged NEEDS_IMPROVEMENT (74/100) due to broad grading rubric bounds.",
  overallSummary:
    "Sample Quality Review: 3 of 4 demo questions pass all psychometric criteria. Question 4 is flagged for minor rubric refinement to tighten partial-credit boundaries.",
  timestamp: "2026-11-23T14:00:00Z",
  totalQuestions: 4,
  passedCount: 3,
  needsImprovementCount: 1,
  failedCount: 0,
  isDemo: true,
  criterionSummary: [
    {
      criterion: "factual_correctness",
      label: "Factual Correctness",
      status: "PASS",
      score: 96,
      explanation: "All sample algorithms, page replacement traces, and semaphore semantics are factually accurate.",
    },
    {
      criterion: "topic_syllabus_relevance",
      label: "Topic & Syllabus Relevance",
      status: "PASS",
      score: 95,
      explanation: "Questions directly align with core Operating Systems, DBMS, and Computer Networks objectives.",
    },
    {
      criterion: "bloom_alignment",
      label: "Bloom's Taxonomy Alignment",
      status: "PASS",
      score: 91,
      explanation: "Tasks ascend appropriately from Apply (L3) through Create (L6).",
    },
    {
      criterion: "clarity_unambiguity",
      label: "Clarity & Unambiguity",
      status: "PASS",
      score: 90,
      explanation: "Problem stems provide explicit initial states and reference sequences.",
    },
    {
      criterion: "answer_key_correctness",
      label: "Answer-Key Correctness",
      status: "PASS",
      score: 95,
      explanation: "Expected answers and MCQ correct options are verified.",
    },
    {
      criterion: "marking_scheme_completeness",
      label: "Marking-Scheme Completeness",
      status: "NEEDS_IMPROVEMENT",
      score: 78,
      explanation: "Q4's open-ended design rubric would benefit from concrete acceptable CWND scaling bounds.",
    },
    {
      criterion: "marks_consistency",
      label: "Marks Consistency",
      status: "PASS",
      score: 100,
      explanation: "All step-by-step rubric marks sum exactly to each question's total marks.",
    },
  ],
  questionVerdicts: [
    {
      questionId: "demo-q1",
      questionNumber: 1,
      status: "PASS",
      score: 95,
      summary: "Well-calibrated Apply-level MCQ with verified LRU trace and authentic distractors.",
      criterionResults: [
        { criterion: "factual_correctness", label: "Factual Correctness", status: "PASS", score: 98, explanation: "LRU trace yields 7 faults accurately." },
        { criterion: "topic_syllabus_relevance", label: "Topic & Syllabus Relevance", status: "PASS", score: 96, explanation: "Directly tests page replacement policies." },
        { criterion: "bloom_alignment", label: "Bloom's Taxonomy Alignment", status: "PASS", score: 95, explanation: "Requires executing LRU rather than recalling definitions." },
        { criterion: "clarity_unambiguity", label: "Clarity & Unambiguity", status: "PASS", score: 94, explanation: "Frame count and reference string are explicit." },
        { criterion: "answer_key_correctness", label: "Answer-Key Correctness", status: "PASS", score: 98, explanation: "Option B is verified correct." },
        { criterion: "marking_scheme_completeness", label: "Marking-Scheme Completeness", status: "PASS", score: 92, explanation: "2-mark scheme covers trace and final frame state." },
        { criterion: "marks_consistency", label: "Marks Consistency", status: "PASS", score: 100, explanation: "2 = 2 marks." },
      ],
      issues: [],
      suggestedCorrections: [],
      refinementRecommended: false,
    },
    {
      questionId: "demo-q2",
      questionNumber: 2,
      status: "PASS",
      score: 94,
      summary: "Strong Analyze-level semaphore interleaving problem with clear partial credit.",
      criterionResults: [],
      issues: [],
      suggestedCorrections: [],
      refinementRecommended: false,
    },
    {
      questionId: "demo-q3",
      questionNumber: 3,
      status: "PASS",
      score: 93,
      summary: "Effective Evaluate-level comparison of Hash vs B+ Tree indexing.",
      criterionResults: [],
      issues: [],
      suggestedCorrections: [],
      refinementRecommended: false,
    },
    {
      questionId: "demo-q4",
      questionNumber: 4,
      status: "NEEDS_IMPROVEMENT",
      score: 74,
      summary: "Open-ended design rubric lacks explicit bounds for CWND scaling constants.",
      criterionResults: [],
      issues: [
        {
          severity: "moderate",
          criterion: "marking_scheme_completeness",
          issue: "Broad grading bounds on open-ended CWND formula",
          explanation: "Different graders may award inconsistent partial credit for custom AIMD variants without explicit acceptable parameter ranges.",
          suggestedCorrection: "Specify acceptable CWND decrease factor ranges (e.g., 0.5–0.8) and fairness convergence criteria in the marking scheme.",
        },
      ],
      suggestedCorrections: [
        "Add explicit acceptable CWND scaling bounds and partial-credit thresholds to the marking scheme.",
      ],
      refinementRecommended: true,
    },
  ],
};

/**
 * Prompt Experimentation Lab Data (V1, V2, V3)
 * Note: Does not fabricate benchmark scores. Documents architectural prompt designs,
 * engineering trade-offs, and qualitative differences.
 */
export const PROMPT_VERSIONS: PromptVersionData[] = [
  {
    version: "V1",
    title: "Zero-Shot Direct Generation",
    tagline: "Baseline role-based generation prompt",
    purpose:
      "A simple, single-turn instruction that asks the LLM for exam questions with a role assignment and clear JSON output specification. Fast and minimal — suitable for understanding baseline LLM behaviour without schema constraints.",
    architectureTechnique: "Direct Zero-Shot Prompting with role-based system instruction",
    systemPrompt: `You are an examination question generator.
Your role is to create academic exam questions, answers, and marking schemes based on the provided topic, subject, and Bloom's taxonomy level.

For each question, you must provide:
- id: A question identifier (e.g., "Q-1")
- questionNumber: Sequential index (1, 2, ...)
- subject: Course name
- topic: Topic name
- questionType: multiple_choice, short_answer, long_answer, or descriptive
- bloomLevel: The requested Bloom's taxonomy tier
- marks: Total marks allocated to this question
- questionText: The full, clear question stem
- expectedAnswer: The complete expected solution or model answer
- answerKey: Short answer or correct option
- markingScheme: Array of { step, marks, criteria } explaining how marks are awarded
- bloomExplanation: Why the question matches the requested Bloom's taxonomy level
- options: If multiple choice, 4 options { id, text, isCorrect, distractorRationale }

Return valid JSON: { "questions": [ ... ], "promptVersionUsed": "V1" }`,
    userPromptTemplate: `Generate {numQuestions} exam question(s) for the following:
- Subject: {subject}
- Topic: {topic}
- Syllabus Context: {syllabusDetails}
- Bloom's Level: {bloomLevel}
- Question Type: {questionType}
- Marks per question: {marks}

Ensure you output the required JSON with expected answers and marking schemes.`,
    strengths: [
      "Low token overhead and fast response times.",
      "Requires minimal system prompt complexity.",
      "Complete JSON schema still requested — usable output for most cases.",
      "Good baseline for comparing V2/V3 quality improvements.",
    ],
    weaknesses: [
      "No explicit Bloom's taxonomy definitions — model may miscalibrate cognitive depth.",
      "MCQ distractors may lack pedagogical grounding without explicit distractor rules.",
      "Marking scheme steps may not sum exactly to total marks without constraint enforcement.",
      "No self-audit or syllabus boundary enforcement.",
    ],
    evolutionReason:
      "V1 established the core JSON schema contract but lacked Bloom alignment enforcement, syllabus boundary constraints, and distractor quality rules — leading to V2.",
    recommendedFor: "Baseline evaluation and rapid exploratory brainstorming.",
  },
  {
    version: "V2",
    title: "Taxonomy-Constrained Structured Generation",
    tagline: "Structured schema with Bloom definitions, syllabus constraints & distractor rules",
    purpose:
      "Introduces explicit Bloom's Revised Taxonomy definitions for all six cognitive tiers, syllabus boundary enforcement, and mandatory JSON schema output. Distractor rationale fields force the model to justify incorrect MCQ options against known student misconceptions.",
    architectureTechnique: "Role-Based System Instructions + Explicit JSON Schema + Bloom Taxonomy Definitions",
    systemPrompt: `You are a Senior Academic Assessment Designer and Curriculum Specialist.

TASK & CONTEXT:
Your task is to author university-level examination questions that strictly adhere to provided syllabus guidelines and Bloom's Revised Taxonomy.

DETAILED INSTRUCTIONS:
1. Syllabus Constraint: Base questions strictly on the topic and syllabus details provided. Do NOT invent curriculum content the user did not supply.
2. Bloom's Taxonomy Guidance:
   - "remember": Recall of definitions, terminology, formulas.
   - "understand": Explain mechanisms, classify behaviours, interpret diagrams.
   - "apply": Execute algorithms, calculate outputs, solve concrete numerical problems.
   - "analyze": Deconstruct systems, contrast methods, diagnose failure modes.
   - "evaluate": Critique trade-offs, justify architectural choices.
   - "create": Design protocols, synthesize components, specify architectures.
3. Marks: Marking scheme steps must sum exactly to total marks.
4. MCQ: Exactly 4 options (A–D), 1 correct, 3 distractors targeting authentic student misconceptions.`,
    userPromptTemplate: `### ASSESSMENT GENERATION REQUEST (V2 Structured)

- Course / Subject: {subject}
- Target Topic: {topic}
- Syllabus Scope & Objectives: {syllabusDetails}
- Target Cognitive Level: Bloom's {bloomLevel}
- Question Format: {questionType}
- Number of Questions: {numQuestions}
- Marks per Question: {marks}

Important: Respect syllabus scope. Ensure marking scheme marks sum to exactly {marks}.
Output strictly valid JSON conforming to the V2 schema.`,
    strengths: [
      "Substantially higher fidelity to requested Bloom's taxonomy tiers via explicit tier definitions.",
      "Produces valid, type-safe JSON matching application schemas.",
      "Distractor rationales force the model to justify incorrect choices pedagogically.",
      "Explicit syllabus boundary enforcement reduces hallucinated curriculum content.",
    ],
    weaknesses: [
      "Does not perform an internal self-audit of generated questions.",
      "Occasional boundary-case ambiguities may go unflagged.",
      "Marking scheme sometimes lacks explicit partial credit allocations for sub-steps.",
    ],
    evolutionReason:
      "While V2 generated good questions, examiners still had to manually review each question for cognitive depth — motivating the V3 self-audit protocol.",
    recommendedFor: "Intermediate assessments where human examiners perform manual rubric drafting.",
  },
  {
    version: "V3",
    title: "Multi-Stage Pipeline (Generate + Review + Refine)",
    tagline: "Multi-stage architecture: Generation, Independent Review & Targeted Refinement",
    purpose:
      "The full three-stage QBench pipeline. Stage 1 generates with a 5-constraint self-audit prompt; Stage 2 runs an independent Quality Reviewer across 7 criteria; Stage 3 applies targeted refinement only to flagged questions without rewriting passing items.",
    architectureTechnique:
      "Multi-Stage Pipeline: Multi-Constraint Generation -> Independent Quality Audit -> Targeted Refinement",
    systemPrompt: `You are QBench AI, the Lead Psychometric Assessment Auditor and Senior Examination Board Chair.

CORE DIRECTIVES — Five-Constraint Verification Protocol:
- CONSTRAINT A (Cognitive Depth): Action verbs and problem-solving process must strictly activate the requested Bloom's taxonomy tier. Explain in "bloomExplanation".
- CONSTRAINT B (Syllabus Boundary): Ground questions firmly in user-provided syllabus details. Do not hallucinate external modules. State boundary in "syllabusFidelityNote".
- CONSTRAINT C (Mathematical Mark Balance): sum(markingScheme[*].marks) MUST EXACTLY equal the question's total marks.
- CONSTRAINT D (No Repetition): If multiple questions requested, each must assess a distinctly different concept or angle.
- CONSTRAINT E (Distractor Authenticity): For MCQs, distractors must represent known pedagogical pitfalls (off-by-one, inverted inequalities, naive greedy choices).

Internal Self-Audit (perform before emitting output):
- Check 1: Are all required fields present? (id, questionText, bloomLevel, marks, expectedAnswer, markingScheme, bloomExplanation)
- Check 2: Do marking scheme marks add up to total marks?
- Check 3: Is Bloom level genuinely matched, not just surface-label matched?
- Check 4: Does the question strictly honour the supplied syllabus?`,
    userPromptTemplate: `### MULTI-CONSTRAINT ASSESSMENT ENGINEERING (V3 Advanced)

CURRICULUM SPECIFICATIONS:
- Subject: {subject}
- Topic: {topic}
- Syllabus Objectives: {syllabusDetails}
- Target Bloom Tier: {bloomLevel}
- Question Type: {questionType}
- Number of Questions: {numQuestions}
- Marks per Question: {marks}

EXECUTION PIPELINE:
1. Verify syllabus boundaries — only test aspects in the supplied objectives.
2. Calibrate cognitive complexity — ensure genuine {bloomLevel} depth.
3. Formulate unambiguous problem stem with clear parameters and inputs.
4. Construct step-by-step marking scheme where sum(step.marks) == {marks}.
5. If numQuestions > 1, ensure each question explores a distinct sub-concept.
6. Provide explicit "bloomExplanation" confirming cognitive calibration.

Return the finalized assessment as valid JSON conforming strictly to the V3 schema.`,
    strengths: [
      "Five hard constraints eliminate the most common generation failures (mark imbalance, shallow Bloom calibration, repeated questions).",
      "Internal self-audit forces the model to verify completeness before output.",
      "Produces classroom-ready exam questions with granular, partial-credit marking guides.",
      "Explicit syllabusFidelityNote field captures any input limitations honestly.",
    ],
    weaknesses: [
      "Higher token count per question due to the detailed constraint and audit protocol.",
      "Slower generation time — optimised for quality over speed.",
      "Best results with higher-capability reasoning models (Gemini 2.5/3.5 Flash).",
    ],
    evolutionReason:
      "V3 fulfils the full vision of QBench: an end-to-end assessment engineering pipeline with built-in psychometric verification, eliminating the need for manual post-generation review.",
    recommendedFor: "Production University Examinations, Accreditation Audits, and Rigorous Benchmarking.",
  },
];


/**
 * Realistic recent activity log for the Dashboard
 */
export const DEMO_RECENT_ACTIVITY: ActivityLogItem[] = [
  {
    id: "act-1",
    timestamp: "10 mins ago",
    subject: "Operating Systems",
    topic: "Virtual Memory Page Replacement",
    questionType: "Multiple Choice",
    count: 1,
    bloomLevel: "Apply (L3)",
    status: "reviewed",
  },
  {
    id: "act-2",
    timestamp: "45 mins ago",
    subject: "Operating Systems",
    topic: "Process Synchronization & Semaphores",
    questionType: "Short Answer",
    count: 1,
    bloomLevel: "Analyze (L4)",
    status: "reviewed",
  },
  {
    id: "act-3",
    timestamp: "2 hours ago",
    subject: "Database Systems",
    topic: "B+ Tree vs Hash Indexing",
    questionType: "Long Answer",
    count: 1,
    bloomLevel: "Evaluate (L5)",
    status: "reviewed",
  },
  {
    id: "act-4",
    timestamp: "Yesterday",
    subject: "Computer Networks",
    topic: "TCP Congestion Control Adaptation",
    questionType: "Descriptive",
    count: 1,
    bloomLevel: "Create (L6)",
    status: "draft",
  },
];
