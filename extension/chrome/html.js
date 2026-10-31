const init = () => {
  const existingRoot = document.getElementById("manage-instagram-followers-root");
  if (existingRoot) existingRoot.remove();

  const icon = (name, size = 18, cls = "") =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true"><use href="#mif-i-${name}"/></svg>`;


  // IG Snapper logo: viewfinder frame + rotating aperture that "snaps".
  const logoMark = (cls = "", size = 32, draw = false) => {
    const d = draw ? ' pathLength="100"' : "";
    return `<svg class="snap-logo ${cls}${draw ? " lg-draw" : ""}" viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" aria-hidden="true" focusable="false">
      <g class="lg-frame" stroke="url(#mif-grad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path${d} d="M6 16V11a5 5 0 0 1 5-5h5"/>
        <path${d} d="M32 6h5a5 5 0 0 1 5 5v5"/>
        <path${d} d="M42 32v5a5 5 0 0 1-5 5h-5"/>
        <path${d} d="M16 42h-5a5 5 0 0 1-5-5v-5"/>
      </g>
      <circle class="lg-flash" cx="24" cy="24" r="10" stroke="url(#mif-grad-cool)" stroke-width="2"/>
      <g class="lg-spin"><g class="lg-snap"><g transform="translate(12 12)" stroke="url(#mif-grad)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <circle${d} cx="12" cy="12" r="10"/>
        <path${d} d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
      </g></g></g>
      <circle class="lg-core" cx="24" cy="24" r="2.4" fill="url(#mif-grad-cool)"/>
      <g class="lg-orbit"><circle cx="24" cy="2.6" r="1.7" fill="#4fe3ff"/></g>
    </svg>`;
  };

  const root = document.createElement("div");
  root.id = "manage-instagram-followers-root";
  root.innerHTML = `
    <svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mif-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8f7bff" />
          <stop offset="0.55" stop-color="#e45bd6" />
          <stop offset="1" stop-color="#ff8a5c" />
        </linearGradient>
        <linearGradient id="mif-grad-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4fe3ff" />
          <stop offset="1" stop-color="#8f7bff" />
        </linearGradient>
        <radialGradient id="mif-sweep" cx="0" cy="1" r="1">
          <stop offset="0" stop-color="#4fe3ff" stop-opacity="0.55" />
          <stop offset="1" stop-color="#4fe3ff" stop-opacity="0" />
        </radialGradient>
        <symbol id="mif-i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-x" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chevron-left" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-refresh" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6a7 7 0 0 0 12 2.5L20 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-shield" viewBox="0 0 24 24"><path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-star" viewBox="0 0 24 24"><path d="m12 3.6 2.55 5.2 5.7.83-4.13 4.02.98 5.7L12 16.7l-5.1 2.65.98-5.7L3.75 9.63l5.7-.83L12 3.6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-verified" viewBox="0 0 24 24"><path d="m12 2.8 2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1L12 2.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m8.6 12.1 2.3 2.3 4.5-4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-plus" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8c-.7-3.2-2.7-5-6-5s-5.3 1.8-6 5m13-9h5m-2.5-2.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-check" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.5 8c.7-3.2 2.7-5 6.5-5 1.6 0 3 .4 4 1.1m2 2.4 2 2 3.6-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-minus" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c.7-3.2 2.7-5 6-5s5.3 1.8 6 5m1-9h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-x" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c.7-3.2 2.7-5 6-5 1.9 0 3.4.5 4.5 1.5M16 9l5 5m0-5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-swap" viewBox="0 0 24 24"><path d="M7 7h12m0 0-3-3m3 3-3 3M17 17H5m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-save" viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5V4Zm3 0v5h7V4M8 20v-6h8v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-history" viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 4v4.5H8M12 8v4.5l3 1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-download" viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-table" viewBox="0 0 24 24"><path d="M4 5.5h16v13H4v-13Zm0 5h16M10 5.5v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-braces" viewBox="0 0 24 24"><path d="M9 4c-2 0-3 1-3 3v2c0 1.5-.8 2.5-2 3 1.2.5 2 1.5 2 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5.8 2.5 2 3-1.2.5-2 1.5-2 3v2c0 2-1 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-cloud-up" viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17 18M12 20v-7m0 0-2.5 2.5M12 13l2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-rotate" viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5m0-4.5v4.5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 10.5V16m0-8.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-alert" viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4L12 4Zm0 5.5v4.5m0 2.7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="m8 12.4 2.8 2.8 5.2-5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-sparkle" viewBox="0 0 24 24"><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-compare" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5.5" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="12" r="5.5" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="currentColor"/></symbol>
        <symbol id="mif-i-sliders" viewBox="0 0 24 24"><path d="M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-copy" viewBox="0 0 24 24"><path d="M9 9h10.5v11H9V9Zm-4 7V4h10.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-stop" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-eraser" viewBox="0 0 24 24"><path d="m5 15 8-9.5 6 5-6.5 8H8L5 15Zm3 3.5h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-checks" viewBox="0 0 24 24"><path d="m3.5 12.5 3.5 3.5 6-7m-1 7.5 1 .5 7-8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chart" viewBox="0 0 24 24"><path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      </defs>
    </svg>

    <div class="overlay" id="overlay">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <section class="my-component" role="dialog" aria-modal="true" aria-labelledby="appTitle" aria-describedby="info-text">
        <span class="panel-spotlight" aria-hidden="true"></span>

        <div class="preloader" aria-hidden="true">
          <div class="pre-grid"></div>
          <div class="pre-core">
            <svg class="pre-logo" viewBox="0 0 120 120" width="150" height="150" fill="none">
              <circle class="pre-ring pre-ring-a" cx="60" cy="60" r="56" stroke="url(#mif-grad)" stroke-width="1.5" pathLength="100" />
              <circle class="pre-ring pre-ring-b" cx="60" cy="60" r="46" stroke="url(#mif-grad-cool)" stroke-width="1" pathLength="100" />
              <g class="pre-orbit"><circle cx="60" cy="4" r="3.4" fill="url(#mif-grad)" /></g>
              <g class="pre-orbit pre-orbit-rev"><circle cx="60" cy="14" r="2.4" fill="#4fe3ff" /></g>
            </svg>
            ${logoMark("pre-snap", 82, true)}
          </div>
          <p class="pre-title"><span>IG</span><b>Snapper</b></p>
          <div class="pre-progress"><i></i><span class="pre-pct"></span></div>
          <p class="pre-credit"><span>Made by</span><strong>Alexander Weng</strong></p>
        </div>

        <header class="app-header">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">${logoMark("bm-logo", 36)}</span>
            <div class="brand-copy">
              <h1 id="appTitle" data-i18n="appTitle">IG Snapper</h1>
              <p class="app-kicker"><span class="live-dot" aria-hidden="true"></span>Instagram<span class="kicker-sep" aria-hidden="true"></span><span class="kicker-ver">v2.3.1</span></p>
            </div>
          </div>

          <div class="header-actions">
            <button type="button" id="licenseChip" class="license-chip" hidden>${icon("shield", 14)}<span id="licenseChipText"></span></button>
            <div class="language-switch" role="group" aria-label="Language" data-active="en">
              <span class="lang-thumb" aria-hidden="true"></span>
              <button type="button" class="language-button" data-locale="th" aria-pressed="false">TH</button>
              <button type="button" class="language-button" data-locale="en" aria-pressed="true">ENG</button>
            </div>
            <button type="button" id="historyButton" class="icon-button history-trigger" data-i18n-aria-label="history" aria-label="History" data-i18n-title="history" title="History">${icon("history", 20)}</button>
            <button type="button" id="closeExtensionButton" class="icon-button" data-i18n-aria-label="close" aria-label="Close">${icon("x", 20)}</button>
          </div>
        </header>

        <div id="licenseBanner" class="license-banner" hidden>
          <span class="lb-icon" aria-hidden="true">${icon("lock", 16)}</span>
          <span class="lb-text" data-i18n="licenseBannerText">IG Snapper is not activated yet.</span>
          <button type="button" id="licenseBannerButton" class="license-banner-button" data-i18n="licenseBannerButton">Enter key</button>
        </div>

        <div class="intro-block">
          <div class="hero">
            <div class="hero-copy">
              <span class="intro-eyebrow">${icon("sparkle", 14)}<span data-i18n="introEyebrow">Connection checkup</span></span>
              <h2 data-i18n="introTitle">See who doesn’t follow you back.</h2>
              <p id="info-text" data-i18n="introBody">Compare your connections, find non-followers, and clean up your following list.</p>
              <button type="button" id="findNonFollowersButton" class="primary-cta data-action-control">
                <span class="cta-label" data-i18n="findNonFollowers">Find non-followers</span>
                <span class="cta-arrow">${icon("arrow-right", 18)}</span>
                <i class="cta-shine" aria-hidden="true"></i>
              </button>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <svg viewBox="0 0 200 200" width="200" height="200" fill="none">
                <circle cx="100" cy="100" r="92" class="rd-ring" />
                <circle cx="100" cy="100" r="68" class="rd-ring" />
                <circle cx="100" cy="100" r="44" class="rd-ring" />
                <circle cx="100" cy="100" r="20" class="rd-ring" />
                <path class="rd-axis" d="M100 8v184M8 100h184" />
                <g class="rd-sweep"><path d="M100 100V8A92 92 0 0 1 192 100Z" fill="url(#mif-sweep)" /><path d="M100 100V8" stroke="#4fe3ff" stroke-width="1.5" stroke-linecap="round" /></g>
                <circle class="rd-dot rd-dot-a" cx="146" cy="62" r="4" />
                <circle class="rd-dot rd-dot-b" cx="62" cy="128" r="3.4" />
                <circle class="rd-dot rd-dot-c" cx="128" cy="142" r="3" />
                <circle class="rd-dot rd-dot-d" cx="78" cy="58" r="2.6" />
                <circle cx="100" cy="100" r="5" fill="url(#mif-grad)" />
              </svg>
            </div>
          </div>

          <p class="privacy-note">
            ${icon("shield", 16)}
            <span data-i18n="privacyNote">Your connection data stays in this browser.</span>
          </p>
        </div>

        <nav id="listTabs" class="list-tabs" aria-label="Connection lists" data-i18n-aria-label="listsLabel" hidden>
          <button type="button" id="loadFollowingButton" class="list-tab data-action-control">
            ${icon("user-check", 18)}
            <span data-i18n="followingTab">Following</span>
          </button>
          <button type="button" id="loadFollowersButton" class="list-tab data-action-control">
            ${icon("user-plus", 18)}
            <span data-i18n="followersTab">Followers</span>
          </button>
        </nav>

        <div id="notice" class="notice" role="status" aria-live="polite" hidden>
          <span class="notice-icon">
            ${icon("info", 18, "ni ni-info")}${icon("alert", 18, "ni ni-warning")}${icon("alert", 18, "ni ni-error")}${icon("check-circle", 18, "ni ni-success")}
          </span>
          <span id="noticeText"></span>
          <button type="button" id="dismissNoticeButton" class="notice-dismiss" data-i18n-aria-label="dismiss" aria-label="Dismiss">${icon("x", 16)}</button>
        </div>

        <div class="workspace" id="workspace" hidden>
          <div id="titleAndFilter" class="list-heading">
            <div class="title-copy">
              <button type="button" id="backHomeButton" class="back-button" data-i18n-aria-label="backHome" aria-label="Back to start">${icon("chevron-left", 18)}</button>
              <div class="title-text">
                <h2 id="title">Following</h2>
                <p id="resultsSummary" class="results-summary" aria-live="polite"></p>
              </div>
              <button type="button" id="refreshButton" class="refresh-button data-action-control" data-i18n-aria-label="refresh" aria-label="Refresh">${icon("refresh", 18)}</button>
            </div>
            <div class="filter-buttons">
              <button type="button" id="filterAllButton" class="filter data-action-control filter-active" data-filter="all"><span data-i18n="allFilter">All</span><span class="filter-count" data-count="all"></span></button>
              <button type="button" id="filterNotFollowingBackButton" class="filter data-action-control" data-filter="notFollowingBack"><span data-i18n="nonFollowersFilter">Not following you</span><span class="filter-count" data-count="notFollowingBack"></span></button>
              <button type="button" id="filterMutualButton" class="filter data-action-control" data-filter="mutual"><span data-i18n="mutualFilter">Mutual</span><span class="filter-count" data-count="mutual"></span></button>
              <button type="button" id="filterNotFollowedBackButton" class="filter data-action-control" data-filter="notFollowedBack"><span data-i18n="notFollowedBackFilter">You don’t follow</span><span class="filter-count" data-count="notFollowedBack"></span></button>
              <button type="button" id="filterRequestedButton" class="filter data-action-control" data-filter="requested"><span data-i18n="requestedFilter">Requested</span><span class="filter-count" data-count="requested"></span></button>
            </div>
          </div>

          <div class="input-group" id="searchGroup">
            <div class="search-control">
              <label for="searchInput" class="sr-only" data-i18n="searchLabel">Search accounts</label>
              <div class="search-field">
                ${icon("search", 18)}
                <input type="search" id="searchInput" data-i18n-placeholder="searchPlaceholder" placeholder="Username or name" autocomplete="off" />
              </div>
            </div>
            <div class="sort-control">
              <label for="sortSelect" class="sr-only" data-i18n="sortLabel">Sort</label>
              <div class="select-wrap">
                <select id="sortSelect" class="sort-select data-action-control">
                  <option value="relationship" data-i18n="sortRelationship">Relationship</option>
                  <option value="username" data-i18n="sortUsername">Username</option>
                  <option value="name" data-i18n="sortName">Name</option>
                  <option value="ratio" data-i18n="sortRatio">Follower ratio</option>
                </select>
                ${icon("chevron-down", 16)}
              </div>
            </div>
            <div class="signal-control">
              <label for="signalFilter" class="sr-only" data-i18n="signalLabel">Signals</label>
              <div class="select-wrap">
                <select id="signalFilter" class="sort-select data-action-control">
                  <option value="all" data-i18n="signalAll">All signals</option>
                  <option value="protected" data-i18n="signalProtected">Protected</option>
                  <option value="verified" data-i18n="signalVerified">Verified</option>
                  <option value="private" data-i18n="signalPrivate">Private</option>
                  <option value="highRatio" data-i18n="signalHighRatio">High follower ratio</option>
                </select>
                ${icon("chevron-down", 16)}
              </div>
            </div>
          </div>

          <p id="updatedAt" class="updated-at" aria-live="polite"></p>

          <div class="user-list" id="userList"></div>

          <div class="loader" id="loader" aria-hidden="true">
            <div class="scan-visual" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="96" height="96" fill="none">
                <circle cx="60" cy="60" r="54" class="sc-ring" />
                <circle cx="60" cy="60" r="36" class="sc-ring" />
                <circle cx="60" cy="60" r="18" class="sc-ring" />
                <g class="sc-sweep"><path d="M60 60V6A54 54 0 0 1 114 60Z" fill="url(#mif-sweep)" /><path d="M60 60V6" stroke="#4fe3ff" stroke-width="1.5" stroke-linecap="round" /></g>
                <circle class="sc-blip sc-blip-a" cx="88" cy="38" r="3" />
                <circle class="sc-blip sc-blip-b" cx="38" cy="78" r="2.6" />
                <circle cx="60" cy="60" r="3.6" fill="url(#mif-grad)" />
              </svg>
            </div>
            <p id="loadingProgress" class="loading-progress" data-i18n="loadingConnections">Comparing your connections…</p>
            <div class="scan-bar" aria-hidden="true"><i></i></div>
            <button type="button" id="cancelLoadButton" class="text-button loader-cancel"><span data-i18n="cancelLoad">Cancel</span></button>
          </div>

          <details class="advanced-panel" id="advancedPanel">
            <summary>
              <span class="adv-icon">${icon("sliders", 18)}</span>
              <span class="adv-text"><span data-i18n="advancedTitle">Tools</span><span class="advanced-summary-note" data-i18n="advancedSummary">Export and backup</span></span>
              ${icon("chevron-down", 18, "adv-chevron")}
            </summary>
          <div class="tools-grid">
            <button type="button" class="tool-button" id="saveSnapshotButton">${icon("save", 16)}<span data-i18n="saveSnapshot">Save snapshot</span></button>
            <button type="button" class="tool-button" id="exportCsvButton">${icon("table", 16)}<span data-i18n="exportCsv">Export CSV</span></button>
            <button type="button" class="tool-button" id="exportJsonButton">${icon("braces", 16)}<span data-i18n="exportJson">Export JSON</span></button>
            <button type="button" class="tool-button" id="backupButton">${icon("cloud-up", 16)}<span data-i18n="backup">Backup</span></button>
            <button type="button" class="tool-button" id="restoreButton">${icon("rotate", 16)}<span data-i18n="restore">Restore</span></button>
            <input type="file" id="restoreInput" accept="application/json,.json" hidden>
          </div>
            <button type="button" id="copyDiagnosticsButton" class="diagnostic-button">${icon("copy", 16)}<span data-i18n="copyDiagnostics">Copy diagnostic report</span></button>
          </details>
        </div>

        <footer class="app-footer">
          <div class="footer-status">
            <span class="status-dot" aria-hidden="true"></span>
            <span data-i18n="footerNote">Actions are verified with Instagram before the interface changes.</span>
          </div>
          <div class="developer-credit" aria-label="Made by Alexander Weng">
            <span class="credit-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="none"><path d="M3 22 8 8l5 14M5 17.5h6" stroke="url(#mif-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m15.5 8 2.2 14 3.3-9 3.3 9 2.2-14" stroke="url(#mif-grad-cool)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="credit-text"><span class="credit-label">Made by</span><strong class="credit-name">Alexander Weng</strong></span>
          </div>
        </footer>

        <div id="historyDialog" class="confirm-backdrop" hidden>
          <div class="history-card" role="dialog" aria-modal="true" aria-labelledby="historyTitle">
            <div class="history-header">
              <span class="dialog-icon">${icon("history", 20)}</span>
              <div>
                <h2 id="historyTitle" data-i18n="historyTitle">Scan history</h2>
                <p id="historySubtitle" class="results-summary" data-i18n="historySubtitle">Local snapshots and changes since previous scans.</p>
              </div>
              <button type="button" id="closeHistoryButton" class="icon-button" data-i18n-aria-label="closeHistory" aria-label="Close history">${icon("x", 20)}</button>
            </div>
            <div id="historySummary" class="history-summary"></div>
            <div id="historyList" class="history-list"></div>
            <div id="historyDetail" class="history-detail" hidden>
              <div class="detail-top">
                <button type="button" id="historyDetailBack" class="text-button detail-back">${icon("chevron-left", 16)}<span data-i18n="historyDetailBack">Back to history</span></button>
                <button type="button" id="historyCopyButton" class="text-button detail-copy">${icon("copy", 16)}<span data-i18n="copyUsernames">Copy usernames</span></button>
              </div>
              <p id="historyDetailRange" class="detail-range"></p>
              <div id="historyDetailTabs" class="detail-tabs" role="tablist"></div>
              <p id="historyDetailNote" class="detail-note"></p>
              <div id="historyDetailList" class="profile-grid"></div>
            </div>
          </div>
        </div>

        <div id="licenseDialog" class="confirm-backdrop" hidden>
          <div class="confirm-card license-card" role="dialog" aria-modal="true" aria-labelledby="licenseTitle">
            <span class="dialog-icon">${icon("shield", 22)}</span>
            <h2 id="licenseTitle" data-i18n="licenseTitle">Activate IG Snapper</h2>
            <p data-i18n="licenseBody">Enter your license key to unlock the app. One key works on 1 Instagram account and up to 2 browsers.</p>
            <input type="text" id="licenseInput" class="license-input" placeholder="IGS-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" spellcheck="false" maxlength="40" />
            <p id="licenseMessage" class="license-message" role="status" aria-live="polite"></p>
            <a id="licenseBuyLink" class="license-buy" target="_blank" rel="noopener noreferrer" hidden><span data-i18n="licenseGetKey">Get a key</span>${icon("arrow-right", 14)}</a>
            <div class="confirm-actions">
              <button type="button" id="licenseCloseButton" class="text-button" data-i18n="cancel">Cancel</button>
              <button type="button" id="licenseActivateButton" class="license-activate" data-i18n="licenseActivate">Activate</button>
            </div>
          </div>
        </div>

      </section>
    </div>

    <div class="hud-orb" id="hudOrb" role="button" tabindex="0" hidden data-i18n-aria-label="orbOpen" aria-label="Open IG Snapper">
      <span class="orb-halo" aria-hidden="true"></span>
      <svg class="orb-ring" viewBox="0 0 84 84" fill="none" aria-hidden="true">
        <circle class="orb-ring-a" cx="42" cy="42" r="39" stroke="url(#mif-grad)" stroke-width="2" stroke-linecap="round" stroke-dasharray="46 22 18 24" />
        <circle class="orb-ring-b" cx="42" cy="42" r="33" stroke="url(#mif-grad-cool)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 9" />
      </svg>
      <span class="orb-core" aria-hidden="true">${logoMark("orb-logo", 42)}</span>
      <span class="orb-badge" id="hudOrbBadge" hidden>0</span>
      <button type="button" class="orb-quit" id="hudOrbQuit" data-i18n-aria-label="orbQuit" aria-label="Quit IG Snapper">${icon("x", 12)}</button>
      <span class="orb-name" aria-hidden="true"><i class="orb-name-dot"></i>IG Snapper</span>
    </div>
  `;

  document.body.insertBefore(root, document.body.firstChild);

  const preloader = root.querySelector(".preloader");
  setTimeout(() => preloader?.remove(), 3200);
};

