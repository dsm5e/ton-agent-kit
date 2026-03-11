#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config/config';
import { createTonApi } from './ton/api';
import { createTonClient } from './ton/client';
import { createServer } from './server';

async function main() {
  const config = loadConfig();
  const api = createTonApi(config);
  const tonClient = createTonClient(config);
  const server = createServer(api, tonClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('ton-agent-kit MCP server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
