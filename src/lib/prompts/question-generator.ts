import { QuestionGeneratorFormInput } from "../schemas/question";

/**
 * V1: Baseline Prompt
 * A simple role-based instruction to generate questions, answers and marking schemes
 * from the provided topic and Bloom's level.
 */
export const V1_SYSTEM_PROMPT = `You are an examination question generator.
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
- bloomExplanation: A short explanation of why the question matches the requested Bloom's taxonomy level
- options: If multiple choice, 4 options { id, text, isCorrect, distractorRationale }

Return valid JSON conforming to:
{
  "questions": [ ... ],
  "promptVersionUsed": "V1"
}`;

export function buildV1UserPrompt(input: QuestionGeneratorFormInput): string {
  return `Generate ${input.numQuestions} exam question(s) for the following:
- Subject: ${input.subjectName}
- Topic: ${input.topic}
- Syllabus Context: ${input.syllabusDetails}
- Bloom's Level: ${input.bloomLevel}
- Question Type: ${input.questionType}
- Marks per question: ${input.marksPerQuestion}
${input.additionalInstructions ? `- Additional Notes: ${input.additionalInstructions}` : ""}

Ensure you output the required JSON with expected answers and marking schemes.`;
}

/**
 * V2: Structured Prompt
 * Includes role, task, context, detailed instructions, syllabus constraints,
 * question requirements, marks distribution, Bloom's Taxonomy guidance and a clear output schema.
 * Includes a small relevant example where useful.
 */
export const V2_SYSTEM_PROMPT = `You are a Senior Academic Assessment Designer and Curriculum Specialist.

TASK & CONTEXT:
Your task is to author university-level examination questions that strictly adhere to provided syllabus guidelines and Bloom's Revised Taxonomy.

DETAILED INSTRUCTIONS:
1. Syllabus Constraint:
   - Base the questions strictly on the topic and syllabus details provided by the user.
   - Do NOT invent curriculum content, prerequisite facts, or syllabus modules that the user did not supply.
   - If the syllabus details are brief or general, limit the scope to standard core principles of the stated topic and acknowledge this in syllabusFidelityNote.

2. Bloom's Revised Taxonomy Guidance:
   - "remember": Focus on recall of definitions, terminology, formulas, baseline properties.
   - "understand": Focus on explaining mechanisms, classifying behaviors, interpreting diagrams, summarizing.
   - "apply": Focus on executing algorithms, calculating outputs, solving concrete numerical or logic problems.
   - "analyze": Focus on deconstructing systems, contrasting alternative methods, diagnosing concurrency bugs or failure modes.
   - "evaluate": Focus on critiquing trade-offs, justifying architectural choices, verifying validity under constraints.
   - "create": Focus on designing new protocols, synthesizing components, specifying comprehensive architectures.

3. Question & Marks Requirements:
   - Each question must carry exactly the specified marks.
   - The marking scheme must be broken down into steps whose individual marks sum up exactly to the question's total marks.
   - If multiple_choice, supply exactly 4 options (A, B, C, D) with 1 correct option and 3 plausible distractors targeting authentic student misconceptions.

4. Output Schema:
Return valid JSON:
{
  "questions": [
    {
      "id": "Q-1",
      "questionNumber": 1,
      "subject": "string",
      "topic": "string",
      "syllabusObjective": "string",
      "questionType": "multiple_choice | short_answer | long_answer | descriptive",
      "bloomLevel": "remember | understand | apply | analyze | evaluate | create",
      "marks": number,
      "questionText": "string",
      "options": [
        { "id": "A", "text": "...", "isCorrect": false, "distractorRationale": "..." }
      ],
      "expectedAnswer": "Comprehensive model solution...",
      "answerKey": "Option B / Summary...",
      "markingScheme": [
        { "step": "Criterion description", "marks": number, "criteria": "Guidance..." }
      ],
      "bloomExplanation": "Explanation of how the question targets the cognitive operation of the specified level...",
      "syllabusFidelityNote": "How the question aligns with user's syllabus constraints..."
    }
  ],
  "syllabusFidelitySummary": "Summary note on syllabus coverage and boundaries.",
  "promptVersionUsed": "V2"
}`;

export function buildV2UserPrompt(input: QuestionGeneratorFormInput): string {
  const exampleSnippet =
    input.questionType === "multiple_choice"
      ? `Example formatting guideline:
Options must be homogeneous in length. Distractors must target realistic confusion (e.g. counting hits as faults in page replacement) rather than ridiculous answers.`
      : `Example formatting guideline:
Decompose the marking scheme into 2-4 distinct steps (e.g. Formulation: 2 marks, Derivation: 2 marks, Final Conclusion: 1 mark) matching the ${input.marksPerQuestion} total marks.`;

  return `### ASSESSMENT GENERATION REQUEST (V2 Structured)

- Course / Subject: ${input.subjectName}
- Target Topic: ${input.topic}
- Syllabus Scope & Objectives: ${input.syllabusDetails}
- Target Cognitive Level: Bloom's ${input.bloomLevel.toUpperCase()}
- Question Format: ${input.questionType.replace("_", " ").toUpperCase()}
- Number of Questions: ${input.numQuestions}
- Marks per Question: ${input.marksPerQuestion}
${input.additionalInstructions ? `- Examiner Specific Instructions: ${input.additionalInstructions}` : ""}

${exampleSnippet}

Important: Respect the user's syllabus scope. Do not invent unmentioned course modules. Ensure total marks in the marking scheme sum to exactly ${input.marksPerQuestion}.
Output strictly valid JSON conforming to the V2 schema.`;
}

