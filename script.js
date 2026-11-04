(function () {
  const USERNAME = 'clementezeusgabriel01-iswrtg';
  const AUTO_REFRESH_MINUTES = 5;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function githubProxyUrl(path) {
    return `/api/github?path=${encodeURIComponent(path)}&_=${Date.now()}`;
  }

  /* ---------------------------------------------------------------------
     Theme toggle
     --------------------------------------------------------------------- */
  function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    function currentTheme() {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function updateLabel() {
      const theme = currentTheme();
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    updateLabel();

    toggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        /* localStorage unavailable, theme just won't persist */
      }
      updateLabel();
    });
  }

  /* ---------------------------------------------------------------------
     Loading screen — staged status text tied to real fetch progress
     --------------------------------------------------------------------- */
  function setLoaderStage(text, percent) {
    const status = document.getElementById('loader-status');
    const bar = document.getElementById('loader-bar');
    if (status) status.textContent = text;
    if (bar) bar.style.width = `${percent}%`;
  }

  function hideLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (screen) screen.classList.add('hidden');
  }

  /* ---------------------------------------------------------------------
     Scroll-linked chrome: progress bar, header shadow, back-to-top ring
     --------------------------------------------------------------------- */
  function initScrollChrome() {
    const progressBar = document.getElementById('scroll-progress-bar');
    const header = document.getElementById('site-header');
    const backToTop = document.getElementById('back-to-top');
    const arc = document.getElementById('btt-arc');
    const RING_CIRCUMFERENCE = 2 * Math.PI * 20;

    let ticking = false;

    function update() {
      ticking = false;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(scrollTop / max, 1) : 0;

      if (progressBar) progressBar.style.width = `${ratio * 100}%`;
      if (header) header.classList.toggle('is-scrolled', scrollTop > 4);
      if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 480);
      if (arc) arc.style.strokeDasharray = `${ratio * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------------------------
     Reveal-on-scroll for top-level sections
     --------------------------------------------------------------------- */
  function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     Cursor glow — desktop, fine-pointer only
     --------------------------------------------------------------------- */
  function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow || !finePointer || reduceMotion) return;

    let raf = null;
    window.addEventListener('pointermove', (e) => {
      glow.classList.add('is-active');
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate3d(-50%, -50%, 0)`;
        raf = null;
      });
    }, { passive: true });

    window.addEventListener('pointerleave', () => glow.classList.remove('is-active'));
  }

  /* ---------------------------------------------------------------------
     Subtle 3D tilt on repo cards — desktop, fine-pointer only
     --------------------------------------------------------------------- */
  function attachTilt(card) {
    if (!finePointer || reduceMotion) return;
    const MAX = 5;

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  }

  /* ---------------------------------------------------------------------
     Count-up animation for totals
     --------------------------------------------------------------------- */
  function animateCount(el, target) {
    if (!el) return;
    if (reduceMotion || target === 0) {
      el.textContent = target;
      return;
    }
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setFooterTimestamp() {
    const el = document.getElementById('footer-updated');
    if (!el) return;
    const now = new Date();
    el.textContent = `Last checked ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  /* ---------------------------------------------------------------------
     Language -> accent color + monogram badge (no external icon assets)
     --------------------------------------------------------------------- */
  function getLangColor(language) {
    switch (language) {
      case 'C': return '#5b8cff';
      case 'C++': return '#ff79b0';
      case 'Java': return '#e0a63c';
      case 'Python': return '#e0c23c';
      case 'JavaScript': return '#e0d23c';
      case 'TypeScript': return '#5bb8ff';
      case 'HTML': return '#ff9c5b';
      case 'CSS': return '#8c7bff';
      default: return '#8a8fa3';
    }
  }

  function getLangGlyph(language) {
    if (!language) return '•';
    const map = {
      'C': 'C', 'C++': '++', 'C#': 'C#', 'Java': 'JV', 'Python': 'PY',
      'JavaScript': 'JS', 'TypeScript': 'TS', 'HTML': 'HT', 'CSS': 'CS',
      'Go': 'GO', 'Rust': 'RS', 'Ruby': 'RB', 'PHP': 'PH', 'Swift': 'SW',
      'Kotlin': 'KT', 'Shell': 'SH'
    };
    return map[language] || language.slice(0, 2).toUpperCase();
  }

  const svgStar = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6z"/></svg>`;
  const svgFork = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path stroke-linecap="round" d="M6 8.2V12a2 2 0 002 2h2m8-5.8V12a2 2 0 01-2 2h-2m-2 0v4"/></svg>`;
  const svgExternal = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`;
  const svgEmptyBox = `<svg class="state-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4m0-10v10m0-10l9-4v10l-9 4"/></svg>`;
  const svgWarning = `<svg class="state-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L2.5 17a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>`;

  /* ---------------------------------------------------------------------
     Current / totals
     --------------------------------------------------------------------- */
  function renderCurrentRepo(repos) {
    const banner = document.getElementById('current-repo');
    const link = document.getElementById('current-repo-link');
    const timeEl = document.getElementById('current-repo-time');
    if (!banner || !link || !timeEl) return;

    if (!Array.isArray(repos) || repos.length === 0) {
      banner.hidden = true;
      return;
    }

    const mostRecent = repos.slice().sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];

    link.textContent = mostRecent.name;
    link.href = mostRecent.html_url;
    timeEl.textContent = `Pushed ${relativeTime(mostRecent.pushed_at)}`;
    banner.hidden = false;
  }

  function renderTotals(repos) {
    const repoCount = document.getElementById('total-repos');
    const starCount = document.getElementById('total-stars');
    const forkCount = document.getElementById('total-forks');
    if (!repoCount || !starCount || !forkCount) return;

    const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    animateCount(repoCount, repos.length);
    animateCount(starCount, stars);
    animateCount(forkCount, forks);
  }

  /* ---------------------------------------------------------------------
     Repositories
     --------------------------------------------------------------------- */
  function sortRepos(repos, sortBy) {
    const sorted = repos.slice();
    switch (sortBy) {
      case 'stars':
        return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
      case 'forks':
        return sorted.sort((a, b) => b.forks_count - a.forks_count);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  }

  function renderRepoList(repos) {
    const container = document.getElementById('repos-list');
    container.innerHTML = '';

    if (!Array.isArray(repos) || repos.length === 0) {
      container.innerHTML = `<div class="repo-empty">${svgEmptyBox}No public repositories found.</div>`;
      return;
    }

    const topStarredId = repos.reduce((best, repo) =>
      !best || repo.stargazers_count > best.stargazers_count ? repo : best, null
    )?.id;

    repos.forEach((repo, i) => {
      const card = renderRepoCard(repo, repo.id === topStarredId && repo.stargazers_count > 0);
      if (i === 0 && repo.id === topStarredId && repo.stargazers_count > 0) {
        card.classList.add('repo-card--featured');
      }
      container.appendChild(card);
    });
  }

  function renderRepoCard(repo, isFeatured) {
    const langColor = getLangColor(repo.language);

    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      ${isFeatured ? `<span class="repo-ribbon">${svgStar}Top starred</span>` : ''}
      <div>
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-name">
          <span>${repo.name}</span>
          ${svgExternal}
        </a>
        <p class="repo-desc">${repo.description || 'No description provided.'}</p>
      </div>
      <div class="repo-meta">
        <span class="repo-lang">
          <span class="repo-lang-badge" style="background:${langColor}">${getLangGlyph(repo.language)}</span>
          ${repo.language || 'Text'}
        </span>
        <div class="repo-stats">
          <span>${svgStar}${repo.stargazers_count}</span>
          <span>${svgFork}${repo.forks_count}</span>
        </div>
      </div>
    `;
    attachTilt(card);
    return card;
  }

  function relativeTime(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  /* ---------------------------------------------------------------------
     Commits
     --------------------------------------------------------------------- */
  function renderCommitItem(commit) {
    const item = document.createElement('div');
    item.className = 'commit-item';
    item.innerHTML = `
      <span class="commit-node" aria-hidden="true"></span>
      <div class="commit-main">
        <a href="${commit.url}" target="_blank" rel="noopener" class="commit-message">${commit.message}</a>
        <span class="commit-repo">${commit.repo}</span>
      </div>
      <span class="commit-time">${relativeTime(commit.date)}</span>
    `;
    return item;
  }

  function renderCommitList(commits) {
    const container = document.getElementById('commits-list');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(commits) || commits.length === 0) {
      container.innerHTML = `<div class="commit-empty">No recent commits found.</div>`;
      return;
    }

    commits.forEach(commit => container.appendChild(renderCommitItem(commit)));
  }

  async function fetchRepoCommits(repoFullName) {
    const res = await fetch(githubProxyUrl(`repos/${repoFullName}/commits?per_page=5`));
    if (!res.ok) return [];

    const commits = await res.json();
    if (!Array.isArray(commits)) return [];

    return commits.map(commit => ({
      message: commit.commit.message.split('\n')[0],
      repo: repoFullName,
      date: commit.commit.author ? commit.commit.author.date : commit.commit.committer.date,
      url: commit.html_url
    }));
  }

  async function fetchRecentCommits() {
    const container = document.getElementById('commits-list');
    if (!container) return;

    try {
      const reposRes = await fetch(githubProxyUrl(`users/${USERNAME}/repos?sort=pushed&per_page=8`));

      if (reposRes.status === 401) {
        container.innerHTML = `<div class="commit-error">${svgWarning}GitHub token is invalid or expired.</div>`;
        return;
      }
      if (reposRes.status === 403) {
        container.innerHTML = `<div class="commit-error">${svgWarning}GitHub API rate limit reached. Try again in a few minutes.</div>`;
        return;
      }
      if (!reposRes.ok) throw new Error(`status ${reposRes.status}`);

      const repos = await reposRes.json();
      if (!Array.isArray(repos)) throw new Error('Unexpected response');

      const commitLists = await Promise.all(
        repos.map(repo => fetchRepoCommits(repo.full_name))
      );

      const commits = commitLists
        .flat()
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      renderCommitList(commits.slice(0, 8));

    } catch (err) {
      container.innerHTML = `<div class="commit-error">${svgWarning}Unable to load recent commits (${err.message}).</div>`;
    }
  }

  async function fetchGitHubRepos() {
    const container = document.getElementById('repos-list');
    const sortSelect = document.getElementById('repo-sort');

    try {
      const res = await fetch(githubProxyUrl(`users/${USERNAME}/repos?sort=updated&per_page=30`));

      if (res.status === 401) {
        container.innerHTML = `<div class="repo-error">${svgWarning}GitHub token is invalid or expired.</div>`;
        renderTotals([]);
        return;
      }
      if (res.status === 403) {
        container.innerHTML = `<div class="repo-error">${svgWarning}GitHub API rate limit reached. Try again in a few minutes.</div>`;
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);

      const repos = await res.json();
      if (!Array.isArray(repos)) throw new Error('Unexpected response');

      if (!Array.isArray(repos) || repos.length === 0) {
        container.innerHTML = `<div class="repo-empty">${svgEmptyBox}No public repositories found.</div>`;
        renderTotals([]);
        renderCurrentRepo([]);
        return;
      }

      renderTotals(repos);
      renderCurrentRepo(repos);
      renderRepoList(sortRepos(repos, sortSelect ? sortSelect.value : 'updated'));

      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          renderRepoList(sortRepos(repos, sortSelect.value));
        });
      }

    } catch (err) {
      container.innerHTML = `<div class="repo-error">${svgWarning}Unable to load public repositories (${err.message}).</div>`;
    }
  }

  async function fetchDeployInfo() {
    const badge = document.getElementById('deploy-badge');
    if (!badge) return;

    try {
      const res = await fetch('/api/deploy');
      if (!res.ok) {
        badge.textContent = '';
        return;
      }

      const data = await res.json();
      if (!data || !data.createdAt) {
        badge.textContent = '';
        return;
      }

      const sha = data.commitSha ? ` · ${data.commitSha}` : '';
      badge.textContent = `Deployed ${relativeTime(data.createdAt)}${sha}`;
    } catch (err) {
      badge.textContent = '';
    }
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  async function refreshDashboard() {
    setLoaderStage('Connecting to GitHub', 20);
    await Promise.all([
      fetchGitHubRepos().then(() => setLoaderStage('Compiling statistics', 70)),
      fetchRecentCommits(),
      fetchDeployInfo()
    ]);
    setLoaderStage('Ready', 100);
    setFooterTimestamp();
  }

  async function loadDashboard() {
    const loadStart = Date.now();

    initThemeToggle();
    initScrollChrome();
    initReveal();
    initCursorGlow();

    await refreshDashboard();

    const remaining = 1600 - (Date.now() - loadStart);
    setTimeout(hideLoadingScreen, Math.max(remaining, 0));

    setInterval(refreshDashboard, AUTO_REFRESH_MINUTES * 60 * 1000);
  }

  document.addEventListener('DOMContentLoaded', loadDashboard);
})();
      
