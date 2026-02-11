
import { callLLM } from './utils.js';
import { ORCHESTRATOR_PROMPT } from './prompts.js';
import { PlanSchema, BroskiState, TaskPlan, SpecialistOutputs, AgentType } from './types.js';
import { runResearcher, runDesigner, runCoder, runIntegrator, runSafety } from './specialists.js';
import chalk from 'chalk';

export class BroskiOrchestrator {
  private state: BroskiState;

  constructor(userRequest: string) {
    this.state = {
      user_request: userRequest,
      messages: [{ role: 'user', content: userRequest }],
      completed_tasks: [],
      specialist_outputs: {},
      started_at: new Date().toISOString(),
      agent_trace: [],
      retry_count: 0
    };
  }

  async run(): Promise<BroskiState> {
    console.log(chalk.blue('🚀 Broski Orchestrator Starting...'));
    
    // 1. Plan
    this.state.plan = await this.createPlan();
    console.log(chalk.green(`📋 Plan Created: ${this.state.plan.subtasks.length} subtasks`));
    this.state.agent_trace.push('Orchestrator: Plan created');

    // 2. Execute Subtasks (simplified sequential for now, can be parallel)
    for (const task of this.state.plan.subtasks) {
      console.log(chalk.yellow(`⚡ Running Agent: ${task.agent} on "${task.name}"`));
      
      let output = '';
      switch (task.agent) {
        case 'researcher':
          output = await runResearcher(this.state, task);
          break;
        case 'designer':
          const research = this.state.specialist_outputs.researcher || 'No research';
          output = await runDesigner(this.state, task, research);
          break;
        case 'coder':
          const design = this.state.specialist_outputs.designer || 'No design';
          const integrated = this.state.integrated_solution || 'No integration';
          output = await runCoder(this.state, task, design, integrated);
          break;
        // Add other agents here
        default:
          output = `Agent ${task.agent} not implemented yet.`;
      }

      this.state.specialist_outputs[task.agent as AgentType] = output;
      this.state.completed_tasks.push(task.id);
      this.state.agent_trace.push(`${task.agent}: Completed ${task.name}`);
    }

    // 3. Integrate
    console.log(chalk.magenta('🔗 Integrating Results...'));
    this.state.integrated_solution = await runIntegrator(this.state, this.state.specialist_outputs as SpecialistOutputs);
    this.state.agent_trace.push('Integrator: Synthesis complete');

    // 4. Safety Check
    if (this.state.specialist_outputs.coder) {
        console.log(chalk.red('🛡️ Running Safety Check...'));
        this.state.safety_approval = await runSafety(this.state.specialist_outputs.coder);
        this.state.agent_trace.push(`Safety: ${this.state.safety_approval ? 'Approved' : 'Vetoed'}`);
    } else {
        this.state.safety_approval = true; // No code, safe by default
    }

    console.log(chalk.green('✅ Broski Workflow Complete!'));
    return this.state;
  }

  private async createPlan(): Promise<TaskPlan> {
    const prompt = ORCHESTRATOR_PROMPT.replace('{user_request}', this.state.user_request);
    return callLLM(prompt, 'Create plan now.', PlanSchema);
  }
}

export async function runBroski(request: string) {
    const orchestrator = new BroskiOrchestrator(request);
    return orchestrator.run();
}
