import {
  AssessmentQuestion,
  QuestionGeneratorFormInput,
  QuestionReviewVerdict,
} from "../schemas/question";

/**
 * Stage 3: Targeted Question Refinement Prompt
 * Separate AI call from generation and review. Fixes ONLY the specific issues
 * identified by the reviewer while preserving topic, objective, Bloom's level,
 * marks, and question type.
 */
export const QUESTION_REFINER_SYSTEM_PROMPT = `You are QBench Question Refiner — a surgical academic assessment editor.
You receive:
1. The original user requirements.
2. One or more generated exam questions (with expected answers and marking schemes).
3. The independent Quality Reviewer's feedback (issues, explanations, and suggested corrections).

YOUR STRICT MANDATE:
- Fix ONLY the specific issues identified by the reviewer.
- PRESERVE the original topic and syllabus learning objective.
- MAINTAIN the requested Bloom's Taxonomy level.
- PRESERVE the exact marks allocation and question type.
- Improve clarity, factual accuracy, answer-key correctness, and marking-scheme completeness/arithmetic consistency.
- Do NOT rewrite a question unnecessarily if it already passes or if a section has no issues. Keep what already works well intact.
- Ensure sum(markingScheme[*].marks) equals the question's total marks exactly.

Return strictly valid JSON matching this exact structure:
{
  "results": [
    {
      "originalQuestionId": "string (must match input question id)",
      "refinedQuestion": {
        "id": "string (preserve original id)",
        "questionNumber": number,
        "subject": "string",
        "topic": "string",
        "syllabusObjective": "string",
        "questionType": "multiple_choice | short_answer | long_answer | descriptive | problem_solving | conceptual",
        "bloomLevel": "remember | understand | apply | analyze | evaluate | create",
        "marks": number,
        "questionText": "Refined question stem",
        "options": [
          { "id": "A", "text": "...", "isCorrect": boolean, "distractorRationale": "..." }
        ],
        "expectedAnswer": "Corrected/verified expected answer",
        "answerKey": "Corrected/verified short answer key",
        "markingScheme": [
          { "step": "Criterion", "marks": number, "criteria": "Scoring guidance" }
        ],
        "bloomExplanation": "Updated Bloom alignment explanation",
        "syllabusFidelityNote": "Updated syllabus alignment note"
      },
      "changesSummary": "Concise summary of the exact fixes made",
      "issuesAddressed": ["Short description of each reviewer issue fixed"]
    }
  ]
}`;

export function buildQuestionRefinementUserPrompt(
  requirements: QuestionGeneratorFormInput,
  items: Array<{ question: AssessmentQuestion; review: QuestionReviewVerdict }>
): string {
  const payload = items.map(({ question, review }) => ({
    question: {
      id: question.id,
      questionNumber: question.questionNumber,
      subject: question.subject,
      topic: question.topic,
      syllabusObjective: question.syllabusObjective,
      questionType: question.questionType,
      bloomLevel: question.bloomLevel,
      marks: question.marks,
      questionText: question.questionText,
      options: question.options,
      expectedAnswer: question.expectedAnswer,
      answerKey: question.answerKey,
      markingScheme: question.markingScheme,
      bloomExplanation: question.bloomExplanation,
      syllabusFidelityNote: question.syllabusFidelityNote,
    },
    reviewerFeedback: {
      status: review.status,
      score: review.score,
      summary: review.summary,
      issues: review.issues,
      suggestedCorrections: review.suggestedCorrections,
    },
  }));

  return `### STAGE 3 TARGETED QUESTION REFINEMENT REQUEST

ORIGINAL USER REQUIREMENTS (MUST BE PRESERVED):
- Subject: ${requirements.subjectName}
- Topic: ${requirements.topic}
- Syllabus Details / Learning Objectives: ${requirements.syllabusDetails}
- Target Bloom's Level: ${requirements.bloomLevel}
- Question Type: ${requirements.questionType}
- Marks per Question: ${requirements.marksPerQuestion}
${requirements.additionalInstructions ? `- Additional Instructions: ${requirements.additionalInstructions}` : ""}

QUESTIONS AND REVIEWER FEEDBACK TO REFINE:
${JSON.stringify(payload, null, 2)}

Fix only the specific issues flagged in reviewerFeedback. Preserve the topic, learning objective, Bloom's level, question type, and marks (${requirements.marksPerQuestion}). Return valid JSON.`;
}
