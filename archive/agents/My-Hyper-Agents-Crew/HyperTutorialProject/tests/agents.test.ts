
import { runBroski, BroskiOrchestrator } from '../src/agents/orchestrator.js';
import { ResearcherAgent, DesignerAgent } from '../src/agents/specialists.js';

describe('Broski Agents System', () => {
  it('should initialize orchestrator with user request', () => {
    const orchestrator = new BroskiOrchestrator('Build a rocket');
    expect(orchestrator).toBeDefined();
  });

  it('should run the workflow (mock mode)', async () => {
    // This relies on the internal mock in utils.ts when no API key is present
    const result = await runBroski('Build a rocket');
    
    expect(result).toBeDefined();
    expect(result.user_request).toBe('Build a rocket');
    expect(result.plan).toBeDefined();
    expect(result.plan?.subtasks.length).toBeGreaterThan(0);
    expect(result.completed_tasks.length).toBeGreaterThan(0);
    expect(result.agent_trace).toContain('Orchestrator: Plan created');
    expect(result.safety_approval).toBe(true);
  });

  // v1.1 Upgrade Tests
  describe('v1.1 Class Architecture', () => {
    it('should instantiate ResearcherAgent with correct metadata', () => {
      const researcher = new ResearcherAgent();
      expect(researcher.name).toBe('Researcher');
      expect(researcher.version).toBe('1.1.0');
      expect(researcher.type).toBe('researcher');
    });

    it('should instantiate DesignerAgent with correct metadata', () => {
      const designer = new DesignerAgent();
      expect(designer.name).toBe('Designer');
      expect(designer.version).toBe('1.1.0');
    });
  });
});
