import chalk from 'chalk';
import inquirer from 'inquirer';
import { configStore } from '../../config/store.js';

export async function configCommand(options) {
  // Set key interactively
  if (options.setKey) {
    console.log('');
    console.log(chalk.cyan('  🔑 Gemini API Key Setup'));
    console.log(chalk.gray('  ─────────────────────────────────'));
    console.log('');
    console.log('  Get your free API key at:');
    console.log('  ' + chalk.underline.blue('https://aistudio.google.com/apikey'));
    console.log('');

    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Gemini API key:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 10) {
            return 'Please enter a valid API key';
          }
          return true;
        }
      }
    ]);

    configStore.setApiKey(answers.apiKey);
    console.log('');
    console.log(chalk.green('  ✔ API key saved successfully!'));
    console.log('');
    console.log('  You can now transcribe audio:');
    console.log('  ' + chalk.cyan('transcribio your-audio.mp3'));
    console.log('');
    return;
  }

  // Set key directly
  if (options.key) {
    configStore.setApiKey(options.key);
    console.log(chalk.green('\n  ✔ API key saved successfully!\n'));
    return;
  }

  // Show configuration
  if (options.show) {
    const hasKey = configStore.hasApiKey();

    console.log('');
    console.log(chalk.cyan('  ⚙️  Configuration'));
    console.log(chalk.gray('  ─────────────────────────────────'));
    console.log(`  API Key: ${hasKey ? chalk.green('Configured ✔') : chalk.red('Not set ✖')}`);
    console.log(`  Default Model: ${chalk.white(configStore.get('defaultModel') || 'lite')}`);
    console.log(`  Default Format: ${chalk.white(configStore.get('defaultFormat') || 'txt')}`);
    console.log(`  Config Path: ${chalk.gray(configStore.getPath())}`);
    console.log('');
    return;
  }

  // Reset configuration
  if (options.reset) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset all settings?',
        default: false
      }
    ]);

    if (answers.confirm) {
      configStore.reset();
      console.log(chalk.green('\n  ✔ Configuration reset successfully!\n'));
    } else {
      console.log(chalk.gray('\n  Cancelled.\n'));
    }
    return;
  }

  // No option specified, show help
  console.log('');
  console.log(chalk.cyan('  ⚙️  Config Commands'));
  console.log(chalk.gray('  ─────────────────────────────────'));
  console.log('');
  console.log('  transcribio config --set-key    Set API key (interactive)');
  console.log('  transcribio config --show       Show current settings');
  console.log('  transcribio config --reset      Reset all settings');
  console.log('');
}
