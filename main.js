/**
 * main.js — EROSSARC v2 (technical/dashboard theme)
 * Handles: theme toggle + persistence, mobile menu, live session-status
 * table (computed from real UTC time), dashboard tick/throughput animation,
 * and population of the education grids + markets strip.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Theme toggle
  --------------------------------------------------------------------- */
  function initTheme() {
    const root = document.documentElement;
    const toggle = document.getElementById("themeToggle");
    const stored = localStorage.getItem("erossarc-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", stored || (prefersDark ? "dark" : "light"));

    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("erossarc-theme", next);
    });
  }

  /* ---------------------------------------------------------------------
     Mobile menu
  --------------------------------------------------------------------- */
  function initMobileMenu() {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;
    function close() { menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); }
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  }

  /* ---------------------------------------------------------------------
     Session status (real UTC-based approximation)
  --------------------------------------------------------------------- */
  const SESSIONS = [
    { name: "SYDNEY",   openUTC: 22, closeUTC: 7,  offset: 11 },
    { name: "TOKYO",    openUTC: 0,  closeUTC: 9,  offset: 9  },
    { name: "LONDON",   openUTC: 8,  closeUTC: 17, offset: 1  },
    { name: "NEW YORK", openUTC: 13, closeUTC: 22, offset: -4 }
  ];

  function isOpen(session, utcHour) {
    if (session.openUTC < session.closeUTC) {
      return utcHour >= session.openUTC && utcHour < session.closeUTC;
    }
    // wraps past midnight (e.g. Sydney)
    return utcHour >= session.openUTC || utcHour < session.closeUTC;
  }

  function localTimeString(offsetHours) {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utcMs + offsetHours * 3600000);
    return local.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function renderSessions() {
    const tbody = document.querySelector("#sessionTable tbody");
    const nowUTC = new Date();
    const utcHour = nowUTC.getUTCHours() + nowUTC.getUTCMinutes() / 60;
    let openCount = 0;

    tbody.innerHTML = SESSIONS.map(s => {
      const open = isOpen(s, utcHour);
      if (open) openCount++;
      return `<tr>
        <td>${s.name}</td>
        <td><span class="status-dot ${open ? "on" : "off"}"></span>${open ? "ONLINE" : "CLOSED"}</td>
        <td>${localTimeString(s.offset)}</td>
      </tr>`;
    }).join("");

    const pct = Math.round((openCount / SESSIONS.length) * 100);
    document.getElementById("tpFill").style.width = pct + "%";
    document.getElementById("tpPct").textContent = pct + "%";
  }

  function renderTick() {
    const el = document.getElementById("dashTick");
    if (!el) return;
    const n = Math.floor(Date.now() / 1000) % 10000;
    el.textContent = "TICK:" + String(n).padStart(4, "0");
  }

  /* ---------------------------------------------------------------------
     Market metrics (light simulation for the dashboard numbers)
  --------------------------------------------------------------------- */
  function renderMetrics() {
    const vol = (0.18 + Math.random() * 0.35).toFixed(2);
    document.getElementById("mVol").textContent = vol + "%";
  }

  /* ---------------------------------------------------------------------
     Tracking-since counter
  --------------------------------------------------------------------- */
  function initTrackingSince() {
    const el = document.getElementById("trackingSince");
    if (!el) return;
    const launch = new Date("2026-01-01T00:00:00Z").getTime();
    function tick() {
      const diff = Date.now() - launch;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }
    tick();
    setInterval(tick, 1000);
  }

  function renderLiveReaders() {
    const el = document.getElementById("liveReaders");
    if (!el) return;
    el.textContent = (12 + Math.floor(Math.random() * 40)).toString();
  }

  /* ---------------------------------------------------------------------
     Education content grids
  --------------------------------------------------------------------- */
  const CONCEPTS = [
    { tag: "FOUNDATION", title: "Risk Management", body: "Sizing every position so no single trade can meaningfully damage the account." },
    { tag: "MINDSET", title: "Trading Psychology", body: "How fear, greed and boredom quietly override a plan that looked fine on paper." },
    { tag: "PATTERN", title: "Candlestick Patterns", body: "Each candle records a battle between buyers and sellers over one period." },
    { tag: "LEVEL", title: "Support & Resistance", body: "Price levels where past buying or selling was strong enough to pause a move." },
    { tag: "FLOW", title: "Liquidity", body: "Where stop-losses and pending orders cluster, often pulling price toward them first." },
    { tag: "FRAMEWORK", title: "Market Structure", body: "The sequence of highs and lows that defines trend, and when that sequence breaks." },
    { tag: "IMBALANCE", title: "Supply & Demand", body: "Zones where price moved away quickly, implying an imbalance not yet resolved." },
    { tag: "DIRECTION", title: "Trend", body: "The path of least resistance — trading with it stacks probability in your favor." },
    { tag: "SPACE", title: "Blockchain & Crypto", body: "The settlement layer beneath digital assets, and why their liquidity behaves differently." }
  ];

  const INDICATORS = [
    { tag: "TREND", title: "Moving Average", body: "Smooths price into a single line by averaging recent closes." },
    { tag: "TREND", title: "EMA", body: "Weights recent candles more heavily, reacting faster than a simple average." },
    { tag: "MOMENTUM", title: "RSI", body: "Measures the speed of recent price change on a 0–100 scale." },
    { tag: "MOMENTUM", title: "MACD", body: "Tracks the relationship between two EMAs to reveal momentum shifts early." },
    { tag: "VOLATILITY", title: "Bollinger Bands", body: "Bands that widen and narrow with volatility around a moving average." },
    { tag: "PARTICIPATION", title: "Volume", body: "Confirms whether a move has real participation behind it." },
    { tag: "VOLATILITY", title: "ATR", body: "Average True Range — a common input for setting stop-loss distance." },
    { tag: "REFERENCE", title: "Timeframes & Chart Types", body: "The same chart tells a different story depending on the view you choose." }
  ];

  const MECHANICS = [
    { tag: "SESSION", title: "London / New York / Tokyo / Sydney", body: "Each session carries different liquidity and volatility characteristics." },
    { tag: "EXPOSURE", title: "Leverage & Margin", body: "Borrowed exposure that multiplies both gains and losses relative to deposited capital." },
    { tag: "COST", title: "Spread", body: "The gap between the buy and sell price — the built-in cost of entering a trade." },
    { tag: "SIZING", title: "Lot Size & Pips", body: "Standardized contract sizes and the smallest price movement, used to size every trade." },
    { tag: "PLANNING", title: "Risk Reward", body: "The ratio between what's risked and what's targeted on a single trade." },
    { tag: "EXIT", title: "Stop Loss & Take Profit", body: "Pre-defined exits that remove emotion from when a trade actually closes." },
    { tag: "PLATFORM", title: "TradingView", body: "Where most of this curriculum is meant to be practiced, chart in hand." },
    { tag: "INDICES", title: "Indices & Commodities", body: "Baskets and physical assets, priced through the same charting language." }
  ];

  function cardHTML(item) {
    return `<div class="tech-card"><p class="tech-tag">${item.tag}</p><h4>${item.title}</h4><p>${item.body}</p></div>`;
  }
  function renderGrid(id, items) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = items.map(cardHTML).join("");
  }

  const MARKETS_COVERED = ["FOREX", "CRYPTO", "BLOCKCHAIN", "INDICES", "COMMODITIES", "EQUITIES", "GOLD", "OIL"];
  function renderMarketsStrip() {
    const el = document.getElementById("marketsStrip");
    if (!el) return;
    el.innerHTML = MARKETS_COVERED.map(m => `<div class="strip-item">${m}</div>`).join("");
  }

  /* ---------------------------------------------------------------------
     INIT
  --------------------------------------------------------------------- */
  function init() {
    initTheme();
    initMobileMenu();
    initTrackingSince();
    renderGrid("conceptsGrid", CONCEPTS);
    renderGrid("indicatorsGrid", INDICATORS);
    renderGrid("mechanicsGrid", MECHANICS);
    renderMarketsStrip();
    renderSessions();
    renderTick();
    renderMetrics();
    renderLiveReaders();

    setInterval(renderTick, 1000);
    setInterval(renderSessions, 30000);
    setInterval(renderMetrics, 4000);
    setInterval(renderLiveReaders, 6000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
