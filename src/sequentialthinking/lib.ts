import chalk from 'chalk';

export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

export class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches = new Map<string, ThoughtData[]>();
  private disableThoughtLogging: boolean;

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  public processThought(input: ThoughtData): { content: Array<{ type: "text"; text: string }>; isError?: boolean } {
    try {
      // Validation happens at the tool registration layer via Zod
      // Adjust totalThoughts if thoughtNumber exceeds it
      const thoughtData = { ...input };
      if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
        thoughtData.totalThoughts = thoughtData.thoughtNumber;
      }

      const branchId = thoughtData.branchFromThought && thoughtData.branchId
        ? thoughtData.branchId
        : undefined;
      const branchThoughts = branchId
        ? this.branches.get(branchId) ?? []
        : undefined;
      const branchIds = [...this.branches.keys()];
      if (branchId && !this.branches.has(branchId)) {
        branchIds.push(branchId);
      }

      const result = {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            thoughtNumber: thoughtData.thoughtNumber,
            totalThoughts: thoughtData.totalThoughts,
            nextThoughtNeeded: thoughtData.nextThoughtNeeded,
            branches: branchIds,
            thoughtHistoryLength: this.thoughtHistory.length + 1
          }, null, 2)
        }]
      };

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(thoughtData);
        console.error(formattedThought);
      }

      // Commit state only after formatting, serialization, and logging succeed.
      this.thoughtHistory.push(thoughtData);
      if (branchId && branchThoughts) {
        branchThoughts.push(thoughtData);
        this.branches.set(branchId, branchThoughts);
      }

      return result;
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}
