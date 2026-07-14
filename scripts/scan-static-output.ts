import { lstat, readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export interface StaticOutputViolation {
  file: string;
  line: number | null;
  rule: string;
}

const binaryExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);

const forbiddenPathRules = [
  { rule: "private-artifact-path", pattern: /(^|\/)(?:admin|private|raw|var)(\/|$)/i },
  { rule: "environment-file", pattern: /(^|\/)\.env(?:\.|$)/i },
  { rule: "database-or-secret-file", pattern: /\.(?:db|sqlite3?|pem|key|p12|pfx|map)$/i },
] as const;

const forbiddenContentRules = [
  { rule: "legacy-ai-identity", pattern: /Agent Pulse|agent-pulse/gi },
  {
    rule: "legacy-ai-route",
    pattern: /tech-evolution|agi-progress|global-innovation|model-economics/gi,
  },
  {
    rule: "private-field",
    pattern:
      /["']?(?:raw_payload|rawPayload|payload_json|config_json|state_json|manual_override|private_notes?|internal_notes?)["']?\s*:/g,
  },
  {
    rule: "credential-field",
    pattern:
      /["']?(?:admin_token|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|authorization|cookie)["']?\s*[:=]/gi,
  },
  {
    rule: "credential-environment",
    pattern: /(?:DATABASE_URL|ADMIN_TOKEN|GH_TOKEN|GITHUB_TOKEN|COLLECTOR_PROXY_URL)\s*=/g,
  },
  { rule: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    rule: "access-token",
    pattern: /(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})/g,
  },
  {
    rule: "local-path",
    pattern: /(?:file:\/\/|\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\/|[A-Z]:\\Users\\)/g,
  },
] as const;

export async function scanStaticOutput(root = "dist"): Promise<StaticOutputViolation[]> {
  const absoluteRoot = resolve(root);
  const files = await filesBelow(absoluteRoot);
  const violations: StaticOutputViolation[] = [];

  for (const file of files) {
    const path = relative(absoluteRoot, file).split(sep).join("/");
    const metadata = await lstat(file);
    if (metadata.isSymbolicLink()) {
      violations.push({ file: path, line: null, rule: "symbolic-link" });
      continue;
    }
    for (const { rule, pattern } of forbiddenPathRules) {
      if (pattern.test(path)) violations.push({ file: path, line: null, rule });
    }
    if (binaryExtensions.has(extname(path).toLowerCase())) continue;

    const content = await readFile(file, "utf8");
    for (const { rule, pattern } of forbiddenContentRules) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (!match) continue;
      violations.push({ file: path, line: lineAt(content, match.index), rule });
    }
  }

  return violations.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      left.rule.localeCompare(right.rule),
  );
}

async function filesBelow(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? filesBelow(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}

function lineAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

export async function runStaticOutputScan(args = process.argv.slice(2)): Promise<void> {
  const root = args[0] ?? "dist";
  const violations = await scanStaticOutput(root);
  if (violations.length === 0) {
    console.log(`[privacy] static output passed: ${resolve(root)}`);
    return;
  }
  for (const violation of violations) {
    const location =
      violation.line === null ? violation.file : `${violation.file}:${violation.line}`;
    console.error(`[privacy] ${violation.rule}: ${location}`);
  }
  throw new Error(`Static output privacy scan failed with ${violations.length} violation(s)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runStaticOutputScan();
}
