
import { callLLM } from './utils.js';
import { AgentType } from './types.js';

export interface AgentConfig {
  name: string;
  type: AgentType;
  version: string;
  description: string;
}

export abstract class BaseAgent {
  public readonly name: string;
  public readonly type: AgentType;
  public readonly version: string;
  public readonly description: string;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.type = config.type;
    this.version = config.version;
    this.description = config.description;
  }

  abstract execute(context: any): Promise<string | boolean>;

  protected async callLLM(prompt: string, context: string): Promise<any> {
    return callLLM(prompt, context);
  }
}
