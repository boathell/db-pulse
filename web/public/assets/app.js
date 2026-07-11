const state = {
  events: [],
  tracks: [],
  actors: [],
  resources: [],
  scout: [],
  product: null,
  activeTrack: "",
  search: "",
  category: "",
  resourceAudience: "all",
};
const $ = (selector) => document.querySelector(selector);
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

async function load() {
  try {
    const [timeline, tracks, actors, resources, scout, product] = await Promise.all([
      fetch("./data/timeline.json")
        .then(check)
        .then((response) => response.json()),
      fetch("./data/tracks.json")
        .then(check)
        .then((response) => response.json()),
      fetch("./data/actors.json")
        .then(check)
        .then((response) => response.json()),
      fetch("./data/resources.json")
        .then(check)
        .then((response) => response.json()),
      fetch("./data/scout.json")
        .then(check)
        .then((response) => response.json())
        .catch(() => ({ insights: [] })),
      fetch("./data/product.json")
        .then(check)
        .then((response) => response.json())
        .catch(() => null),
    ]);
    state.events = timeline.events || [];
    state.tracks = tracks || [];
    state.actors = actors || [];
    state.resources = resources || [];
    state.scout = scout.insights || [];
    state.product = product;
    updateOverview(timeline.generatedAt);
    renderTracks();
    renderCategories();
    renderTimeline();
    renderActors();
    renderResourceFilters();
    renderResources();
    renderScout();
    scheduleScoutPopover();
    renderEvolution();
    openFromHash();
  } catch (error) {
    $("#timelineList").append(node("div", "empty-state", `数据载入失败：${error.message}`));
  }
}

function renderEvolution() {
  const product = state.product;
  if (!product) return;
  $("#productVersion").textContent = `v${product.version}`;
  $("#sourceCoverage").textContent = `${product.sourceCoverage?.total || 0}+`;
  $("#systemScore").textContent = product.evaluation?.overallScore ?? "—";
  const measured = (product.evaluation?.dimensions || []).filter(
    (item) => item.status === "measured",
  ).length;
  $("#evaluationNote").textContent =
    `${measured}/${product.evaluation?.dimensions?.length || 0} 个维度已有足够样本；证据不足的维度不会参与综合分。`;
  const spine = $("#roadmapSpine");
  spine.replaceChildren();
  (product.roadmap || []).forEach((stateItem) => {
    const card = node("article", `roadmap-state ${stateItem.status}`);
    card.append(
      node("span", "", `STATE ${stateItem.state}`),
      node("h3", "", stateItem.name),
      node("p", "", stateItem.promise),
    );
    const milestones = node("ol");
    stateItem.milestones.forEach((milestone) => {
      milestones.append(node("li", "", milestone));
    });
    card.append(milestones);
    spine.append(card);
  });
  const capabilityRoot = $("#publicCapabilities");
  capabilityRoot.replaceChildren();
  const domains = (product.capabilities || []).reduce((groups, capability) => {
    if (!groups[capability.domain]) groups[capability.domain] = [];
    groups[capability.domain].push(capability);
    return groups;
  }, {});
  Object.entries(domains).forEach(([domain, items]) => {
    const group = node("section", "public-capability-group");
    group.append(node("strong", "", domain.toUpperCase()));
    items.forEach((capability) => {
      const item = node("div", `public-capability ${capability.status}`);
      item.append(node("span", "", capability.name), node("i", "", `${capability.maturity}`));
      group.append(item);
    });
    capabilityRoot.append(group);
  });
  const releaseRoot = $("#releaseList");
  releaseRoot.replaceChildren();
  (product.releases || []).forEach((release) => {
    const article = node("article", "release-card");
    article.append(
      node("span", "", `${release.date} · v${release.version}`),
      node("h3", "", release.name),
      node("p", "", release.summary),
    );
    const changes = node("ul");
    release.changes.forEach((change) => {
      changes.append(node("li", "", change));
    });
    article.append(changes);
    releaseRoot.append(article);
  });
}

