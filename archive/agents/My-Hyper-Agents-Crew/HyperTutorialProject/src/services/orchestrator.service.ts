
import { BroskiState, TaskPlan, AgentType, SpecialistOutputs, PlanSchema } from '../agents/types.js';
import { runResearcher, runDesigner, runCoder, runIntegrator, runSafety } from '../agents/specialists.js';
import { ORCHESTRATOR_PROMPT } from '../agents/prompts.js';
import { callLLM } from '../agents/utils.js';
import { db } from '../db/index.js';
import { workflows, tasks } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { enqueueWorkflowJob } from './queue.service.js';

/**
 * Service class for orchestrating Broski agents.
 * Handles the lifecycle of a workflow: planning, execution, and integration.
 */
export class BroskiOrchestratorService {
  /**
   * Enqueues a workflow for async execution.
   * @param workflowId - The ID of the workflow to enqueue.
   * @returns The job ID.
   */
  async enqueueWorkflow(workflowId: number): Promise<string> {
    return enqueueWorkflowJob(workflowId);
  }

  /**
   * Creates a new workflow in the database.
   * @param userRequest - The user's prompt.
   * @returns The created workflow ID.
   */
  async createWorkflow(userRequest: string): Promise<number> {
    const result = await db.insert(workflows).values({
      userRequest,
      status: 'queued',
    }).returning({ insertedId: workflows.id });
    
    return result[0].insertedId;
  }

  /**
   * Retrieves a workflow by ID.
   * @param id - The workflow ID.
   * @returns The workflow record or undefined if not found.
   */
  async getWorkflow(id: number) {
    const result = await db.select().from(workflows).where(eq(workflows.id, id));
    return result[0];
  }

  /**
   * Executes the orchestration logic for a given workflow.
   * NOTE: This should ideally be called by a background worker (BullMQ).
   * For Milestone 2.2, we simulate async execution.
   * @param workflowId - The ID of the workflow to execute.
   */
  async executeWorkflow(workflowId: number): Promise<void> {
    try {
      // 1. Update status to processing
      await db.update(workflows).set({ status: 'processing' }).where(eq(workflows.id, workflowId));
      
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      const state: BroskiState = {
        user_request: workflow.userRequest,
        messages: [{ role: 'user', content: workflow.userRequest }],
        completed_tasks: [],
        specialist_outputs: {},
        started_at: new Date().toISOString(),
        agent_trace: [],
        retry_count: 0
      };

      // 2. Create Plan
      const plan = await this.createPlan(state.user_request);
      state.plan = plan;
      
      // 3. Execute Subtasks
      for (const task of plan.subtasks) {
        let output = '';
        
        // Log task start in DB (optional enhancement)
        await db.insert(tasks).values({
            workflowId,
            agentType: task.agent,
            name: task.name,
            status: 'pending'
        });

        switch (task.agent) {
          case 'researcher':
            output = await runResearcher(state, task);
            break;
          case 'designer':
            const research = state.specialist_outputs.researcher || 'No research';
            output = await runDesigner(state, task, research);
            break;
          case 'coder':
            const design = state.specialist_outputs.designer || 'No design';
            const integrated = state.integrated_solution || 'No integration';
            output = await runCoder(state, task, design, integrated);
            break;
          default:
            output = `Agent ${task.agent} not implemented yet.`;
        }

        state.specialist_outputs[task.agent as AgentType] = output;
        state.completed_tasks.push(task.id);
      }

      // 4. Integrate
      state.integrated_solution = await runIntegrator(state, state.specialist_outputs as SpecialistOutputs);

      // 5. Safety Check
      if (state.specialist_outputs.coder) {
          state.safety_approval = await runSafety(state.specialist_outputs.coder);
      } else {
          state.safety_approval = true;
      }

      // 6. Complete
      await db.update(workflows).set({ 
          status: state.safety_approval ? 'completed' : 'failed' // Simple fail if unsafe for now
      }).where(eq(workflows.id, workflowId));

    } catch (error) {
      console.error('Workflow failed:', error);
      await db.update(workflows).set({ status: 'failed' }).where(eq(workflows.id, workflowId));
    }
  }

  private async createPlan(userRequest: string): Promise<TaskPlan> {
    const prompt = ORCHESTRATOR_PROMPT.replace('{user_request}', userRequest);
    return callLLM(prompt, 'Create plan now.', PlanSchema);
  }
}
