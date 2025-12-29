import chalk from 'chalk';
import open from 'open';
import { startServer } from '../../web/server.js';
import { configStore } from '../../config/store.js';

export async function uiCommand(options) {
  const port = parseInt(options.port) || 3456;

  // Check API key
  if (!configStore.hasApiKey()) {
    console.log(chalk.red('\n  ✖ No API key configured.\n'));
    console.log('  Run: ' + chalk.cyan('transcribio config --set-key') + '\n');
    process.exit(1);
  }

  console.log('');
  console.log(chalk.cyan('  🌐 Starting Transcribio Web UI...'));
  console.log('');

  try {
    await startServer(port);

    const url = `http://localhost:${port}`;

    console.log(chalk.green(`  ✔ Server running at: ${chalk.underline(url)}`));
    console.log('');
    console.log(chalk.gray('  Press Ctrl+C to stop the server'));
    console.log('');

    // Open browser automatically
    await open(url);

  } catch (error) {
    console.log(chalk.red(`  ✖ Failed to start server: ${error.message}`));
    process.exit(1);
  }
}
