// ANSI color codes for terminal output
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

export function log(message: string, color: keyof typeof colors = "white"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function success(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

export function error(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

export function info(message: string): void {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

export function warning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

export function header(message: string): void {
  const line = "═".repeat(60);
  console.log(`\n${colors.bright}${colors.cyan}╔${line}╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║ ${message.padEnd(60)}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚${line}╝${colors.reset}\n`);
}

export function step(number: number, message: string): void {
  console.log(
    `\n${colors.bright}${colors.magenta}[Step ${number}]${colors.reset} ${colors.white}${message}${colors.reset}`
  );
}

export function substep(message: string): void {
  console.log(`  ${colors.dim}▸ ${message}${colors.reset}`);
}

export function highlight(message: string): void {
  console.log(`${colors.bright}${colors.yellow}★ ${message}${colors.reset}`);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function animateProgress(message: string, duration: number): Promise<void> {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = 100;
  const iterations = Math.floor(duration / interval);

  process.stdout.write(`${colors.cyan}`);

  for (let j = 0; j < iterations; j++) {
    process.stdout.write(`\r${frames[i]} ${message}`);
    i = (i + 1) % frames.length;
    await sleep(interval);
  }

  process.stdout.write(`\r${colors.green}✓${colors.reset} ${message}\n`);
}

export function formatEther(value: bigint): string {
  const eth = Number(value) / 1e18;
  return eth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function formatUSD(value: number | bigint): string {
  const usd = typeof value === "bigint" ? Number(value) / 1e6 : value;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function printBox(title: string, content: string[]): void {
  const maxLength = Math.max(title.length, ...content.map((c) => c.length));
  const width = maxLength + 4;

  console.log(`\n${colors.bright}┌${"─".repeat(width)}┐${colors.reset}`);
  console.log(
    `${colors.bright}│ ${colors.cyan}${title.padEnd(width - 2)}${colors.reset}${colors.bright}│${colors.reset}`
  );
  console.log(`${colors.bright}├${"─".repeat(width)}┤${colors.reset}`);

  content.forEach((line) => {
    console.log(
      `${colors.bright}│${colors.reset} ${line.padEnd(width - 2)} ${colors.bright}│${colors.reset}`
    );
  });

  console.log(`${colors.bright}└${"─".repeat(width)}┘${colors.reset}\n`);
}

export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i]?.length || 0))
  );

  // Header
  console.log(
    `\n${colors.bright}${headers.map((h, i) => h.padEnd(colWidths[i])).join(" │ ")}${colors.reset}`
  );
  console.log(colors.dim + colWidths.map((w) => "─".repeat(w)).join("─┼─") + colors.reset);

  // Rows
  rows.forEach((row) => {
    console.log(row.map((cell, i) => cell.padEnd(colWidths[i])).join(" │ "));
  });

  console.log();
}

export function countdown(seconds: number): void {
  process.stdout.write(`${colors.yellow}`);
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏳ ${i} seconds...`);
    // This is synchronous for demo purposes
  }
  process.stdout.write(`\r${colors.green}✓ Complete!${colors.reset}\n`);
}
