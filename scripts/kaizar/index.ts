#!/usr/bin/env node
import { Command } from 'commander';
import { registerAddEnvCommand } from './commands/add/env';
import { registerFormatEnvCommand } from './commands/format/env';

const command = new Command();

command
  .name('kaizar')
  .description('CLI tool for managing environment variables')
  .version('1.0.0');

// Register all commands
registerAddEnvCommand(command);
registerFormatEnvCommand(command);

command.parse(process.argv);
