/**
 * Episode Manager (v2: Zod-validated, persistence-ready)
 * Manages turn-based execution history for reproducible flows
 */

import type { Episode, EpisodeTurn, EpisodeID, EpisodeStatus, TurnID } from "../schemas/episode.schema";
import {
  EpisodeSchema,
  EpisodeTurnSchema,
  brandEpisodeID,
  brandTurnID,
} from "../schemas/episode.schema";
import type { AgentID } from "../schemas/agent.schema";

interface EpisodeManagerConfig {
  persistenceEnabled?: boolean;
  maxEpisodesInMemory?: number;
  autoCompressAfterTurns?: number;
}

interface TurnSnapshot {
  episodeId: EpisodeID;
  turnNumber: number;
  summary: string;
  success: boolean;
  timestamp: string;
}

/**
 * Episode Manager: manages turn-based execution history
 */
export class EpisodeManager {
  private episodes: Map<EpisodeID, Episode> = new Map();
  private currentEpisode: Episode | null = null;
  private turnSnapshots: TurnSnapshot[] = [];
  private config: Required<EpisodeManagerConfig>;

  constructor(config: EpisodeManagerConfig = {}) {
    this.config = {
      persistenceEnabled: config.persistenceEnabled ?? false,
      maxEpisodesInMemory: config.maxEpisodesInMemory ?? 100,
      autoCompressAfterTurns: config.autoCompressAfterTurns ?? 50,
    };
  }

  /**
   * Create a new episode
   */
  createEpisode(
    flowId: string,
    ownerAgentId?: AgentID
  ): Episode {
    const now = new Date().toISOString();
    const id = brandEpisodeID(`ep_${Date.now()}_${Math.random().toString(36).slice(2)}`);

    const episode: Episode = {
      id,
      flowId,
      ownerAgentId,
      createdAt: now,
      updatedAt: now,
      turns: [],
      status: "running",
      totalDurationMs: 0,
      metadata: {
        initialized: true,
      },
    };

    // Validate with Zod
    const validated = EpisodeSchema.parse(episode);
    this.episodes.set(id, validated);
    this.currentEpisode = validated;

    console.log(`🌟 Episode created: ${id} (flow: ${flowId})`);
    return validated;
  }

  /**
   * Add a turn to the current episode
   * Validates and records execution
   */
  addTurn(
    episodeId: EpisodeID,
    turnData: Omit<EpisodeTurn, "id" | "sequenceNumber">
  ): EpisodeTurn {
    const episode = this.episodes.get(episodeId);
    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    if (episode.status !== "running") {
      throw new Error(`Cannot add turn to ${episode.status} episode`);
    }

    const now = new Date().toISOString();
    const sequenceNumber = episode.turns.length + 1;
    const turnId = brandTurnID(
      `turn_${episodeId}_${sequenceNumber}`
    );

    const turn: EpisodeTurn = {
      ...turnData,
      id: turnId,
      sequenceNumber,
      createdAt: now,
    };

    // Validate with Zod
    const validated = EpisodeTurnSchema.parse(turn);
    episode.turns.push(validated);

    // Update episode metadata
    episode.updatedAt = now;
    episode.totalDurationMs += validated.durationMs;

    // Create snapshot for debugging
    this.turnSnapshots.push({
      episodeId,
      turnNumber: sequenceNumber,
      summary: `${validated.nodeIds.join(", ")} → ${validated.output ? "success" : "pending"}`,
      success: !validated.error,
      timestamp: now,
    });

    // Auto-compress if needed
    if (
      this.config.autoCompressAfterTurns &&
      episode.turns.length % this.config.autoCompressAfterTurns === 0
    ) {
      this.compressEpisode(episodeId);
    }

    return validated;
  }

  /**
   * Get episode by ID
   */
  getEpisode(id: EpisodeID): Episode | undefined {
    return this.episodes.get(id);
  }

  /**
   * Get current episode
   */
  getCurrentEpisode(): Episode | null {
    return this.currentEpisode;
  }

