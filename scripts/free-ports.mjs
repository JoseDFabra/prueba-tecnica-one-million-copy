import { execSync } from 'node:child_process';

const ports = process.argv.slice(2);

if (ports.length === 0) {
  process.exit(0);
}

for (const port of ports) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();

    if (!output) {
      console.log(`- Puerto ${port} ya estaba libre`);
      continue;
    }

    const pids = output.split('\n').filter(Boolean);
    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }

    console.log(`- Puerto ${port} liberado (${pids.length} proceso(s))`);
  } catch {
    console.log(`- Puerto ${port} ya estaba libre`);
  }
}
