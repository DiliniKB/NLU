// src/services/context/contextManager.ts
import { promises as fs } from 'fs';
import path from 'path';

// Define context interface
interface UserContext {
  userId: string;
  conversationHistory: Array<{
    timestamp: Date;
    message: string;
    intent?: any;
    entities?: any;
  }>;
  currentCyclePhase: string | null;
  lastPeriodStart: Date | null;
  recentSymptoms: Array<any>;
}

class ContextManager {
  private activeContexts: Map<string, UserContext>;
  private maxHistoryLength: number;
  private dataPath: string;
  
  constructor() {
    // In-memory storage for active sessions
    this.activeContexts = new Map();
    
    // Maximum context history items to maintain
    this.maxHistoryLength = 5;
    
    // Path for persistence (simple file-based for this tutorial)
    this.dataPath = path.join(__dirname, '../../../data/contexts');
    
    // Ensure data directory exists
    this.initializeDataDirectory();
  }
  
  private async initializeDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create context data directory:', error);
    }
  }
  
  // Get context for user
  async getContext(userId: string): Promise<UserContext> {
    // Check in-memory cache first
    if (this.activeContexts.has(userId)) {
      return this.activeContexts.get(userId)!;
    }
    
    // Try to load from persistence
    try {
      const filePath = path.join(this.dataPath, `${userId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedContext = JSON.parse(fileContent) as UserContext;
      
      // Convert string dates back to Date objects
      if (parsedContext.lastPeriodStart) {
        parsedContext.lastPeriodStart = new Date(parsedContext.lastPeriodStart);
      }
      
      parsedContext.conversationHistory = parsedContext.conversationHistory.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      
      // Store in memory
      this.activeContexts.set(userId, parsedContext);
      return parsedContext;
    } catch (error) {
      // Create new context if not found
      const newContext: UserContext = {
        userId,
        conversationHistory: [],
        currentCyclePhase: null,
        lastPeriodStart: null,
        recentSymptoms: []
      };
      
      this.activeContexts.set(userId, newContext);
      return newContext;
    }
  }
  
  // Update context with new information
  async updateContext(userId: string, newData: any): Promise<UserContext> {
    const currentContext = await this.getContext(userId);
    
    // Update conversation history
    if (newData.message) {
      currentContext.conversationHistory.push({
        timestamp: new Date(),
        message: newData.message,
        intent: newData.intent,
        entities: newData.entities
      });
      
      // Trim history if needed
      if (currentContext.conversationHistory.length > this.maxHistoryLength) {
        currentContext.conversationHistory.shift();
      }
    }
    
    // Update cycle information
    if (newData.cycleData) {
      if (newData.cycleData.periodStart) {
        currentContext.lastPeriodStart = new Date(newData.cycleData.periodStart);
      }
      
      if (newData.cycleData.cyclePhase) {
        currentContext.currentCyclePhase = newData.cycleData.cyclePhase;
      }
    }
    
    // Update symptoms
    if (newData.symptoms && newData.symptoms.length > 0) {
      currentContext.recentSymptoms = [
        ...newData.symptoms,
        ...currentContext.recentSymptoms
      ].slice(0, 10); // Keep only 10 most recent symptoms
    }
    
    // Save updated context
    this.activeContexts.set(userId, currentContext);
    
    // Persist to storage
    await this.persistContext(userId, currentContext);
    
    return currentContext;
  }
  
  // Persist context to storage
  private async persistContext(userId: string, context: UserContext): Promise<void> {
    try {
      const filePath = path.join(this.dataPath, `${userId}.json`);
      await fs.writeFile(filePath, JSON.stringify(context, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to persist context for user ${userId}:`, error);
    }
  }
}

// Export a singleton instance
export const contextManager = new ContextManager();