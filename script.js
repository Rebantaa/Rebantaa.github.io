/* ============================================================
   Rebanta Daadhiich — Portfolio interactions
   - Facts search (always random from Useless Facts API — intentionally playful)
   - Mobile hamburger menu
   - Floating back-to-top button
   - Experience timeline scroll animation
   - Live navbar greeting + clock
   - Footer year
   All client-side. No API keys. CORS-friendly endpoints only.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var hamburger  = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ============================================================
     FACTS SEARCH
     The search bar is intentionally playful: whatever the user types,
     the system always returns a random useless fact. The query is kept
     visible on the card to make the randomness feel deliberate.
     ============================================================ */
  var form     = document.getElementById("searchForm");
  var input    = document.getElementById("searchInput");
  var clearBtn = document.getElementById("clearBtn");
  var region   = document.getElementById("factRegion");

  var TIMEOUT_MS     = 6000;
  var MAX_SAFE_TRIES = 3;
  var FACTS_URL      = "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en";

  /* Stored for display only — never used to filter or route API calls */
  var displayQuery = "";

  /* ---------- Fetch with timeout ---------- */
  function fetchWithTimeout(url, opts) {
    opts = opts || {};
    var controller = new AbortController();
    var id = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
      .finally(function () { clearTimeout(id); });
  }

  /* ---------- Safety filter ---------- */
  var UNSAFE_WORDS = [
    "sex", "sexual", "porn", "nude", "naked", "penis", "vagina", "genital",
    "orgasm", "masturbat", "erotic", "fuck", "shit", "bitch", "bastard",
    "prostitut", "brothel", "incest", "rape", "fetish",
    "racist", "racism", "nazi", "hitler", "slur", "bigot", "supremac",
    "murder", "kill", "death", "corpse", "gore", "behead", "torture",
    "massacre", "shooting", "stab", "execut", "mutilat", "cannibal",
    "suicide", "self-harm", "self harm", "overdose",
    "cocaine", "heroin", "marijuana", "cannabis", "narcotic", "drug",
    "trump", "biden", "election", "democrat", "republican", "abortion",
    "islam", "muslim", "christian", "jewish", "hindu", "religion", "terroris"
  ];
  var UNSAFE_RE = new RegExp("\\b(" + UNSAFE_WORDS.join("|") + ")", "i");

  function isSafeFact(text) {
    if (!text || typeof text !== "string") return false;
    return !UNSAFE_RE.test(text);
  }

  /* ---------- Useless Facts API ---------- */
  function getRandomFact() {
    return fetchWithTimeout(FACTS_URL, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("fact request failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.text) throw new Error("no fact text");
        return data.text;
      });
  }

  /* Retries up to MAX_SAFE_TRIES times to get a clean fact */
  function getSafeFact(triesLeft) {
    if (triesLeft === undefined) triesLeft = MAX_SAFE_TRIES;
    return getRandomFact().then(function (text) {
      if (isSafeFact(text)) return text;
      if (triesLeft > 1) return getSafeFact(triesLeft - 1);
      throw new Error("no clean fact");
    });
  }

  /* ---------- Render helpers ---------- */
  function renderLoading() {
    region.innerHTML =
      '<div class="fact-card"><p class="fact-loading">Fetching useless intelligence…</p></div>';
  }

  /* Builds the intel-report card.
     displayQuery is shown as "Query received: X" but has no effect on the API call. */
  function renderFact(text) {
    region.innerHTML = "";
    var queryLabel = displayQuery
      ? "Query received: " + displayQuery
      : "Query received: nothing useful";

    var card = document.createElement("div");
    card.className = "fact-card";
    card.innerHTML =
      '<p class="fact-query"></p>' +
      '<p class="fact-preamble">No actionable intel found. Here\'s a useless fact anyway:</p>' +
      '<p class="fact-text"></p>' +
      '<button type="button" class="fact-again">Generate another useless fact →</button>';
    card.querySelector(".fact-query").textContent  = queryLabel;
    card.querySelector(".fact-text").textContent   = text;
    /* "Generate another" keeps the same query label, just fetches a new random fact */
    card.querySelector(".fact-again").addEventListener("click", fetchAndRender);
    region.appendChild(card);
  }

  function renderMessage(message, isError) {
    region.innerHTML =
      '<div class="fact-card' + (isError ? " error" : "") + '">' +
      '<p class="fact-text"></p>' +
      '<button type="button" class="fact-again">Try again</button>' +
      "</div>";
    region.querySelector(".fact-text").textContent = message;
    region.querySelector(".fact-again").addEventListener("click", fetchAndRender);
  }

  /* ---------- Core fetch-and-render ----------
     Always fetches a random fact. Query text is stored for display only. */
  function fetchAndRender() {
    renderLoading();
    getSafeFact()
      .then(function (text) { renderFact(text); })
      .catch(function () {
        renderMessage(
          "The useless intelligence feed is offline. Try again in a moment.",
          true
        );
      });
  }

  /* On form submit: capture what the user typed for the card label, then fetch random */
  function runFactSearch() {
    displayQuery = input ? input.value.trim() : "";
    fetchAndRender();
  }

  if (form && input && clearBtn && region) {
    input.addEventListener("input", function () {
      clearBtn.hidden = input.value.length === 0;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runFactSearch();
    });

    clearBtn.addEventListener("click", function () {
      input.value      = "";
      displayQuery     = "";
      clearBtn.hidden  = true;
      region.innerHTML = "";
      input.focus();
    });
  }

  /* ============================================================
     EXPERIENCE TIMELINE — scroll activation
     ============================================================ */
  var expItems   = Array.prototype.slice.call(document.querySelectorAll(".exp-item"));
  var tlLine     = document.querySelector(".tl-line");
  var tlProgress = document.getElementById("tlProgress");
  var tlEnd      = document.querySelector(".tl-end");

  function layoutLine() {
    if (!tlLine || !expItems.length || !tlEnd) return 0;
    var firstMarker = expItems[0].querySelector(".exp-marker");
    var startY = expItems[0].offsetTop +
      (firstMarker ? firstMarker.offsetTop + firstMarker.offsetHeight / 2 : 0);
    var endY   = tlEnd.offsetTop + tlEnd.offsetHeight / 2;
    var height = Math.max(0, endY - startY);
    tlLine.style.top    = startY + "px";
    tlLine.style.bottom = "auto";
    tlLine.style.height = height + "px";
    return height;
  }

  function syncTimeline() {
    if (!tlProgress || !tlLine) return;
    var activationLine = window.innerHeight * 0.82;
    expItems.forEach(function (item) {
      var marker       = item.querySelector(".exp-marker");
      var rect         = item.getBoundingClientRect();
      var markerCenter = rect.top +
        (marker ? marker.offsetTop + marker.offsetHeight / 2 : 0);
      item.classList[markerCenter <= activationLine ? "add" : "remove"]("active");
    });
    var lineRect = tlLine.getBoundingClientRect();
    var filled   = Math.min(Math.max(activationLine - lineRect.top, 0), lineRect.height);
    tlProgress.style.height = filled + "px";
  }

  if (expItems.length) {
    var ticking = false;
    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { syncTimeline(); ticking = false; });
    }
    function relayout() { layoutLine(); syncTimeline(); }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", relayout);
    window.addEventListener("load",   relayout);
    relayout();
  }

  /* ============================================================
     FLOATING BACK TO TOP
     Uses window.scrollTo instead of anchor navigation because the
     navbar carries id="top" and is position:sticky — browsers may
     treat a sticky element already in the viewport as "already reached"
     and not scroll to document position 0. window.scrollTo always goes
     to the absolute top regardless of sticky/fixed elements.
     ============================================================ */
  var backToTop = document.querySelector(".floating-back-to-top");

  if (backToTop) {
    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", function () {
      backToTop.classList[window.scrollY > 400 ? "add" : "remove"]("is-visible");
    }, { passive: true });
  }

  /* ============================================================
     LIVE NAVBAR GREETING + CLOCK
     Updates every minute. No external API — pure browser time.
     ============================================================ */
  var greetingEl = document.getElementById("greetingText");
  var timeEl     = document.getElementById("greetingTime");

  function updateGreeting() {
    var now  = new Date();
    var h    = now.getHours();
    var m    = now.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    var h12  = h % 12 || 12;
    var mm   = m < 10 ? "0" + m : String(m);
    var greeting =
      h >= 5  && h < 12 ? "Good Morning"   :
      h >= 12 && h < 17 ? "Good Afternoon" :
      h >= 17 && h < 21 ? "Good Evening"   : "Good Night";
    if (greetingEl) greetingEl.textContent = greeting;
    if (timeEl)     timeEl.textContent     = h12 + ":" + mm + " " + ampm;
  }

  if (greetingEl && timeEl) {
    updateGreeting();
    setInterval(updateGreeting, 60000);
  }

  /* ============================================================
     TYPEWRITER ROLE TITLE
     Cycles through cybersecurity roles character-by-character.
     Query text is purely presentational — no routing or filtering.
     ============================================================ */
  var twEl     = document.getElementById("typewriterText");
  var twCursor = document.querySelector(".tw-cursor");

  var TW_TITLES = [
    "Cybersecurity Engineer",
    "SOC Analyst",
    "Security Engineer",
    "Network Engineer",
    "Technical Support Engineer",
    "Detection Engineer",
    "Incident Response Analyst",
    "Cloud Security Engineer",
    "Vulnerability Analyst",
    "Threat Hunter"
  ];

  var TW_TYPE_MS   = 72;   /* ms per character while typing  */
  var TW_DELETE_MS = 36;   /* ms per character while deleting */
  var TW_PAUSE_END = 1800; /* pause after full title typed    */
  var TW_PAUSE_GAP = 420;  /* pause after last char deleted   */

  var twIdx      = 0;
  var twPos      = 0;
  var twDeleting = false;

  function twSetBlink(on) {
    if (!twCursor) return;
    if (on) { twCursor.classList.add("blinking"); }
    else     { twCursor.classList.remove("blinking"); }
  }

  function twTick() {
    var title = TW_TITLES[twIdx];

    if (!twDeleting) {
      twPos++;
      twEl.textContent = title.slice(0, twPos);
      twSetBlink(false);
      if (twPos === title.length) {
        twDeleting = true;
        twSetBlink(true);
        setTimeout(twTick, TW_PAUSE_END);
        return;
      }
      setTimeout(twTick, TW_TYPE_MS);
    } else {
      twPos--;
      twEl.textContent = title.slice(0, twPos);
      twSetBlink(false);
      if (twPos === 0) {
        twDeleting = false;
        twIdx      = (twIdx + 1) % TW_TITLES.length;
        twSetBlink(true);
        setTimeout(twTick, TW_PAUSE_GAP);
        return;
      }
      setTimeout(twTick, TW_DELETE_MS);
    }
  }

  if (twEl) {
    var twReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (twReducedMotion) {
      /* Reduced motion: static first title, no cursor */
      twEl.textContent = TW_TITLES[0];
      if (twCursor) twCursor.style.display = "none";
    } else {
      /* Start after hero entrance animation finishes (~0.94 s) */
      twSetBlink(true);
      setTimeout(twTick, 950);
    }
  }

})();