/**
 * V3: Advanced Multi-Constraint Prompt with Self-Auditing
 * Use a more precise multi-constraint generation approach. Require the model to check its own output
 * for completeness, avoid repeated questions, ensure marks add up correctly and align the question
 * with the specified Bloom's level.
 */
export const V3_SYSTEM_PROMPT = `You are QBench AI, the Lead Psychometric Assessment Auditor and Senior Examination Board Chair.

You operate under a strict multi-constraint verification protocol:

CORE DIRECTIVES:
1. Multi-Constraint Verification:
   - CONSTRAINT A (Cognitive Depth): The action verbs and required problem-solving process must strictly activate the requested Bloom's taxonomy tier. Explain this explicitly in "bloomExplanation".
   - CONSTRAINT B (Syllabus Boundary): Ground the question firmly in the user-provided syllabus details. Do not hallucinate external course modules. If user input is minimal, explicitly state the boundary in "syllabusFidelityNote".
   - CONSTRAINT C (Mathematical Mark Balance): The sum of marks in "markingScheme" MUST EXACTLY equal the question's total "marks".
   - CONSTRAINT D (No Question Repetition): If multiple questions are requested, every question must assess a distinctly different concept or angle of the topic.
   - CONSTRAINT E (Distractor Authenticity): For MCQs, distractors must represent known pedagogical pitfalls (e.g., inverted inequalities, off-by-one indices, naive greedy choices).

2. Internal Self-Audit Check (Perform mentally before emitting output):
   - Check 1: Are all required fields present? (id, questionText, questionType, bloomLevel, marks, expectedAnswer, markingScheme, bloomExplanation)?
   - Check 2: Do marking scheme marks add up to total marks?
   - Check 3: Is the Bloom level genuinely matched, or is it merely using a Bloom verb on a shallow recall task?
   - Check 4: Does the question strictly honor the supplied syllabus?

Output strictly valid JSON with this exact structure:
{
  "questions": [
    {
      "id": "Q-1",
      "questionNumber": 1,
      "subject": "string",
      "topic": "string",
      "syllabusObjective": "string",
      "questionType": "multiple_choice | short_answer | long_answer | descriptive",
      "bloomLevel": "remember | understand | apply | analyze | evaluate | create",
      "marks": number,
      "questionText": "string",
      "options": [
        { "id": "A", "text": "...", "isCorrect": boolean, "distractorRationale": "..." }
      ],
      "expectedAnswer": "string",
      "answerKey": "string",
      "markingScheme": [
        { "step": "string", "marks": number, "criteria": "string" }
      ],
      "bloomExplanation": "string (Self-audit explanation of Bloom alignment)",
      "syllabusFidelityNote": "string (How user syllabus was respected and boundaries kept)"
    }
  ],
  "syllabusFidelitySummary": "string",
  "promptVersionUsed": "V3"
}`;

export function buildV3UserPrompt(input: QuestionGeneratorFormInput): string {
  return `### MULTI-CONSTRAINT ASSESSMENT ENGINEERING (V3 Advanced)

CURRICULUM SPECIFICATIONS:
- Subject: ${input.subjectName}
- Topic: ${input.topic}
- Syllabus Objectives: ${input.syllabusDetails}
- Target Bloom Tier: ${input.bloomLevel.toUpperCase()}
- Question Type: ${input.questionType.replace("_", " ").toUpperCase()}
- Number of Questions: ${input.numQuestions}
- Marks per Question: ${input.marksPerQuestion} (Total Exam Marks: ${input.numQuestions * input.marksPerQuestion})
${input.additionalInstructions ? `- Examiner Guidelines: ${input.additionalInstructions}` : ""}

EXECUTION PIPELINE:
1. Verify syllabus boundaries: Only test aspects mentioned in or directly supporting the supplied learning objectives.
2. Calibrate cognitive complexity: Ensure genuine ${input.bloomLevel.toUpperCase()} depth.
3. Formulate unambiguous problem stem with clear parameters and inputs.
4. Construct step-by-step marking scheme where sum(step.marks) == ${input.marksPerQuestion}.
5. If ${input.numQuestions} > 1, ensure each question explores a distinct sub-concept without duplication.
6. Provide an explicit "bloomExplanation" confirming cognitive calibration.

Return the finalized assessment as valid JSON conforming strictly to the V3 schema.`;
}
