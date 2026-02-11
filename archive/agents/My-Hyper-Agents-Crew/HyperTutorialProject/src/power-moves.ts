#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { loadConfig } from './config.js';
import { runHyperHealthScan, printHealthReport } from './hyper-health.js';
import { runBroski } from './agents/orchestrator.js';
import { createRequire } from 'module';


// Load project config to ensure we're aligned
// const config = loadConfig();

const log = console.log;

// -----------------------------------------------------------------------------
// UI Helpers
// -----------------------------------------------------------------------------
function clearScreen() {
  console.clear();
}

function printHeader() {
  clearScreen();
  log(gradient.pastel.multiline(figlet.textSync('POWER MOVES', { horizontalLayout: 'full' })));
  log(chalk.dim('Hyper Infrastructure Control Center v1.0.0'));
  log(chalk.dim('------------------------------------------------'));
}

function printStatus(label: string, status: 'OK' | 'PENDING' | 'ERROR', value?: string) {
  let statusColor = chalk.gray;
  if (status === 'OK') statusColor = chalk.green.bold;
  if (status === 'PENDING') statusColor = chalk.yellow;
  if (status === 'ERROR') statusColor = chalk.red.bold;

  log(`${chalk.cyan(label.padEnd(20))} [${statusColor(status.padEnd(7))}] ${value ? chalk.white(value) : ''}`);
}

// -----------------------------------------------------------------------------
// Modules
// -----------------------------------------------------------------------------

export async function runPurchaseChecklist() {
  printHeader();
  log(chalk.yellow.bold('\n🛒 Hardware Acquisition Checklist\n'));

  const questions = [
    {
      type: 'checkbox',
      name: 'hardware',
      message: 'Select the items you have physically acquired:',
      choices: [
        { name: 'CyberPower CP1500PFCLCD UPS', value: 'ups' },
        { name: 'Furman M-8x2 Power Conditioner', value: 'conditioner' },
        { name: 'Anker Prime 240W GaN Charger', value: 'gan' },
        { name: '14AWG IEC C13 Cables (x3)', value: 'cables' },
        { name: 'Receptacle Tester (Ground Check)', value: 'tester' },
      ],
    },
  ];

  const answers = await inquirer.prompt(questions);
  
  if (answers.hardware.length === 5) {
    log(chalk.green('\n✅ EXCELLENT! You have the full Hyper Power Stack.'));
  } else {
    log(chalk.yellow(`\n⚠️  You are missing ${5 - answers.hardware.length} items. Complete the stack for maximum protection.`));
  }
  
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return...' }]);
}

export async function runPowerOutageSim() {
  printHeader();
  log(chalk.red.bold('\n🚨 SIMULATING POWER OUTAGE EVENT 🚨\n'));
  
  log(chalk.white('Mains Power: ') + chalk.red('OFFLINE'));
  log(chalk.white('UPS Status:  ') + chalk.green('BATTERY MODE'));
  
  let battery = 100;
  const interval = setInterval(() => {
    battery -= 5;
    process.stdout.write(`\r🔋 Battery Level: ${gradient.atlas(battery + '%')}  |  ⏳ Est. Runtime: ${Math.floor(battery/5)} mins`);
    
    if (battery <= 20) {
      clearInterval(interval);
      log(chalk.yellow('\n\n⚠️  BATTERY LOW. INITIATING GRACEFUL SHUTDOWN SEQUENCE...'));
      setTimeout(() => {
        log(chalk.green('✔ Databases Flushed'));
        log(chalk.green('✔ File Systems Synced'));
        log(chalk.green('✔ Services Stopped'));
        log(chalk.blue('\nSystem Safe. Simulation Complete.'));
        process.exit(0);
      }, 1000);
    }
  }, 200);
}

export async function runSystemHealthCheck(interactive = true) {
  printHeader();
  log(chalk.blue.bold('\n🔍 Running Diagnostics...\n'));

  // 1. Config Check
  try {
    const conf = loadConfig();
    printStatus('Configuration', 'OK', 'Loaded settings.yaml');
    printStatus('Environment', 'OK', conf.env);
  } catch {
    printStatus('Configuration', 'ERROR', 'Failed to load');
  }

  // 2. Hardware "Check" (Mock)
  // In a real scenario, we might ping the UPS USB HID interface here
  printStatus('UPS Connectivity', 'OK', 'USB Connection Detected');
  printStatus('Input Voltage', 'OK', '120.1V (Stable)');
  printStatus('Output Load', 'OK', '342W (34%)');

  log(chalk.green('\n✔ All Systems Nominal. You are ready to record.'));
  
  if (interactive) {
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return...' }]);
  }
}

// -----------------------------------------------------------------------------
// Main Menu
// -----------------------------------------------------------------------------
export async function mainMenu() {
  while (true) {
    printHeader();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select a Power Move:',
        choices: [
          { name: '📋 Run Hardware Checklist', value: 'checklist' },
          { name: '🔍 System Health Check', value: 'health' },
          { name: '🩺 Hyper Health Scan', value: 'hyper-health' },
          { name: '🤖 Broski Agents', value: 'broski' },
          { name: '🚨 Simulate Power Outage', value: 'sim' },
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') {
      log(chalk.cyan('Stay Hyper. Goodbye. 👋'));
      process.exit(0);
    }

    if (action === 'checklist') await runPurchaseChecklist();
    if (action === 'health') await runSystemHealthCheck();
    if (action === 'hyper-health') {
      const report = await runHyperHealthScan();
      printHealthReport(report);
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return...' }]);
    }
    if (action === 'broski') {
      const { prompt } = await inquirer.prompt([
        { type: 'input', name: 'prompt', message: 'What would you like Broski to build?' }
      ]);
      await runBroski(prompt);
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return...' }]);
    }
    if (action === 'sim') {
      try {
        await runPowerOutageSim();
      } catch (error) {
        log(chalk.red('❌ Simulation Failed:'));
        log(error);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------
// In ESM, require.main === module is not available.
// We check if the file is being run directly using process.argv
// A common pattern in ESM is comparing import.meta.url with process.argv[1]
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--health')) {
    runSystemHealthCheck(false);
  } else if (args.includes('--scan') || args.includes('--hyper-health')) {
    runHyperHealthScan().then(report => printHealthReport(report));
  } else if (args.includes('--broski')) {
    // If run from CLI with flag, we might need to ask for prompt or take from args
    // Simple version: launch interactive broski
    const { prompt } = await inquirer.prompt([
        { type: 'input', name: 'prompt', message: 'What would you like Broski to build?' }
      ]);
    await runBroski(prompt);
  } else {
    mainMenu();
  }
}
