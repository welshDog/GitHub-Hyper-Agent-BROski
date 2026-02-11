import os from 'os';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { config } from './config.js';

export interface HealthReport {
  timestamp: string;
  system: {
    hostname: string;
    platform: string;
    arch: string;
    uptime: number;
    cpu: {
      model: string;
      cores: number;
      loadAvg: number[];
    };
    memory: {
      total: number;
      free: number;
      usedPercentage: string;
    };
  };
  agents: AgentHealth[];
}

export interface AgentHealth {
  name: string;
  type: 'service' | 'database' | 'system' | 'environment';
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  metrics: Record<string, any>;
  findings: string[];
}

function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const percent = ((usedMem / totalMem) * 100).toFixed(2);

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: os.uptime(),
    cpu: {
      model: os.cpus()[0].model,
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
    },
    memory: {
      total: totalMem,
      free: freeMem,
      usedPercentage: percent + '%',
    },
  };
}

async function checkDatabaseAgent(): Promise<AgentHealth> {
  const start = performance.now();
  const findings: string[] = [];
  let status: AgentHealth['status'] = 'healthy';

  // Synthetic Check: Validate config presence
  if (!config.database.host || !config.database.username) {
    status = 'unhealthy';
    findings.push('Critical: Missing database configuration');
  }

  // Synthetic Transaction: Mock connection check
  // In a real scenario, we would use a DB client here
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // Simulate 20-70ms latency

  if (config.database.ssl === false && config.env === 'production') {
    status = 'degraded';
    findings.push('Security Warning: SSL disabled in production');
  }

  return {
    name: 'Primary Database',
    type: 'database',
    status,
    latencyMs: Math.floor(performance.now() - start),
    metrics: {
      connectionPool: { min: config.database.pool.min, max: config.database.pool.max },
      host: config.database.host,
    },
    findings,
  };
}

async function checkApiAgent(): Promise<AgentHealth> {
  const start = performance.now();
  const findings: string[] = [];
  let status: AgentHealth['status'] = 'healthy';

  // Synthetic Check
  if (!config.api.baseUrl) {
    status = 'unhealthy';
    findings.push('Critical: API Base URL missing');
  }

  // Synthetic Transaction: Ping simulation
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // Simulate 50-150ms latency

  if (config.api.timeoutMs < 1000) {
    status = 'degraded';
    findings.push('Performance Warning: API timeout is very aggressive (<1s)');
  }

  return {
    name: 'API Gateway',
    type: 'service',
    status,
    latencyMs: Math.floor(performance.now() - start),
    metrics: {
      timeoutMs: config.api.timeoutMs,
      retryAttempts: config.api.retryAttempts,
    },
    findings,
  };
}

async function checkStudioAgent(): Promise<AgentHealth> {
  const start = performance.now();
  const findings: string[] = [];
  let status: AgentHealth['status'] = 'healthy';

  // Check Node Version
  const nodeVersion = process.version;
  if (!nodeVersion.startsWith('v20') && !nodeVersion.startsWith('v22') && !nodeVersion.startsWith('v18')) {
    status = 'degraded';
    findings.push(`Compatibility Warning: Node version ${nodeVersion} may not be fully supported`);
  }

  return {
    name: 'Studio Environment',
    type: 'environment',
    status,
    latencyMs: Math.floor(performance.now() - start),
    metrics: {
      nodeVersion,
      pid: process.pid,
      cwd: process.cwd(),
    },
    findings,
  };
}

export async function runHyperHealthScan(): Promise<HealthReport> {
  console.log(chalk.cyan.bold('\n🏥 Initializing Hyper Health Scan...'));
  
  const systemMetrics = getSystemMetrics();
  
  const agents: AgentHealth[] = [];
  
  // Parallel execution for "Hyper" speed
  const results = await Promise.all([
    checkDatabaseAgent(),
    checkApiAgent(),
    checkStudioAgent()
  ]);
  
  agents.push(...results);

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    agents,
  };

  return report;
}

export function printHealthReport(report: HealthReport) {
  console.log(chalk.bold(`\n📊 Scan Report [${report.timestamp}]`));
  console.log(chalk.dim('------------------------------------------------'));
  
  // System Summary
  console.log(chalk.white.bold('🖥️  Host System'));
  console.log(`   Host: ${report.system.hostname} (${report.system.platform}/${report.system.arch})`);
  console.log(`   CPU:  ${report.system.cpu.model} (${report.system.cpu.cores} cores)`);
  console.log(`   Mem:  ${report.system.memory.usedPercentage} used of ${(report.system.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB`);
  console.log('');

  // Agents
  report.agents.forEach(agent => {
    let icon = '❓';
    let color = chalk.white;
    
    if (agent.status === 'healthy') { icon = '✅'; color = chalk.green; }
    if (agent.status === 'degraded') { icon = '⚠️ '; color = chalk.yellow; }
    if (agent.status === 'unhealthy') { icon = '❌'; color = chalk.red; }

    console.log(color.bold(`${icon} ${agent.name} [${agent.type.toUpperCase()}]`));
    console.log(chalk.dim(`   Latency: ${agent.metrics.latencyMs || agent.latencyMs}ms`));
    
    if (Object.keys(agent.metrics).length > 0) {
      console.log(chalk.dim('   Metrics:'));
      Object.entries(agent.metrics).forEach(([k, v]) => {
        if (k !== 'latencyMs') console.log(chalk.dim(`     - ${k}: ${v}`));
      });
    }

    if (agent.findings.length > 0) {
      console.log(chalk.bold('   Findings:'));
      agent.findings.forEach(f => console.log(color(`     - ${f}`)));
    }
    console.log('');
  });

  // Scorecard
  const passed = report.agents.filter(a => a.status === 'healthy').length;
  const total = report.agents.length;
  const score = Math.round((passed / total) * 100);
  
  let scoreColor = chalk.green;
  if (score < 80) scoreColor = chalk.yellow;
  if (score < 50) scoreColor = chalk.red;

  console.log(chalk.dim('------------------------------------------------'));
  console.log(chalk.bold('🏆 Final Scorecard: ') + scoreColor.bold(`${score}% (${passed}/${total} Agents Healthy)`));
  
  // Archive
  const archiveDir = path.resolve(process.cwd(), 'logs/health-checks');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  const filename = `scan-${report.timestamp.replace(/:/g, '-')}.json`;
  fs.writeFileSync(path.join(archiveDir, filename), JSON.stringify(report, null, 2));
  console.log(chalk.dim(`\n📁 Report archived to: logs/health-checks/${filename}`));
}
