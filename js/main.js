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
      window.dispatchEvent(new Event("erossarc-theme-change"));
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
     Structure chart (replaces the old static isometric render)
  --------------------------------------------------------------------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function initStructureChart() {
    const canvas = document.getElementById("structureCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const support = 4214.0, resistance = 4388.5;
    let candles = [];
    let visible = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function seed(n, startPrice) {
      const out = [];
      let last = startPrice != null ? startPrice : (support + resistance) / 2;
      for (let i = 0; i < n; i++) {
        const open = last;
        let close = open + (Math.random() - 0.5) * 22;
        close = Math.min(Math.max(close, support + 6), resistance - 6);
        const high = Math.max(open, close) + Math.random() * 8;
        const low = Math.min(open, close) - Math.random() * 8;
        out.push({ open, close, high, low });
        last = close;
      }
      return out;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const shown = candles.slice(0, visible);
      if (!shown.length) return;

      const orange = cssVar("--orange") || "#FF5A1F";
      const ink = cssVar("--ink") || "#16150F";
      const lineSoft = cssVar("--line-soft") || "rgba(0,0,0,.14)";

      const yFor = v => h - ((v - (support - 20)) / ((resistance + 20) - (support - 20))) * h;

      // support / resistance dashed lines
      [support, resistance].forEach(level => {
        ctx.strokeStyle = orange;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([4 * dpr, 5 * dpr]);
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, yFor(level));
        ctx.lineTo(w, yFor(level));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const slot = w / candles.length;
      const bodyW = Math.max(slot * 0.5, 2 * dpr);

      shown.forEach((c, i) => {
        const x = i * slot + slot / 2;
        const bullish = c.close >= c.open;
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, yFor(c.high));
        ctx.lineTo(x, yFor(c.low));
        ctx.stroke();

        const yOpen = yFor(c.open), yClose = yFor(c.close);
        const top = Math.min(yOpen, yClose);
        const bh = Math.max(Math.abs(yClose - yOpen), 1.5 * dpr);
        ctx.globalAlpha = bullish ? 0.9 : 0.35;
        ctx.fillStyle = bullish ? orange : ink;
        ctx.fillRect(x - bodyW / 2, top, bodyW, bh);
        ctx.globalAlpha = 1;
      });
    }

    resize();
    candles = seed(38);
    visible = 1;
    draw();

    const grow = setInterval(() => {
      visible++;
      draw();
      if (visible >= candles.length) clearInterval(grow);
    }, 55);

    setInterval(() => {
      const prevClose = candles[candles.length - 1].close;
      const next = seed(1, prevClose)[0];
      candles.push(next);
      candles.shift();
      visible = candles.length;
      draw();
    }, 1800);

    window.addEventListener("resize", () => { resize(); draw(); }, { passive: true });
    window.addEventListener("erossarc-theme-change", draw);
  }

  /* ---------------------------------------------------------------------
     Manifest panel sparkline ("SESSION_FLOW")
  --------------------------------------------------------------------- */
  function initSparkChart() {
    const canvas = document.getElementById("sparkCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const POINTS = 24;
    let values = Array.from({ length: POINTS }, () => 0.3 + Math.random() * 0.7);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const orange = cssVar("--orange") || "#FF5A1F";
      const step = w / (POINTS - 1);

      ctx.beginPath();
      values.forEach((v, i) => {
        const x = i * step;
        const y = h - v * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = orange;
      ctx.lineWidth = 1.6 * dpr;
      ctx.stroke();

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = orange;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    resize();
    draw();
    window.addEventListener("erossarc-theme-change", draw);

    setInterval(() => {
      values.shift();
      const last = values[values.length - 1];
      let next = last + (Math.random() - 0.5) * 0.3;
      next = Math.min(Math.max(next, 0.08), 0.95);
      values.push(next);
      draw();
    }, 900);

    window.addEventListener("resize", () => { resize(); draw(); }, { passive: true });
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
    initStructureChart();
    initSparkChart();

    setInterval(renderTick, 1000);
    setInterval(renderSessions, 30000);
    setInterval(renderMetrics, 4000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
