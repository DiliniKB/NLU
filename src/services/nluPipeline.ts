// src/services/nluPipeline.ts
import { processWithLLM } from './llm/llmService';
import { processEntities, determineCyclePhase } from './domain/healthDomainProcessor';
import { contextManager } from './context/contextManager';

export async function processInput(userId: string, message: string) {
  // Get user context
  const context = await contextManager.getContext(userId);
  
  // Process with LLM to get initial intent and entities
  const llmResult = await processWithLLM(message, context);
  
  // Extract core components
  const { intent, entities: rawEntities } = llmResult;
  
  // Process and validate entities with domain-specific logic
  const processedEntities = processEntities(rawEntities);
  
  // Extract cycle data
  let cycleData = null;
  if (processedEntities.temporal && processedEntities.temporal.dates && processedEntities.temporal.dates.length > 0) {
    // Check if this appears to be a period tracking update
    if (intent.primary === 'cycle_tracking' && 
        (intent.subtype === 'period_start_logging' || intent.subtype === 'period_tracking')) {
      cycleData = {
        periodStart: processedEntities.temporal.dates[0],
        cyclePhase: ''
      };
    }
  }
  
  // Determine cycle phase if we have a last period start date
  if (context.lastPeriodStart) {
    const today = new Date();
    const daysSincePeriodStart = Math.floor(
      (today.getTime() - context.lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const cyclePhase = determineCyclePhase(daysSincePeriodStart);
    
    // Add to cycle data
    if (!cycleData) cycleData = {};
    cycleData.cyclePhase = cyclePhase;
    
    // Add phase context to processed entities if not already present
    if (!processedEntities.temporal.cycle_phase) {
      processedEntities.temporal.cycle_phase = cyclePhase;
    }
  }
  
  // Update context with new information
  await contextManager.updateContext(userId, {
    message,
    intent,
    entities: processedEntities,
    cycleData,
    symptoms: processedEntities.symptoms || []
  });
  
  // Return processed result
  return {
    intent,
    entities: processedEntities,
    cycleData,
    contextAwareness: {
      currentCyclePhase: context.currentCyclePhase,
      lastPeriodStart: context.lastPeriodStart
    }
  };
}