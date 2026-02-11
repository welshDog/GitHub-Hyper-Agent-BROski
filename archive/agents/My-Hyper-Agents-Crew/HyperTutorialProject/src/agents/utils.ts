
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const modelName = process.env.LLM_MODEL || 'gpt-4o-mini';

let client: OpenAI | null = null;
if (apiKey) {
  client = new OpenAI({ apiKey });
}

export async function callLLM(
  systemPrompt: string, 
  userPrompt: string, 
  jsonSchema?: z.ZodType<any>
): Promise<any> {
  if (!client) {
    console.warn('⚠️ No OPENAI_API_KEY found. Using mock response.');
    return mockResponse(systemPrompt);
  }

  try {
    const params: any = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    };

    if (jsonSchema) {
        params.response_format = zodResponseFormat(jsonSchema, "response");
    }

    const completion = await client.chat.completions.create(params);
    const content = completion.choices[0].message.content;

    if (jsonSchema && content) {
      return JSON.parse(content);
    }
    return content || '';
  } catch (error) {
    console.error('❌ LLM Call Failed:', error);
    throw error;
  }
}

function mockResponse(systemPrompt: string): any {
  if (systemPrompt.includes('Orchestrator')) {
    return {
      subtasks: [
        { id: 1, name: 'Mock Research Task', agent: 'researcher', parallel: true },
        { id: 2, name: 'Mock Design Task', agent: 'designer', parallel: false }
      ],
      success_criteria: 'Mock success'
    };
  }
  return 'Mock output from agent. Please set OPENAI_API_KEY to get real results.';
}
