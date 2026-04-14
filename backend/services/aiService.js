import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const analyzeCode = async (codeSnippet, fileName = '') => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env file. Get one free at https://console.groq.com/keys');
  }

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
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('AI Review raw response:', content.substring(0, 200) + '...');
    const jsonOutput = JSON.parse(content);

    // Ensure all three keys exist
    return {
      bugs: jsonOutput.bugs || [],
      performance: jsonOutput.performance || [],
      clean_code: jsonOutput.clean_code || []
    };

  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message || JSON.stringify(error);
    console.error('Error generating AI review:', errMsg);

    if (errMsg.includes('429') || errMsg.includes('rate_limit')) {
      throw new Error('AI API rate limit reached. Please wait a moment and try again.');
    }
    if (errMsg.includes('401') || errMsg.includes('invalid_api_key')) {
      throw new Error('Invalid AI API key. Please check your GROQ_API_KEY in .env');
    }

    throw new Error(`Code review generation failed: ${errMsg}`);
  }
};
