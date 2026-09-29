import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distIndexPath = path.join(packageRoot, 'dist', 'index.js');

// Regression coverage for #4651: nextThoughtNeeded must stay in the advertised
// `required` array, and string coercion must keep accepting "True"/"FALSE"
// while rejecting anything else. Runs against the built server so it checks
// the schema the SDK actually emits, not the zod object.
describe('sequentialthinking input schema', () => {
  let client: Client;

  beforeAll(async () => {
    if (!existsSync(distIndexPath)) {
      throw new Error('Built server is missing. Run npm test to build it before testing.');
    }

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [distIndexPath],
      cwd: packageRoot,
      stderr: 'pipe',
    });
    client = new Client({ name: 'input-schema-test', version: '0.0.0' });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
  });

  it('advertises nextThoughtNeeded as required', async () => {
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'sequentialthinking');
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toEqual(
      expect.arrayContaining(['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'])
    );
  });

  it('advertises positive integer constraints and numeric string support', async () => {
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'sequentialthinking');
    expect(tool).toBeDefined();
    for (const field of ['thoughtNumber', 'totalThoughts', 'revisesThought', 'branchFromThought']) {
      expect(tool?.inputSchema.properties?.[field]).toMatchObject({
        anyOf: expect.arrayContaining([
          expect.objectContaining({ type: 'integer', minimum: 1 }),
          expect.objectContaining({ type: 'string' }),
        ]),
      });
    }
  });

  it('rejects a call that omits nextThoughtNeeded', async () => {
    const result = await client.callTool({
      name: 'sequentialthinking',
      arguments: { thought: 't', thoughtNumber: 1, totalThoughts: 1 },
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toMatch(/nextThoughtNeeded/);
  });

  it.each(['True', 'FALSE', 'true', 'false'])('accepts the string %s', async (value) => {
    const result = await client.callTool({
      name: 'sequentialthinking',
      arguments: { thought: 't', nextThoughtNeeded: value, thoughtNumber: 1, totalThoughts: 1 },
    });
    expect(result.isError).toBeFalsy();
  });

  it.each(['yes', '', '1'])('rejects the string %j', async (value) => {
    const result = await client.callTool({
      name: 'sequentialthinking',
      arguments: { thought: 't', nextThoughtNeeded: value, thoughtNumber: 1, totalThoughts: 1 },
    });
    expect(result.isError).toBe(true);
  });

  describe.each(['thoughtNumber', 'totalThoughts', 'revisesThought', 'branchFromThought'])(
    '%s numeric input',
    (field) => {
      it.each([2, '2', ' 2 '])('accepts %j', async (value) => {
        const result = await client.callTool({
          name: 'sequentialthinking',
          arguments: {
            thought: 'Numeric input example',
            nextThoughtNeeded: true,
            thoughtNumber: 1,
            totalThoughts: 3,
            [field]: value,
          },
        });
        expect(result.isError).toBeFalsy();
        if (field === 'thoughtNumber' || field === 'totalThoughts') {
          expect(result.structuredContent?.[field]).toBe(2);
        }
      });

      it.each([true, false, null, [2], {}, '', ' ', 'two', 0, -1, 1.5, '0', '-1', '1.5', 'Infinity'])(
        'rejects %j',
        async (value) => {
          const result = await client.callTool({
            name: 'sequentialthinking',
            arguments: {
              thought: 'Invalid numeric input example',
              nextThoughtNeeded: true,
              thoughtNumber: 1,
              totalThoughts: 3,
              [field]: value,
            },
          });
          expect(result.isError).toBe(true);
          expect(JSON.stringify(result.content)).toContain(field);
        },
      );
    },
  );

  it.each(['thoughtNumber', 'totalThoughts'])('rejects missing %s', async (field) => {
    const args: Record<string, unknown> = {
      thought: 'Missing numeric input example',
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 3,
    };
    delete args[field];
    const result = await client.callTool({ name: 'sequentialthinking', arguments: args });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain(field);
  });

  it('does not append invalid calls to history or create branches', async () => {
    const args = { thought: 'Valid step', nextThoughtNeeded: true, thoughtNumber: 1, totalThoughts: 3 };
    const before = await client.callTool({ name: 'sequentialthinking', arguments: args });
    const historyLength = before.structuredContent?.thoughtHistoryLength;
    expect(typeof historyLength).toBe('number');

    const invalid = await client.callTool({
      name: 'sequentialthinking',
      arguments: { ...args, branchFromThought: true, branchId: 'invalid-branch' },
    });
    expect(invalid.isError).toBe(true);

    const after = await client.callTool({ name: 'sequentialthinking', arguments: args });
    expect(after.isError).toBeFalsy();
    expect(after.structuredContent?.thoughtHistoryLength).toBe(Number(historyLength) + 1);
    expect(after.structuredContent?.branches).not.toContain('invalid-branch');
  });
});
