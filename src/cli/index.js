import { Command } from 'commander';
import chalk from 'chalk';
import { transcribeCommand } from './commands/transcribe.js';
import { configCommand } from './commands/config.js';
import { uiCommand } from './commands/ui.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

export function run(argv) {
  const program = new Command();

  program
    .name('transcribio')
    .description(chalk.cyan('🎙️ AI-powered audio transcription using Gemini'))
    .version(packageJson.version);

  // Default command: transcribe a file
  program
    .argument('[file]', 'Audio file to transcribe')
    .option('-s, --speakers', 'Enable speaker detection', true)
    .option('--no-speakers', 'Disable speaker detection')
    .option('-t, --timestamps', 'Include timestamps', true)
    .option('--no-timestamps', 'Disable timestamps')
    .option('-l, --language <code>', 'Audio language code', 'auto')
    .option('-o, --output <format>', 'Output format (txt, srt, vtt, json)', 'txt')
    .option('-f, --file <path>', 'Save output to file')
    .option('--translate <lang>', 'Translate to language')
    .option('--model <name>', 'Model to use (lite, flash, flash-3, pro)', 'lite')
    .action(transcribeCommand);

  // Config command
  program
    .command('config')
    .description('Manage API key and settings')
    .option('--set-key', 'Set Gemini API key interactively')
    .option('--key <value>', 'Set API key directly')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset all configuration')
    .action(configCommand);

  // UI command
  program
    .command('ui')
    .description('Launch web interface')
    .option('-p, --port <number>', 'Port number', '3456')
    .action(uiCommand);

  program.parse(argv);
}
