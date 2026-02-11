
import { z } from 'zod';

// Define Agent Types
export type AgentType = 
  | 'orchestrator'
  | 'researcher' 
  | 'designer' 
  | 'coder' 
  | 'essence_seeker' 
  | 'devils_advocate' 
  | 'integrator' 
  | 'safety';

// Define Subtask Structure
export interface Subtask {
  id: number;
  name: string;
  agent: AgentType;
  parallel: boolean;
  dependencies?: number[];
  status: 'pending' | 'completed' | 'failed';
  output?: string;
}

// Define Task Plan
export interface TaskPlan {
  subtasks: Subtask[];
  success_criteria: string;
}

// Define Specialist Outputs
export type SpecialistOutputs = Record<AgentType, string>;

// Define Central State (The Brain)
export interface BroskiState {
  user_request: string;
  user_id?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  plan?: TaskPlan;
  completed_tasks: number[];
  specialist_outputs: Partial<SpecialistOutputs>;
  integrated_solution?: string;
  safety_approval?: boolean;
  final_output?: string;
  started_at: string;
  agent_trace: string[];
  retry_count: number;
  error?: string;
}

// Zod Schemas for LLM Structured Output
export const SubtaskSchema = z.object({
  id: z.number(),
  name: z.string(),
  agent: z.enum(['researcher', 'designer', 'coder', 'essence_seeker', 'devils_advocate', 'integrator', 'safety']),
  parallel: z.boolean(),
});

export const PlanSchema = z.object({
  subtasks: z.array(SubtaskSchema),
  success_criteria: z.string(),
});
