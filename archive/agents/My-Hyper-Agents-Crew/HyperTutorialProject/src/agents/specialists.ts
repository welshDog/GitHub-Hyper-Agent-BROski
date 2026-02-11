
import { BaseAgent } from './base.js';
import { BroskiState, Subtask, SpecialistOutputs } from './types.js';
import { 
  RESEARCHER_PROMPT, 
  DESIGNER_PROMPT, 
  CODER_PROMPT, 
  INTEGRATOR_PROMPT, 
  SAFETY_PROMPT 
} from './prompts.js';

// --- v1.1 Agent Classes ---

export class ResearcherAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Researcher',
      type: 'researcher',
      version: '1.1.0',
      description: 'Gathers information and context.'
    });
  }

  async execute(context: { state: BroskiState; subtask: Subtask }): Promise<string> {
    const prompt = RESEARCHER_PROMPT
      .replace('{task_description}', context.subtask.name)
      .replace('{user_request}', context.state.user_request);
    
    return this.callLLM(prompt, 'Conduct research now.');
  }
}

export class DesignerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Designer',
      type: 'designer',
      version: '1.1.0',
      description: 'Creates UX/UI specifications.'
    });
  }

  async execute(context: { state: BroskiState; subtask: Subtask; researchOutput: string }): Promise<string> {
    const prompt = DESIGNER_PROMPT
      .replace('{task_description}', context.subtask.name)
      .replace('{user_request}', context.state.user_request)
      .replace('{research_output}', context.researchOutput);

    return this.callLLM(prompt, 'Create design now.');
  }
}

export class CoderAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Coder',
      type: 'coder',
      version: '1.1.0',
      description: 'Writes and tests code.'
    });
  }

  async execute(context: { state: BroskiState; subtask: Subtask; designOutput: string; integratedPlan: string }): Promise<string> {
    const prompt = CODER_PROMPT
      .replace('{task_description}', context.subtask.name)
      .replace('{design_output}', context.designOutput)
      .replace('{integrated_solution}', context.integratedPlan);

    return this.callLLM(prompt, 'Write code now.');
  }
}

export class IntegratorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Integrator',
      type: 'integrator',
      version: '1.1.0',
      description: 'Synthesizes outputs into a unified solution.'
    });
  }

  async execute(context: { state: BroskiState; outputs: SpecialistOutputs }): Promise<string> {
    const outputsText = Object.entries(context.outputs)
      .map(([agent, output]) => `**${agent.toUpperCase()}:**\n${output}`)
      .join('\n\n');

    const prompt = INTEGRATOR_PROMPT.replace('{specialist_outputs}', outputsText);
    return this.callLLM(prompt, 'Integrate now.');
  }
}

export class SafetyAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Safety',
      type: 'safety',
      version: '1.1.0',
      description: 'Ensures safety and compliance.'
    });
  }

  async execute(context: { codeOutput: string }): Promise<boolean> {
    const prompt = SAFETY_PROMPT.replace('{code_output}', context.codeOutput);
    const response = await this.callLLM(prompt, 'Review now.');
    return typeof response === 'string' && response.includes('APPROVE');
  }
}

// --- Backward Compatibility Wrappers (v1.0 API) ---

const researcher = new ResearcherAgent();
const designer = new DesignerAgent();
const coder = new CoderAgent();
const integrator = new IntegratorAgent();
const safety = new SafetyAgent();

export async function runResearcher(state: BroskiState, subtask: Subtask): Promise<string> {
  return researcher.execute({ state, subtask });
}

export async function runDesigner(state: BroskiState, subtask: Subtask, researchOutput: string): Promise<string> {
  return designer.execute({ state, subtask, researchOutput });
}

export async function runCoder(state: BroskiState, subtask: Subtask, designOutput: string, integratedPlan: string): Promise<string> {
  return coder.execute({ state, subtask, designOutput, integratedPlan });
}

export async function runIntegrator(state: BroskiState, outputs: SpecialistOutputs): Promise<string> {
  return integrator.execute({ state, outputs });
}

export async function runSafety(codeOutput: string): Promise<boolean> {
  return safety.execute({ codeOutput });
}
