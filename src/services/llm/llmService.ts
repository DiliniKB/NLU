import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define system prompt for intent classification
const INTENT_SYSTEM_PROMPT = `You are an AI assistant specializing in women's health and menstrual cycle tracking. 

Your task is to identify the user's intent and extract relevant entities from their message.

IMPORTANT: Respond ONLY with a JSON object following this exact format:
{
  "intent": {
    "primary": "one of [cycle_tracking, symptom_logging, health_query, pattern_analysis, system_command]",
    "subtype": "specific intent within the primary category",
    "confidence": 0.0-1.0
  },
  "entities": {
    "temporal": {
      "dates": [],
      "cycle_day": null,
      "cycle_phase": null,
      "duration": null
    },
    "symptoms": [],
    "intensity": null,
    "mood": null,
    "body_area": null,
    "context_factors": []
  }
}

If an entity is not present, include it with null or empty array.
Do not include any explanatory text outside of the JSON structure.`;

// Simple cache for LLM responses
const responseCache = new Map<string, any>();

// Process text with LLM to classify intent and extract entities
export async function processWithLLM(userInput: string, context?: any): Promise<any> {
  // Create cache key from input and context
  // todo: check the usage
  const cacheKey = `${userInput}:${JSON.stringify(context || {})}`;
  
  // Check cache first
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  try {
    // Prepare messages for OpenAI
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: INTENT_SYSTEM_PROMPT },
      { role: 'user', content: userInput }
    ];
    
    // Add context if available
    if (context && context.conversationHistory && context.conversationHistory.length > 0) {
      // Add a condensed version of recent history for context
      const historyContent = context.conversationHistory
        .slice(-3) // Get last 3 exchanges
        .map((exchange: any) => `User: ${exchange.message}`)
        .join('\n');
      
      messages.push({ 
        role: 'system', 
        content: `Previous conversation context:\n${historyContent}` 
      });
    }
    
    // Make API call
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });
    
    // Extract and parse JSON response
    const responseContent = response.choices[0]?.message?.content || '{}';
    const parsedResponse = JSON.parse(responseContent);
    
    // Cache result
    responseCache.set(cacheKey, parsedResponse);
    
    return parsedResponse;
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Failed to process with LLM: ${error.message}`);
  }
}