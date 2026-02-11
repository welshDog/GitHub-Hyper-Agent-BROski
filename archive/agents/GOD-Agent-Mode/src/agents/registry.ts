/**
 * Agent Registry (v2: Zod-validated, type-safe)
 * In-memory + persistence-ready agent storage and retrieval
 */

import type { Agent, AgentID } from "../schemas/agent.schema";
import { AgentSchema, AgentIDSchema, parseAgent } from "../schemas/agent.schema";

interface RegistryStats {
  totalAgents: number;
  byRole: Record<string, number>;
  lastUpdated: string;
}

interface RegistryEvent {
  type: "register" | "update" | "delete";
  agentId: AgentID;
  timestamp: string;
}

export class AgentRegistry {
  private agents: Map<AgentID, Agent> = new Map();
  private events: RegistryEvent[] = [];
  private routingHistory: Map<AgentID, { lastUsed: Date; useCount: number }> =
    new Map();

  /**
   * Register a new agent
   * Validates with Zod before storage
   */
  register(data: unknown): Agent {
    // Validate
    const agent = parseAgent(data);

    // Check duplicate
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} already registered, updating...`);
      this.events.push({
        type: "update",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.events.push({
        type: "register",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
      });
    }

    this.agents.set(agent.id, agent);
    this.routingHistory.set(agent.id, { lastUsed: new Date(), useCount: 0 });
    return agent;
  }

  /**
   * Get agent by ID
   */
  get(id: AgentID): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * List all agents
   */
  list(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * List agents by role
   */
  listByRole(role: string): Agent[] {
    return this.list().filter((a) => a.profile.role === role);
  }

  /**
   * Get least recently used agent
   * For fair load balancing
   */
  getLRU(): Agent | undefined {
    let oldestAgent: Agent | undefined;
    let oldestTime = new Date();

    for (const agent of this.agents.values()) {
      const history = this.routingHistory.get(agent.id);
      if (history && history.lastUsed < oldestTime) {
        oldestTime = history.lastUsed;
        oldestAgent = agent;
      }
    }

    return oldestAgent;
  }

  /**
   * Record agent usage for routing history
   */
  recordUsage(agentId: AgentID, success: boolean = true): void {
    let history = this.routingHistory.get(agentId);
    if (!history) {
      history = { lastUsed: new Date(), useCount: 0 };
    }

    history.lastUsed = new Date();
    history.useCount++;
    this.routingHistory.set(agentId, history);
  }

  /**
   * Delete agent
   */
  delete(id: AgentID): boolean {
    const existed = this.agents.delete(id);
    if (existed) {
      this.events.push({
        type: "delete",
        agentId: id,
        timestamp: new Date().toISOString(),
      });
      this.routingHistory.delete(id);
    }
    return existed;
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
    this.routingHistory.clear();
  }

  /**
   * Get registry statistics
   */
  stats(): RegistryStats {
    const byRole: Record<string, number> = {};

    for (const agent of this.agents.values()) {
      const role = agent.profile.role;
      byRole[role] = (byRole[role] || 0) + 1;
    }

    return {
      totalAgents: this.agents.size,
      byRole,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get registry events (audit trail)
   */
  getEvents(limit?: number): RegistryEvent[] {
    return limit ? this.events.slice(-limit) : this.events;
  }

  /**
   * Size
   */
  size(): number {
    return this.agents.size;
  }
}

// Singleton instance
let registryInstance: AgentRegistry | null = null;

/**
 * Get or create singleton registry
 */
export function getRegistry(): AgentRegistry {
  if (!registryInstance) {
    registryInstance = new AgentRegistry();
  }
  return registryInstance;
}

// Convenience functions
export function registerAgent(data: unknown): Agent {
  return getRegistry().register(data);
}

export function getAgent(id: AgentID): Agent | undefined {
  return getRegistry().get(id);
}

export function listAgents(): Agent[] {
  return getRegistry().list();
}

export function listAgentsByRole(role: string): Agent[] {
  return getRegistry().listByRole(role);
}

export function getLRUAgent(): Agent | undefined {
  return getRegistry().getLRU();
}

export function recordAgentUsage(agentId: AgentID, success?: boolean): void {
  return getRegistry().recordUsage(agentId, success);
}

export function getRegistryStats(): RegistryStats {
  return getRegistry().stats();
}

export function getRegistryEvents(limit?: number): RegistryEvent[] {
  return getRegistry().getEvents(limit);
}