init();

if (!window.__manageInstagramFollowersStorageBridge) {
  window.__manageInstagramFollowersStorageBridge = true;
  window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data?.mifStorage) return;
    const { action, payload, requestId } = event.data;

    if (action === "get") {
      const state = await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "get",
        payload: { accountId: String(payload?.accountId || "default") },
      });
      window.postMessage(
        {
          mifStorage: true,
          action: "state",
          requestId,
          payload: {
            locale: state?.locale,
            rateLimits: state?.rateLimits,
            whitelist: state?.whitelist,
            snapshots: state?.snapshots,
            settings: state?.settings,
          },
        },
        window.location.origin
      );
    }

    if (action === "license") {
      const result = await chrome.runtime.sendMessage({
        mifLicense: true,
        op: payload?.op === "activate" ? "activate" : "status",
        key: String(payload?.key || "").slice(0, 64),
        accountId: String(payload?.accountId || "").slice(0, 24),
      });
      window.postMessage(
        { mifStorage: true, action: "licenseResult", requestId, payload: result || { active: false, reason: "server_error" } },
        window.location.origin
      );
      return;
    }

    if (action === "setLocale" && ["en", "th"].includes(payload)) {
      await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "setLocale",
        payload,
      });
    }

    if (action === "setState") {
      const payload = event.data?.payload || {};
      const sanitizedWhitelist = Array.isArray(payload.whitelist)
        ? payload.whitelist.map((value) => String(value)).filter(Boolean).slice(0, 5000)
        : [];
      const accountId = String(payload.accountId || "default");
      const existing = await chrome.storage.local.get("whitelists");
      const whitelists = existing.whitelists && typeof existing.whitelists === "object"
        ? existing.whitelists
        : {};
      whitelists[accountId] = sanitizedWhitelist;
      const existingSnapshotsState = await chrome.storage.local.get("snapshots");
      const incomingSnapshots = Array.isArray(payload.snapshots) ? payload.snapshots.slice(0, 12) : [];
      const otherAccountSnapshots = Array.isArray(existingSnapshotsState.snapshots)
        ? existingSnapshotsState.snapshots.filter((snapshot) => String(snapshot?.viewerId || "default") !== accountId)
        : [];
      const snapshots = [...incomingSnapshots, ...otherAccountSnapshots]
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0))
        .slice(0, 48);
      const sanitized = {
        locale: ["en", "th"].includes(payload.locale) ? payload.locale : "en",
        snapshots,
        settings: payload.settings && typeof payload.settings === "object" ? payload.settings : {},
        whitelists,
      };
      await chrome.storage.local.set(sanitized);
      if (payload.rateLimits) {
        const rateLimits = {
          follow: Array.isArray(payload.rateLimits.follow) ? payload.rateLimits.follow.filter(Number.isFinite).slice(-60) : [],
        };
        await chrome.storage.session.set({ rateLimits });
      }
      window.postMessage({ mifStorage: true, action: "saved", requestId }, window.location.origin);
      return;
    }

    if (action === "setRateLimits") {
      const sanitized = {
        follow: Array.isArray(payload?.follow)
          ? payload.follow.filter(Number.isFinite)
          : [],
      };
      await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "setRateLimits",
        payload: sanitized,
      });
    }
  });
}
