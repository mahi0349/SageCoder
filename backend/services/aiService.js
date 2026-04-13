import { GoogleGenAI, Type } from '@google/genai';

// Uses GEMINI_API_KEY from environment variables automatically
const ai = new GoogleGenAI({});

export const analyzeCode = async (codeSnippet, fileName = '') => {
  const prompt = `You are an expert AI code reviewer. Your task is to perform an in-depth code review on the following snippet.
  Give specific feedback categorized into "bugs", "performance", and "clean_code" (which includes readability, best practices, maintainability).
  For each issue, point out the line number (best guess relative to snippet or exact if provided) and a concrete suggestion.
  
  Code (File: ${fileName}):
  \`\`\`
  ${codeSnippet}
  \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bugs: {
              type: Type.ARRAY,
              description: 'Potential bugs, logical errors, or edge cases.',
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER, description: 'Line number of the issue' },
                  issue: { type: Type.STRING, description: 'Nature of the bug' },
                  suggestion: { type: Type.STRING, description: 'How to fix the bug' }
                }
              }
            },
            performance: {
              type: Type.ARRAY,
              description: 'Performance bottlenecks, unnecessary operations.',
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER, description: 'Line number' },
                  issue: { type: Type.STRING, description: 'Nature of the performance issue' },
                  suggestion: { type: Type.STRING, description: 'How to optimize' }
                }
              }
            },
            clean_code: {
              type: Type.ARRAY,
              description: 'Clean code, readability, style, and best practice issues.',
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER, description: 'Line number' },
                  issue: { type: Type.STRING, description: 'Nature of the code smell' },
                  suggestion: { type: Type.STRING, description: 'How to refactor' }
                }
              }
            }
          }
        }
      }
    });

    const outputText = response.text;
    const jsonOutput = JSON.parse(outputText);
    return jsonOutput;

  } catch (error) {
    console.error('Error generating AI review:', error);
    throw new Error('Code review generation failed.');
  }
};