  /**
   * Get episode history for a flow
   */
  getEpisodeHistory(flowId: string): Episode[] {
    return Array.from(this.episodes.values()).filter((e) => e.flowId === flowId);
  }

  /**
   * Get turns from episode
   */
  getEpisodeTurns(episodeId: EpisodeID, limit?: number): EpisodeTurn[] {
    const episode = this.episodes.get(episodeId);
    if (!episode) return [];

    const turns = episode.turns;
    return limit ? turns.slice(-limit) : turns;
  }

  /**
   * Complete episode with status
   */
  completeEpisode(
    id: EpisodeID,
    status: "completed" | "failed",
    reason?: string
  ): void {
    const episode = this.episodes.get(id);
    if (episode) {
      episode.status = status;
      episode.updatedAt = new Date().toISOString();
      episode.completedAt = new Date().toISOString();

      if (reason) {
        episode.metadata = {
          ...episode.metadata,
          completionReason: reason,
        };
      }

      console.log(`🎉 Episode ${id} ${status}`);
    }
  }

  /**
   * Pause episode
   */
  pauseEpisode(id: EpisodeID): void {
    const episode = this.episodes.get(id);
    if (episode) {
      episode.status = "paused";
      episode.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Resume episode
   */
  resumeEpisode(id: EpisodeID): void {
    const episode = this.episodes.get(id);
    if (episode && episode.status === "paused") {
      episode.status = "running";
      episode.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Compress episode (remove verbose metadata, keep summary)
   */
  private compressEpisode(id: EpisodeID): void {
    const episode = this.episodes.get(id);
    if (!episode) return;

    // Keep only first and last 10 turns + error turns
    if (episode.turns.length > 20) {
      const errorTurns = episode.turns.filter((t) => t.error);
      const kept = [
        ...episode.turns.slice(0, 10),
        ...errorTurns,
        ...episode.turns.slice(-10),
      ];

      // Deduplicate while preserving order
      const seen = new Set<TurnID>();
      episode.turns = kept.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    }
  }

  /**
   * Get manager statistics
   */
  stats(): {
    totalEpisodes: number;
    activeEpisodes: number;
    totalTurns: number;
    snapshots: number;
  } {
    let totalTurns = 0;
    let activeEpisodes = 0;

    for (const episode of this.episodes.values()) {
      totalTurns += episode.turns.length;
      if (episode.status === "running") activeEpisodes++;
    }

    return {
      totalEpisodes: this.episodes.size,
      activeEpisodes,
      totalTurns,
      snapshots: this.turnSnapshots.length,
    };
  }

  /**
   * Get turn snapshots (for UI timeline)
   */
  getSnapshots(limit?: number): TurnSnapshot[] {
    return limit
      ? this.turnSnapshots.slice(-limit)
      : this.turnSnapshots;
  }

  /**
   * Clear all episodes
   */
  clear(): void {
    this.episodes.clear();
    this.turnSnapshots = [];
    this.currentEpisode = null;
  }
}

// Singleton instance
let managerInstance: EpisodeManager | null = null;

/**
 * Get or create singleton manager
 */
export function getEpisodeManager(
  config?: EpisodeManagerConfig
): EpisodeManager {
  if (!managerInstance) {
    managerInstance = new EpisodeManager(config);
  }
  return managerInstance;
}

// Convenience functions
export function createEpisode(
  flowId: string,
  ownerAgentId?: AgentID
): Episode {
  return getEpisodeManager().createEpisode(flowId, ownerAgentId);
}

export function recordTurn(
  episodeId: EpisodeID,
  turnData: Omit<EpisodeTurn, "id" | "sequenceNumber">
): EpisodeTurn {
  return getEpisodeManager().addTurn(episodeId, turnData);
}

export function getEpisode(id: EpisodeID): Episode | undefined {
  return getEpisodeManager().getEpisode(id);
}

export function getEpisodeStats(): ReturnType<EpisodeManager["stats"]> {
  return getEpisodeManager().stats();
}
