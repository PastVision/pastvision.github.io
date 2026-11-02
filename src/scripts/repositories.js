const app = document.querySelector("[data-repositories-app]");

if (app && !app.dataset.initialized) {
  app.dataset.initialized = "true";
  const $ = (selector) => app.querySelector(selector);
  const repoList = $("[data-repo-list]");
  const searchInput = $("[data-repo-search]");
  const languageFilter = $("[data-repo-language]");
  const sortSelect = $("[data-repo-sort]");
  const countLabel = $("[data-repository-count]");
  const filterCount = $("[data-filter-count]");
  const emptyState = $("[data-repo-empty]");
  const selectedPanel = $("[data-repo-selected]");
  const cache = new Map();
  let repositories = [];
  let selectedRepo = null;
  let activePath = "";
  let requestId = 0;

  const ignoredDirs = new Set([".git", "node_modules", "vendor", "dist", "build", "coverage", ".astro", "__pycache__", ".venv", "venv"]);
  const ignoredExtensions = new Set(["png","jpg","jpeg","gif","webp","ico","pdf","zip","7z","rar","dll","exe","so","dylib","bin","mp4","mp3","woff","woff2","ttf","otf","lock"]);
  const languageFor = (path) => {
    const ext = path.split(".").pop()?.toLowerCase();
    const map = { py:"python", js:"javascript", mjs:"javascript", cjs:"javascript", ts:"typescript", tsx:"typescript", jsx:"javascript", cpp:"cpp", cc:"cpp", c:"c", h:"c", hpp:"cpp", cs:"csharp", java:"java", kt:"kotlin", dart:"dart", rs:"rust", go:"go", rb:"ruby", php:"php", html:"html", htm:"html", css:"css", scss:"scss", json:"json", md:"markdown", yml:"yaml", yaml:"yaml", toml:"toml", xml:"xml", sh:"shell", ps1:"powershell", sql:"sql", bf:"brainfuck", txt:"text", gitignore:"text", env:"text" };
    return map[ext] || (path.endsWith(".gitignore") ? "text" : "text");
  };
  const safeDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Updated date unavailable" : `Updated ${date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})}`;
  };
  const setMessage = (element, message) => { element.textContent = message; };

  function renderRepositories() {
    const term = searchInput.value.trim().toLowerCase();
    const language = languageFilter.value;
    const sort = sortSelect.value;
    let visible = repositories.filter((repo) => {
      const matchesTerm = !term || [repo.name,repo.description,repo.language].filter(Boolean).join(" ").toLowerCase().includes(term);
      return matchesTerm && (!language || repo.language === language);
    });
    visible = [...visible].sort((a,b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "stars" ? b.stargazers_count-a.stargazers_count : new Date(b.updated_at)-new Date(a.updated_at));
    filterCount.textContent = `${visible.length} / ${repositories.length}`;
    repoList.replaceChildren();
    if (!visible.length) {
      const message = document.createElement("div"); message.className="repo-message"; message.textContent="No repositories match these filters."; repoList.append(message); return;
    }
    visible.forEach((repo) => {
      const button = document.createElement("button"); button.type="button"; button.className="repo-item";
      button.classList.toggle("is-active", selectedRepo?.id === repo.id);
      const name = document.createElement("span"); name.className="repo-item-name"; name.textContent=repo.name;
      const description = document.createElement("span"); description.className="repo-item-description"; description.textContent=repo.description || "No description provided.";
      const meta = document.createElement("span"); meta.className="repo-item-meta";
      const languageText = repo.language || "Unspecified";
      const stars = `★ ${repo.stargazers_count || 0}`;
      const updated = new Date(repo.updated_at).toLocaleDateString(undefined,{month:"short",year:"numeric"});
      [languageText,stars,updated].forEach((value)=>{const item=document.createElement("span");item.textContent=value;meta.append(item);});
      button.append(name,description,meta);
      button.addEventListener("click",()=>selectRepository(repo));
      repoList.append(button);
    });
  }

  async function loadRepositories() {
    try {
      const all=[];
      let page=1;
      while(true) {
        const response=await fetch(`https://api.github.com/users/PastVision/repos?type=public&sort=updated&per_page=100&page=${page}`,{headers:{Accept:"application/vnd.github+json"}});
        if(!response.ok) throw new Error(response.status===403?"GitHub API rate limit reached. Please try again later.":`GitHub returned HTTP ${response.status}.`);
        const batch=await response.json();
        if(!Array.isArray(batch)) throw new Error("GitHub returned an unexpected repository response.");
        all.push(...batch.filter((repo)=>repo.visibility==="public" || repo.private===false));
        if(batch.length<100) break;
        page++;
      }
      repositories=all;
      countLabel.textContent=`${repositories.length} PUBLIC REPOSITORIES`;
      const languages=[...new Set(repositories.map((repo)=>repo.language).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      languages.forEach((language)=>{const option=document.createElement("option");option.value=language;option.textContent=language;languageFilter.append(option);});
      renderRepositories();
      if(!repositories.length) setMessage(repoList,"No public repositories were returned by GitHub.");
    } catch(error) {
      countLabel.textContent="GITHUB CONNECTION FAILED";
      setMessage(repoList,`${error.message} You can still browse the profile on github.com/PastVision.`);
    }
  }

  function isPreviewable(item) {
    if(item.type!=="blob" || item.size>300_000) return false;
    const path=item.path;
    if(path.split("/").some((part)=>ignoredDirs.has(part.toLowerCase()))) return false;
    if(path.split("/").some((part)=>part.startsWith("." ) && part!==".gitignore" && part!==".nojekyll")) return false;
    const ext=path.includes(".")?path.split(".").pop().toLowerCase():"";
    return !ignoredExtensions.has(ext) && !/\.(map|min\.(js|css))$/i.test(path);
  }

  function buildTree(files) {
    const root={dirs:new Map(),files:[]};
    files.forEach((file)=>{
      const parts=file.path.split("/"); let node=root;
      parts.slice(0,-1).forEach((part)=>{if(!node.dirs.has(part))node.dirs.set(part,{dirs:new Map(),files:[]});node=node.dirs.get(part);});
      node.files.push(file);
    });
    return root;
  }

  function renderTree(files) {
    const tree=$("[data-file-tree]"); tree.replaceChildren();
    const flat=[];
    const add=(node,parent,depth)=>{
      [...node.dirs.entries()].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([name,child])=>{
        const row=document.createElement("button");row.type="button";row.className="tree-folder";row.style.paddingLeft=`${7+depth*13}px`;
        const icon=document.createElement("span");icon.className="tree-icon";icon.textContent="▾";
        const label=document.createElement("span");label.textContent=name;row.append(icon,label);parent.append(row);
        const contents=document.createElement("div");contents.hidden=false;parent.append(contents);
        row.addEventListener("click",()=>{contents.hidden=!contents.hidden;icon.textContent=contents.hidden?"▸":"▾";});
        add(child,contents,depth+1);
      });
      node.files.sort((a,b)=>a.path.localeCompare(b.path)).forEach((file)=>{
        const row=document.createElement("button");row.type="button";row.className="tree-file";row.style.paddingLeft=`${7+depth*13}px`;
        const icon=document.createElement("span");icon.className="tree-icon";icon.textContent="·";
        const label=document.createElement("span");label.textContent=file.path.split("/").pop();label.title=file.path;row.title=file.path;row.append(icon,label);parent.append(row);
        row.addEventListener("click",()=>openFile(file,row));
        flat.push(file);
      });
    };
    add(tree._tree,tree,0);
    $("[data-file-count]").textContent=`${flat.length} FILES`;
    if(!flat.length) setMessage(tree,"No previewable text files were found in this repository.");
    return flat;
  }

  async function selectRepository(repo) {
    selectedRepo=repo; activePath=""; requestId++;
    renderRepositories();
    emptyState.hidden=true; selectedPanel.hidden=false;
    $("[data-selected-name]").textContent=repo.full_name;
    $("[data-selected-description]").textContent=repo.description || "No description provided.";
    $("[data-selected-github]").href=repo.html_url;
    $("[data-selected-language]").textContent=repo.language || "Language unspecified";
    $("[data-selected-updated]").textContent=safeDate(repo.updated_at);
    $("[data-selected-branch]").textContent=`BRANCH · ${repo.default_branch}`;
    const tree=$("[data-file-tree]"); tree.replaceChildren(); setMessage(tree,"Loading repository file tree from GitHub…");
    $("[data-code-content]").hidden=true; $("[data-code-message]").hidden=false; setMessage($("[data-code-message]"),"Select a source file to preview its contents.");
    $("[data-active-file]").textContent="Choose a file"; $("[data-active-file-link]").hidden=true;
    $("[data-code-status]").textContent="LOADING FILE TREE"; $("[data-code-lines]").textContent="— LINES";
    const thisRequest=requestId;
    if(repo.name.toLowerCase()==="puttyserveradder") {
      tree.replaceChildren();
      setMessage(tree,"Source preview is temporarily disabled while this repository receives a security and privacy review. The public GitHub repository remains available through OPEN ON GITHUB.");
      $("[data-code-status]").textContent="PREVIEW WITHHELD";
      return;
    }
    try {
      const cacheKey=`${repo.full_name}@${repo.default_branch}`;
      let files=cache.get(cacheKey);
      if(!files) {
        const response=await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`,{headers:{Accept:"application/vnd.github+json"}});
        if(!response.ok) throw new Error(`Could not load repository tree (HTTP ${response.status}).`);
        const data=await response.json();
        files=(data.tree||[]).filter(isPreviewable).sort((a,b)=>a.path.localeCompare(b.path));
        cache.set(cacheKey,files);
      }
      if(thisRequest!==requestId) return;
      tree._tree=buildTree(files);
      const flat=renderTree(files);
      $("[data-code-status]").textContent=dataTruncated(files)?"TREE LOADED · FILTERED":"TREE LOADED · GITHUB";
      if(flat.length) {
        const readme=flat.find((file)=>/^readme(\.[^/]*)?$/i.test(file.path.split("/").pop()));
        const defaultFile=readme || flat.find((file)=>/\.(py|js|ts|cpp|c|h|html|md)$/i.test(file.path)) || flat[0];
        const button=[...tree.querySelectorAll(".tree-file")].find((el)=>el.title===defaultFile.path);
        openFile(defaultFile,button);
      }
    } catch(error) {
      if(thisRequest!==requestId)return;
      tree.replaceChildren();setMessage(tree,error.message);
      $("[data-code-status]").textContent="TREE UNAVAILABLE";
    }
  }

  function dataTruncated(files) { return files.length>=5000; }

  async function openFile(file,button) {
    if(!selectedRepo)return;
    activePath=file.path; const thisRequest=++requestId;
    $("[data-file-tree]").querySelectorAll(".tree-file").forEach((item)=>item.classList.toggle("is-active",item===button));
    const link=$("[data-active-file-link]");
    $("[data-active-file]").textContent=file.path;
    $("[data-active-language]").textContent=languageFor(file.path).toUpperCase();
    link.href=`${selectedRepo.html_url}/blob/${encodeURIComponent(selectedRepo.default_branch)}/${file.path.split("/").map(encodeURIComponent).join("/")}`;link.hidden=false;
    $("[data-code-content]").hidden=true;$("[data-code-message]").hidden=false;setMessage($("[data-code-message]"),"Fetching source file from GitHub…");$("[data-code-status]").textContent="FETCHING SOURCE";$("[data-code-lines]").textContent="— LINES";
    try {
      const response=await fetch(`https://raw.githubusercontent.com/${selectedRepo.full_name}/${encodeURIComponent(selectedRepo.default_branch)}/${file.path.split("/").map(encodeURIComponent).join("/")}`);
      if(!response.ok)throw new Error(`GitHub returned HTTP ${response.status}.`);
      const source=await response.text();
      if(source.length>300_000)throw new Error("This file is too large to preview. Open it directly on GitHub.");
      if(thisRequest!==requestId || activePath!==file.path)return;
      const normalized=source.replace(/\r\n?/g,"\n"); const lines=normalized.split("\n");
      $("[data-code]").textContent=normalized;$("[data-line-numbers]").textContent=lines.map((_,i)=>String(i+1)).join("\n");
      $("[data-code-message]").hidden=true;$("[data-code-content]").hidden=false;
      $("[data-code-status]").textContent="SOURCE LOADED · GITHUB";$("[data-code-lines]").textContent=`${lines.length} LINES`;
    } catch(error) {
      if(thisRequest!==requestId)return;
      $("[data-code-content]").hidden=true;$("[data-code-message]").hidden=false;setMessage($("[data-code-message]"),`${error.message} Use VIEW ON GITHUB to inspect this file.`);$("[data-code-status]").textContent="SOURCE UNAVAILABLE";
    }
  }

  searchInput.addEventListener("input",renderRepositories);
  languageFilter.addEventListener("change",renderRepositories);
  sortSelect.addEventListener("change",renderRepositories);
  loadRepositories();
}