function renderScout() {
  const grid = $("#scoutGrid");
  grid.replaceChildren();
  state.scout.slice(0, 6).forEach((insight) => {
    const card = node("article", "scout-card");
    const head = node("div", "scout-card-head");
    head.append(
      node("span", "scout-kind", scoutKind(insight.kind)),
      node("strong", "scout-score", String(insight.totalScore)),
    );
    card.append(
      head,
      node("h3", "", insight.title),
      node("p", "scout-hypothesis", insight.hypothesis),
    );
    const detail = node("details", "scout-detail");
    detail.append(node("summary", "", "展开行动与反证"));
    const body = node("div");
    [
      ["为什么是现在", insight.whyNow],
      ["48 小时动作", insight.suggestedAction],
      ["建议沉淀", insight.artifactIdea],
      ["可能错在哪", insight.counterSignals],
    ].forEach(([label, copy]) => {
      const section = node("section");
      section.append(node("strong", "", label), node("p", "", copy));
      body.append(section);
    });
    detail.append(body);
    card.append(detail);
    grid.append(card);
  });
  if (!state.scout.length)
    grid.append(node("div", "empty-state", "星探正在穿梭信息之间，暂时没有达到发布门槛的想法。"));
}

function scheduleScoutPopover() {
  const insight = state.scout[0];
  if (!insight || localStorage.getItem(`agent-pulse-scout-dismissed:${insight.slug}`)) return;
  setTimeout(() => {
    $("#scoutPopoverTitle").textContent = insight.title;
    $("#scoutPopoverCopy").textContent = insight.suggestedAction;
    $("#scoutPopover").hidden = false;
    $("#scoutPopover").dataset.slug = insight.slug;
  }, 1800);
}

function scoutKind(kind) {
  return { venture: "创业火花", media: "内容机会", work: "工作杠杆" }[kind] || "认知火花";
}

