import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const analyzeCode = async (codeSnippet, fileName = '') => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env file.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const systemPrompt = `You are an expert AI code reviewer. Analyze code and return ONLY valid JSON with this exact structure:
{
  "bugs": [{"line": <number>, "issue": "<string>", "suggestion": "<string>"}],
  "performance": [{"line": <number>, "issue": "<string>", "suggestion": "<string>"}],
  "clean_code": [{"line": <number>, "issue": "<string>", "suggestion": "<string>"}]
}
Rules:
- "bugs" = potential bugs, logical errors, edge cases
- "performance" = performance bottlenecks, unnecessary ops
- "clean_code" = readability, best practices, maintainability
- "line" = approximate line number in the snippet
- Return empty arrays if no issues found in a category
- Do NOT include any explanation outside the JSON`;

  const userPrompt = `Review this code file (${fileName || 'snippet'}):\n\n${codeSnippet}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const content = response.text;
    console.log('AI Review raw response:', content.substring(0, 200) + '...');
    
    let jsonOutput;
    try {
      jsonOutput = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI review JSON. Raw content:', content);
      throw new Error('AI returned an invalid response format.');
    }

    // Ensure all three keys exist
    return {
      bugs: jsonOutput.bugs || [],
      performance: jsonOutput.performance || [],
      clean_code: jsonOutput.clean_code || []
    };

  } catch (error) {
    console.error('Error generating AI review:', error.message);
    throw new Error(`Code review generation failed: ${error.message}`);
  }
};

export const analyzeRepository = async (files) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Please enable it in .env');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const systemPrompt = `You are a Senior Project Architect. Analyze the provided repository files and return a comprehensive health report.
Return ONLY valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<string>",
  "strengths": ["<string>", ...],
  "weaknesses": ["<string>", ...],
  "recommendations": ["<string>", ...],
  "categories": {
    "architecture": <number 0-100>,
    "security": <number 0-100>,
    "maintainability": <number 0-100>,
    "performance": <number 0-100>
  }
}
Rules:
- Conduct a high-level review of the project's structure, consistency, and patterns.
- "score" is a weighted average of the categories.
- Be critical but constructive.
- Do NOT include any text outside the JSON.`;

  const filesContext = files.map(f => `File: ${f.path}\n---\n${f.content}\n---`).join('\n\n');
  const userPrompt = `Analyze this code repository base:\n\n${filesContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const content = response.text;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse repository analysis JSON. Raw content:', content);
      throw new Error('AI returned an invalid repository analysis format.');
    }

  } catch (error) {
    console.error('Error generating repository AI review:', error.message);
    throw new Error(`Repository analysis failed: ${error.message}`);
  }
};
