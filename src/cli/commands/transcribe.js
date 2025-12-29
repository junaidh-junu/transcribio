import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { GeminiService } from '../../core/gemini.js';
import { configStore } from '../../config/store.js';
import { exportTranscript } from '../../exporters/index.js';

export async function transcribeCommand(file, options) {
  // If no file provided, show help
  if (!file) {
    console.log(chalk.yellow('\n  Usage: transcribio <audio-file> [options]\n'));
    console.log('  Example: transcribio interview.mp3 --output srt\n');
    console.log('  Run "transcribio --help" for all options.\n');
    return;
  }

  // Check API key
  if (!configStore.hasApiKey()) {
    console.log(chalk.red('\n  ✖ No API key configured.\n'));
    console.log('  Run: ' + chalk.cyan('transcribio config --set-key') + '\n');
    console.log('  Get your free key at: ' + chalk.underline('https://aistudio.google.com/apikey') + '\n');
    process.exit(1);
  }

  // Validate file exists
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`\n  ✖ File not found: ${file}\n`));
    process.exit(1);
  }

  // Validate file extension
  const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.aiff', '.webm'];
  const ext = path.extname(filePath).toLowerCase();
  if (!validExtensions.includes(ext)) {
    console.log(chalk.red(`\n  ✖ Unsupported format: ${ext}`));
    console.log('  Supported: ' + validExtensions.join(', ') + '\n');
    process.exit(1);
  }

  // Get file info
  const stats = fs.statSync(filePath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const fileName = path.basename(filePath);

  console.log('');
  console.log(chalk.cyan('  🎙️  Transcribio'));
  console.log(chalk.gray('  ─────────────────────────────────'));
  console.log(`  File: ${chalk.white(fileName)}`);
  console.log(`  Size: ${chalk.white(fileSizeMB + ' MB')}`);
  const modelDisplayNames = {
    'lite': 'Gemini 2.5 Flash Lite',
    'flash-lite': 'Gemini 2.5 Flash Lite',
    'flash': 'Gemini 2.5 Flash',
    'flash-3': 'Gemini 3 Flash',
    'flash3': 'Gemini 3 Flash',
    'pro': 'Gemini Pro'
  };
  const modelDisplay = modelDisplayNames[options.model] || 'Gemini 2.5 Flash Lite';
  console.log(`  Model: ${chalk.white(modelDisplay)}`);
  console.log('');

  const spinner = ora({
    text: 'Uploading and processing...',
    spinner: 'dots'
  }).start();

  try {
    console.log(chalk.gray('[CLI] Initializing Gemini service...'));
    const gemini = new GeminiService();
    console.log(chalk.gray('[CLI] Service initialized, starting transcription...'));

    const startTime = Date.now();
    const result = await gemini.transcribe(filePath, {
      speakers: options.speakers,
      timestamps: options.timestamps,
      language: options.language,
      translateTo: options.translate,
      model: options.model
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    spinner.succeed(chalk.green(`Transcription complete! (${elapsed}s)`));
    console.log(chalk.gray(`[CLI] Total time: ${elapsed}s`));

    // Display metadata
    if (result.language) {
      console.log(chalk.gray(`  Language: ${result.language}`));
    }
    if (result.duration) {
      console.log(chalk.gray(`  Duration: ${result.duration}`));
    }
    console.log('');

    // Export in requested format
    const output = exportTranscript(result, options.output);

    // Save to file or print to console
    if (options.file) {
      const outputPath = path.resolve(options.file);
      fs.writeFileSync(outputPath, output);
      console.log(chalk.green(`  ✔ Saved to: ${outputPath}`));
    } else {
      console.log(chalk.gray('  ─────────────────────────────────'));
      console.log('');
      console.log(output);
      console.log('');
      console.log(chalk.gray('  ─────────────────────────────────'));
      console.log(chalk.gray('  Tip: Use -f <filename> to save to file'));
    }

    // Show summary if available
    if (result.summary) {
      console.log('');
      console.log(chalk.cyan('  Summary:'));
      console.log(chalk.white('  ' + result.summary));
    }

    console.log('');

  } catch (error) {
    spinner.fail(chalk.red('Transcription failed'));
    console.log('');
    console.log(chalk.gray(`[CLI] Error occurred: ${error.message}`));
    
    // Handle rate limit/quota errors with helpful guidance
    if (error.message.includes('quota') || error.message.includes('Rate limit')) {
      console.log(chalk.red('  ⚠️  Rate Limit / Quota Exceeded'));
      console.log('');
      console.log(chalk.yellow('  ' + error.message.split('\n')[0]));
      console.log('');
      console.log('  To check your usage and billing:');
      console.log('  ' + chalk.cyan('https://ai.dev/usage?tab=rate-limit'));
      console.log('');
      console.log('  For more information about rate limits:');
      console.log('  ' + chalk.cyan('https://ai.google.dev/gemini-api/docs/rate-limits'));
      console.log('');
      if (error.originalError?.message?.includes('retry')) {
        const retryMatch = error.originalError.message.match(/Please retry in ([\d.]+)s/i);
        if (retryMatch) {
          console.log(chalk.gray(`  The API suggests retrying after ${retryMatch[1]} seconds.`));
        }
      }
    } else {
      console.log(chalk.red('  Error: ' + error.message));

      if (error.message.includes('API key')) {
        console.log('');
        console.log('  Check your API key: ' + chalk.cyan('transcribio config --show'));
      }
    }

    console.log('');
    process.exit(1);
  }
}
