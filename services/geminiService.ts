import { Skill, AssessmentMethod, BloomLevel } from '../types';

let ai: any = null;

async function getAI() {
  if (!ai) {
    const { GoogleGenAI } = await import('@google/genai');
    // Vite replaces process.env.GEMINI_API_KEY at build time via the define config
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in environment variables.');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export interface TaskSection {
  title: string;
  content: string;
  audience: 'student' | 'lecturer';
}

export interface RubricRow {
  criterion: string;
  excellent: string;
  good: string;
  needsImprovement: string;
}

async function callGemini(prompt: string, filePayload?: { data: string; mimeType: string }): Promise<string> {
  const parts: any[] = [];

  if (filePayload) {
    parts.push({
      inlineData: {
        data: filePayload.data,
        mimeType: filePayload.mimeType,
      },
    });
  }

  parts.push({ text: prompt });

  const client = await getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts }],
  });

  return response.text ?? '';
}

function parseJSON<T>(text: string): T {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

export async function analyzeBloomTaxonomy(
  assignmentText: string,
  filePayload?: { data: string; mimeType: string }
): Promise<{ currentSkills: Skill[]; suggestedSkills: Skill[] }> {
  const prompt = `You are a pedagogical AI assistant specializing in Bloom's Taxonomy analysis for higher education.

Analyze the following assignment and identify the skills it currently assesses, as well as suggest additional higher-order skills that could enhance the assessment.

Assignment text:
"""
${assignmentText}
"""

For each skill, identify its Bloom's Taxonomy level using these Hebrew labels exactly:
- "זכירה" (Remember)
- "הבנה" (Understand)  
- "יישום" (Apply)
- "אנליזה" (Analyze)
- "הערכה" (Evaluate)
- "יצירה" (Create)

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "currentSkills": [
    { "name": "skill name in Hebrew", "bloomLevel": "one of the Hebrew levels above", "reasoning": "brief explanation in Hebrew" }
  ],
  "suggestedSkills": [
    { "name": "skill name in Hebrew", "bloomLevel": "one of the Hebrew levels above", "reasoning": "brief explanation in Hebrew" }
  ]
}

Identify 3-6 current skills and suggest 2-4 additional higher-order skills. All text must be in Hebrew.`;

  const result = await callGemini(prompt, filePayload);
  return parseJSON(result);
}

export async function generateAssessmentStrategies(
  skills: Skill[],
  numStudents: number
): Promise<AssessmentMethod[]> {
  const skillList = skills.map((s) => `- ${s.name} (${s.bloomLevel})`).join('\n');

  const prompt = `You are a pedagogical AI assistant that designs assessment strategies for higher education in the AI era.

Given the following skills to assess and class size, group the skills logically and suggest assessment methods for each group.

Skills:
${skillList}

Number of students: ${numStudents}

Consider scalability for the given class size. Group related skills that can be assessed together.

For each group, suggest:
- A primary assessment method
- Whether it's "FaceToFace" (controlled environment) or "Submission" (open environment)
- A pedagogical rationale in Hebrew

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {
    "id": "group-1",
    "skills": ["skill name 1", "skill name 2"],
    "method": "assessment method name in Hebrew",
    "type": "FaceToFace" or "Submission",
    "explanation": "pedagogical rationale in Hebrew"
  }
]

Create 2-4 groups. All text must be in Hebrew except for the type field.`;

  const result = await callGemini(prompt);
  return parseJSON(result);
}

export async function rephraseAssignment(
  originalText: string,
  skills: Skill[],
  strategies: AssessmentMethod[],
  numStudents: number
): Promise<{ sections: TaskSection[]; practicalTips: string }> {
  const skillList = skills.map((s) => `- ${s.name} (${s.bloomLevel})`).join('\n');
  const strategyList = strategies
    .map(
      (s, i) =>
        `Group ${i + 1}: Skills [${s.skills.join(', ')}] - Method: ${s.userSelectedMethod || s.method} (${s.userSelectedCategory || s.type})`
    )
    .join('\n');

  const prompt = `You are a pedagogical AI assistant that redesigns academic assignments for the AI era.

Original assignment:
"""
${originalText}
"""

Target skills:
${skillList}

Assessment strategy:
${strategyList}

Number of students: ${numStudents}

Redesign this assignment according to the selected skills and assessment strategies. Create clear sections for students and guidance for lecturers.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "sections": [
    {
      "title": "section title in Hebrew",
      "content": "detailed content in Hebrew",
      "audience": "student" or "lecturer"
    }
  ],
  "practicalTips": "summary of assessment strategies and practical implementation tips in Hebrew"
}

Create 3-6 sections. Include both student-facing instructions and lecturer guidance. All text must be in Hebrew except for the audience field.`;

  const result = await callGemini(prompt);
  return parseJSON(result);
}

export async function askFollowUpQuestion(
  context: {
    originalText: string;
    revisedTask: TaskSection[];
    strategies: AssessmentMethod[];
  },
  question: string,
  chatHistory: { role: 'user' | 'model'; text: string }[]
): Promise<string> {
  const historyText = chatHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  const sectionsText = context.revisedTask
    .map((s) => `[${s.title}]: ${s.content}`)
    .join('\n\n');

  const prompt = `You are a pedagogical AI assistant helping refine an academic assignment.

Original assignment:
"""
${context.originalText}
"""

Current revised assignment sections:
${sectionsText}

Previous conversation:
${historyText}

New question from the lecturer:
${question}

Provide a helpful, concise answer in Hebrew. Focus on pedagogical best practices and practical implementation advice.`;

  return await callGemini(prompt);
}

export async function generateRubric(
  sections: TaskSection[]
): Promise<RubricRow[]> {
  const sectionsText = sections
    .filter((s) => s.audience === 'student')
    .map((s) => `[${s.title}]: ${s.content}`)
    .join('\n\n');

  const prompt = `You are a pedagogical AI assistant that creates assessment rubrics.

Based on the following assignment sections, create a detailed assessment rubric.

Assignment sections:
${sectionsText}

Create a rubric with 4-6 criteria. For each criterion, define three performance levels.

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {
    "criterion": "criterion name in Hebrew",
    "excellent": "description of excellent performance in Hebrew",
    "good": "description of good/passing performance in Hebrew",
    "needsImprovement": "description of needs improvement in Hebrew"
  }
]

All text must be in Hebrew.`;

  const result = await callGemini(prompt);
  return parseJSON(result);
}