function check(response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

function updateOverview(generatedAt) {
  const top = Math.max(0, ...state.events.map((event) => event.valueScore || 0));
  $("#heroScore").textContent = top;
  $("#eventCount").textContent = state.events.length;
  $("#trackCount").textContent = state.tracks.length;
  $("#actorCount").textContent = state.actors.length;
  const date = generatedAt ? new Date(generatedAt) : new Date();
  $("#generatedAt").textContent = `情报生成于 ${date.toLocaleString("zh-CN", { hour12: false })}`;
  $("#footerTime").textContent = date.toLocaleDateString("zh-CN");
  const lead = [...state.events].sort((a, b) => b.valueScore - a.valueScore)[0];
  if (lead) $("#executiveBrief").textContent = `${lead.title}。${lead.businessValue}`;
}

function renderTracks() {
  const container = $("#trackSwitcher");
  container.replaceChildren();
  const all = trackButton({ slug: "", name: "全部信号", color: "#8e98a8", icon: "∞" });
  all.classList.add("active");
  container.append(all);
  state.tracks.forEach((track) => {
    container.append(trackButton(track));
  });
}

function trackButton(track) {
  const button = node("button", "track-button");
  button.type = "button";
  button.role = "tab";
  button.dataset.track = track.slug;
  button.style.setProperty("--track-color", track.color);
  button.append(node("i"), node("span", "", `${track.icon} ${track.name}`));
  button.addEventListener("click", () => {
    state.activeTrack = track.slug;
    document.querySelectorAll(".track-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderTimeline();
  });
  return button;
}

function renderCategories() {
  const select = $("#categorySelect");
  [...new Set(state.events.map((event) => event.category))].sort().forEach((category) => {
    const option = node("option", "", category);
    option.value = category;
    select.append(option);
  });
}

function renderTimeline() {
  const query = state.search.toLowerCase();
  const events = state.events.filter((event) => {
    const tracks = event.tracks || [];
    const matchesTrack =
      !state.activeTrack || tracks.some((track) => track.slug === state.activeTrack);
    const text = [event.title, event.summary, event.company, ...(event.keywords || [])]
      .join(" ")
      .toLowerCase();
    return (
      matchesTrack &&
      (!query || text.includes(query)) &&
      (!state.category || event.category === state.category)
    );
  });
  const list = $("#timelineList");
  list.replaceChildren();
  events.forEach((event) => {
    list.append(eventCard(event));
  });
  $("#emptyState").hidden = events.length > 0;
  $("#visibleCount").textContent = events.length;
  $("#averageImpact").textContent = events.length
    ? Math.round(events.reduce((sum, event) => sum + event.impactScore, 0) / events.length)
    : 0;
  const track = state.tracks.find((item) => item.slug === state.activeTrack);
  $("#activeTrackName").textContent = track?.name || "全部信号";
  $("#activeTrackDescription").textContent =
    track?.description || "跨主线查看已经收敛的关键行业变化。";
}

function eventCard(event) {
  const card = node("button", `timeline-card${event.featured ? " featured" : ""}`);
  card.type = "button";
  const top = node("div", "card-top");
  top.append(
    node("span", "", formatDate(event.happenedAt)),
    node("span", "", event.company),
    node("span", "impact-pill", `价值 ${event.valueScore}`),
  );
  card.append(
    top,
    node("h3", "card-title", event.title),
    node("p", "card-summary", event.factSummary),
  );
  const footer = node("div", "card-footer");
  (event.tracks || []).slice(0, 4).forEach((track) => {
    footer.append(node("span", "mini-tag", track.name));
  });
  card.append(footer);
  card.addEventListener("click", () => openDrawer(event));
  return card;
}

function renderActors() {
  const china = state.actors
    .filter((actor) => actor.region === "CN")
    .sort((a, b) => b.tableScore - a.tableScore);
  const list = $("#actorList");
  const dots = $("#radarDots");
  list.replaceChildren();
  dots.replaceChildren();
  china.slice(0, 12).forEach((actor, index) => {
    const item = node("div", "actor-item");
    item.append(node("span", "actor-rank", String(index + 1).padStart(2, "0")));
    const copy = node("div");
    copy.append(
      node("strong", "", actor.name),
      node("small", "", `${actor.scale} · ${(actor.domains || []).slice(0, 2).join(" / ")}`),
    );
    item.append(copy, node("span", "actor-score", actor.tableScore));
    list.append(item);
    if (index < 10) {
      const dot = node("div", "radar-dot");
      const angle = index * 137.5;
      const radius = 18 + (100 - actor.tableScore) * 1.6;
      dot.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
      dot.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
      dot.title = `${actor.name} · ${actor.tableScore}`;
      dots.append(dot);
    }
  });
}

function renderResourceFilters() {
  const labels = { all: "全部", "to-c": "To C 订阅", "to-d": "To D API" };
  const container = $("#resourceFilters");
  Object.entries(labels).forEach(([value, label], index) => {
    const button = node("button", `resource-filter${index === 0 ? " active" : ""}`, label);
    button.type = "button";
    button.addEventListener("click", () => {
      state.resourceAudience = value;
      document.querySelectorAll(".resource-filter").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderResources();
    });
    container.append(button);
  });
}

function renderResources() {
  const container = $("#resourceGrid");
  container.replaceChildren();
  state.resources
    .filter(
      (resource) =>
        state.resourceAudience === "all" || resource.audience === state.resourceAudience,
    )
    .forEach((resource) => {
      const card = node("article", "resource-card");
      card.append(
        node("span", "resource-type", resource.type.replaceAll("-", " ")),
        node("h3", "", resource.model),
        node("p", "", `${resource.provider} · ${resource.planName}`),
      );
      const meta = node("div", "resource-meta");
      meta.append(
        node("span", "", resource.region),
        node("span", "", resource.riskLevel === "official" ? "官方" : "参考"),
      );
      card.append(meta);
      const links = node("div", "resource-links");
      links.append(
        link("官方入口 ↗", resource.purchaseUrl),
        link("价格证据 ↗", resource.sourceUrl),
      );
      card.append(links);
      container.append(card);
    });
}

function link(text, href) {
  const anchor = node("a", "", text);
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  return anchor;
}

function openDrawer(event) {
  $("#drawerCategory").textContent = event.category;
  $("#drawerDate").textContent = formatDate(event.happenedAt);
  $("#drawerTitle").textContent = event.title;
  $("#drawerFact").textContent = event.factSummary;
  $("#drawerSummary").textContent = event.summary;
  $("#drawerTechnical").textContent = event.technicalInsight;
  $("#drawerIndustry").textContent = event.industryInsight;
  $("#drawerBusiness").textContent = event.businessValue;
  $("#drawerFuture").textContent = event.futureOutlook;
  const scores = $("#drawerScores");
  scores.replaceChildren();
  [
    ["可信", event.confidenceScore],
    ["热度", event.heatScore],
    ["影响", event.impactScore],
    ["价值", event.valueScore],
  ].forEach(([label, value]) => {
    const chip = node("div", "score-chip");
    chip.append(node("strong", "", value), node("span", "", label));
    scores.append(chip);
  });
  const keywords = $("#drawerKeywords");
  keywords.replaceChildren();
  (event.keywords || []).forEach((item) => {
    keywords.append(node("span", "", item));
  });
  const tracks = $("#drawerTracks");
  tracks.replaceChildren();
  (event.tracks || []).forEach((item) => {
    tracks.append(node("span", "", `${item.icon} ${item.name} · ${item.stage}`));
  });
  const evidence = $("#drawerEvidence");
  evidence.replaceChildren();
  (event.evidence || []).forEach((item) => {
    const anchor = link("", item.url);
    anchor.className = "evidence-item";
    anchor.append(
      node("strong", "", item.title),
      node("span", "", `${item.source} · ${item.role} · ${formatDate(item.publishedAt)}`),
    );
    evidence.append(anchor);
  });
  $("#drawerBackdrop").hidden = false;
  $("#detailDrawer").classList.add("open");
  $("#detailDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  history.replaceState(null, "", `#event=${event.slug}`);
}

function closeDrawer() {
  $("#drawerBackdrop").hidden = true;
  $("#detailDrawer").classList.remove("open");
  $("#detailDrawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
  history.replaceState(null, "", location.pathname + location.search);
}
function openFromHash() {
  const slug = new URLSearchParams(location.hash.slice(1)).get("event");
  const event = state.events.find((item) => item.slug === slug);
  if (event) openDrawer(event);
}
function formatDate(value) {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

$("#searchInput").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTimeline();
});
$("#categorySelect").addEventListener("change", (event) => {
  state.category = event.target.value;
  renderTimeline();
});
document.querySelectorAll("[data-density]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-density]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    $("#timelineList").classList.toggle("compact", button.dataset.density === "compact");
  });
});
$("#drawerClose").addEventListener("click", closeDrawer);
$("#drawerBackdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});
const themes = ["midnight", "paper", "signal"];
const savedTheme = localStorage.getItem("agent-pulse-theme");
if (themes.includes(savedTheme)) document.documentElement.dataset.theme = savedTheme;
$("#themeButton").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "midnight";
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  document.documentElement.dataset.theme = next;
  localStorage.setItem("agent-pulse-theme", next);
});
$("#scoutDismiss").addEventListener("click", () => {
  const popover = $("#scoutPopover");
  if (popover.dataset.slug)
    localStorage.setItem(`agent-pulse-scout-dismissed:${popover.dataset.slug}`, "1");
  popover.hidden = true;
});
load();
