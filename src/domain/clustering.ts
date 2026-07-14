const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
  "update",
  "with",
]);

export function titleTokens(title: string): Set<string> {
  const tokens = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return new Set(tokens);
}

export function titleSimilarity(left: string, right: string): number {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export function belongsToEvent(
  candidate: { title: string; publishedAt: string },
  event: { title: string; happenedAt: string },
  threshold = 0.46,
): boolean {
  const hours =
    Math.abs(new Date(candidate.publishedAt).getTime() - new Date(event.happenedAt).getTime()) /
    3_600_000;
  if (hours > 21 * 24) return false;
  const candidateFingerprint = eventFingerprint(candidate.title);
  const eventKey = eventFingerprint(event.title);
  if (candidateFingerprint && candidateFingerprint === eventKey) {
    const candidateFacet = eventFacetBucket(eventFacet(candidate.title));
    const existingFacet = eventFacetBucket(eventFacet(event.title));
    return (
      candidateFacet === existingFacet && hours <= (candidateFacet === "incident" ? 7 : 21) * 24
    );
  }
  return hours <= 96 && titleSimilarity(candidate.title, event.title) >= threshold;
}

export function eventFingerprint(title: string): string | null {
  const normalized = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/达梦数据库|达梦/g, "dameng")
    .replace(/人大金仓(?:\s*kingbase(?:es)?)?|金仓/g, "kingbase")
    .replace(/南大通用/g, "gbase")
    .replace(/金篆信科/g, "goldendb")
    .replace(/巨杉数据库|巨杉/g, "sequoiadb")
    .replace(/矩阵起源/g, "matrixone")
    .replace(/涛思数据(?:\s*tdengine)?/g, "tdengine")
    .replace(/悦数科技/g, "nebulagraph")
    .replace(/[–—_]/g, "-");
  const patterns: Array<[string, RegExp]> = [
    ["dameng", /\bdameng(?:[-\s]?(dm\d+|dsc))?/],
    ["kingbase", /\bkingbase(?:es)?[-\s]?(v?\d+(?:\.\d+)*)?/],
    ["gbase", /\bgbase[-\s]?(?:8a|8s|8c|\d+(?:\.\d+)*)?/],
    ["goldendb", /\bgoldendb[-\s]?(\d+(?:\.\d+)*)?/],
    ["oceanbase", /\boceanbase[-\s]?(\d+(?:\.\d+)*)?/],
    ["tidb", /\btidb[-\s]?(v?\d+(?:\.\d+)*)?/],
    ["opengauss", /\bopengauss[-\s]?(\d+(?:\.\d+)*)?/],
    ["gaussdb", /\bgaussdb[-\s]?(\d+(?:\.\d+)*)?/],
    ["polardb", /\bpolardb(?:-x)?[-\s]?(\d+(?:\.\d+)*)?/],
    ["tdsql", /\btdsql[-\s]?(\d+(?:\.\d+)*)?/],
    ["vastbase", /\bvastbase[-\s]?(g?\d+(?:\.\d+)*)?/],
    ["sequoiadb", /\bsequoiadb[-\s]?(\d+(?:\.\d+)*)?/],
    ["matrixone", /\bmatrixone[-\s]?(\d+(?:\.\d+)*)?/],
    ["doris", /(?:apache[-\s]?)?doris[-\s]?(\d+(?:\.\d+)*)?/],
    ["starrocks", /\bstarrocks[-\s]?(\d+(?:\.\d+)*)?/],
    ["tdengine", /\btdengine[-\s]?(\d+(?:\.\d+)*)?/],
    ["nebulagraph", /\bnebula(?:graph)?[-\s]?(\d+(?:\.\d+)*)?/],
    ["milvus", /\bmilvus[-\s]?(\d+(?:\.\d+)*)?/],
  ];
  for (const [family, pattern] of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    return `${family}:${match.slice(1).filter(Boolean).join(":").replace(/\s+/g, "-")}`;
  }
  return null;
}

export function eventFacet(title: string): string {
  const normalized = title.normalize("NFKC").toLowerCase();
  if (/outage|incident|breach|漏洞|宕机|故障|事故|诉讼|lawsuit/.test(normalized)) return "incident";
  if (/series [a-z]|funding|融资|估值|ipo|s-1|并购|acqui/.test(normalized)) return "capital";
  if (/price|pricing|降价|涨价|定价|计费|license|许可/.test(normalized)) return "pricing";
  if (
    /available (?:in|for|on)|integration|integrat|managed service|cloud marketplace|procurement|migration|compatib|private deployment|接入|集成|托管|采购|迁移|兼容|私有化|行业落地|上云/.test(
      normalized,
    )
  )
    return "distribution";
  if (/benchmark|eval|测评|评测|score|榜单/.test(normalized)) return "benchmark";
  if (
    /capabilit|performance|benchmark|transaction|query|storage|compatib|事务|查询|存储|兼容|性能|能力/.test(
      normalized,
    )
  )
    return "capability";
  if (/release|launch|introduc|announce|upgrade|发布|推出|开源|升级|available/.test(normalized))
    return "release";
  return "update";
}

export function eventFacetBucket(facet: string): string {
  if (facet === "update") return "release";
  if (facet === "benchmark") return "capability";
  return facet;
}
