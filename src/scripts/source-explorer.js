const root = document.querySelector("[data-source-explorer] [data-source-groups]")?.closest("[data-source-explorer]");

if (root && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const windowEl = root.querySelector("[data-source-groups]");
  const groups = JSON.parse(windowEl.dataset.sourceGroups || "[]");
  const groupTabs = [...root.querySelectorAll("[data-source-group-index]")].filter((el) => el.classList.contains("source-repo-button"));
  const fileLists = [...root.querySelectorAll("[data-source-group-files]")];
  const repoTitle = root.querySelector("[data-source-repo-title]");
  const repositoryLink = root.querySelector("[data-source-repository-link]");
  const activeTab = root.querySelector("[data-source-active-tab]");
  const language = root.querySelector("[data-source-language]");
  const fileLink = root.querySelector("[data-source-file-link]");
  const loading = root.querySelector("[data-source-loading]");
  const content = root.querySelector("[data-source-code-content]");
  const code = root.querySelector("[data-source-code]");
  const lineNumbers = root.querySelector("[data-source-line-numbers]");
  const status = root.querySelector("[data-source-status]");
  const lineCount = root.querySelector("[data-source-lines]");
  const cache = new Map();
  let activeGroup = 0;
  let selectedIndex = -1;
  let requestId = 0;

  async function openFile(groupIndex, fileIndex) {
    const group = groups[groupIndex];
    const file = group?.files?.[fileIndex];
    if (!file) return;
    activeGroup = groupIndex;
    selectedIndex = fileIndex;
    const thisRequest = ++requestId;
    fileLists.forEach((list, index) => { list.hidden = index !== groupIndex; });
    const currentList = fileLists[groupIndex];
    currentList?.querySelectorAll("[data-source-file-index]").forEach((button) => {
      const active = Number(button.dataset.sourceFileIndex) === fileIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    groupTabs.forEach((button) => {
      const active = Number(button.dataset.sourceGroupIndex) === groupIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    repoTitle.textContent = group.repo.split("/")[1];
    repositoryLink.href = `https://github.com/${group.repo}`;
    activeTab.textContent = file.label;
    language.textContent = file.language.toUpperCase();
    fileLink.href = `https://github.com/${group.repo}/blob/${group.branch}/${file.path.split("/").map(encodeURIComponent).join("/")}`;
    content.hidden = true;
    loading.hidden = false;
    loading.textContent = "Fetching file from GitHub…";
    status.textContent = "FETCHING SOURCE";
    lineCount.textContent = "— LINES";

    try {
      const cacheKey = `${group.repo}@${group.branch}:${file.path}`;
      let source = cache.get(cacheKey);
      if (source === undefined) {
        const url = `https://raw.githubusercontent.com/${group.repo}/${group.branch}/${file.path.split("/").map(encodeURIComponent).join("/")}`;
        const response = await fetch(url, { headers: { Accept: "text/plain" } });
        if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
        source = await response.text();
        if (source.length > 300_000) throw new Error("This file is too large to preview here. Open it on GitHub instead.");
        cache.set(cacheKey, source);
      }
      if (thisRequest !== requestId || activeGroup !== groupIndex || selectedIndex !== fileIndex) return;
      const normalized = source.replace(/\r\n?/g, "\n");
      const lines = normalized.split("\n");
      code.textContent = normalized;
      lineNumbers.textContent = lines.map((_, i) => String(i + 1)).join("\n");
      loading.hidden = true;
      content.hidden = false;
      status.textContent = "SOURCE LOADED · GITHUB";
      lineCount.textContent = `${lines.length} LINES`;
    } catch (error) {
      if (thisRequest !== requestId) return;
      loading.hidden = false;
      loading.textContent = `${error.message} Use the repository link to inspect this file.`;
      status.textContent = "SOURCE UNAVAILABLE";
    }
  }

  groupTabs.forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.sourceGroupIndex);
    if (index !== activeGroup && groups[index]?.files?.length) openFile(index, 0);
  }));
  fileLists.forEach((list, groupIndex) => list.querySelectorAll("[data-source-file-index]").forEach((button) => {
    button.addEventListener("click", () => openFile(groupIndex, Number(button.dataset.sourceFileIndex)));
  }));
  if (groups[0]?.files?.length) openFile(0, 0);
}
