/* ============================================================
   Rebanta Daadhiich — Portfolio interactions
   - Facts search (Wikipedia summary first, Useless Facts fallback)
   - Mobile hamburger menu
   - Active wheel/segment highlighting via scroll spy
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
  var hamburger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // Close menu when a link is tapped
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ============================================================
     FACTS SEARCH
     ============================================================ */
  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var clearBtn = document.getElementById("clearBtn");
  var region = document.getElementById("factRegion");

  var TIMEOUT_MS = 5000;
  var MAX_TRIES = 3;
  var FACTS_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en";

  /* fetch with a hard timeout via AbortController */
  function fetchWithTimeout(url, opts) {
    opts = opts || {};
    var controller = new AbortController();
    var id = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
      .finally(function () { clearTimeout(id); });
  }

  /* ---------- Client-side safety filter ----------
     The Useless Facts API can return anything, so we reject facts containing
     obvious unsafe keywords before showing them. Edit UNSAFE_WORDS to tune. */
  var UNSAFE_WORDS = [
    // profanity / sexual
    "sex", "sexual", "porn", "nude", "naked", "penis", "vagina", "genital",
    "orgasm", "masturbat", "erotic", "fuck", "shit", "bitch", "bastard",
    "prostitut", "brothel", "incest", "rape", "fetish",
    // hate / slurs / discrimination
    "racist", "racism", "nazi", "hitler", "slur", "bigot", "supremac",
    // violence / graphic / disturbing
    "murder", "kill", "death", "corpse", "gore", "behead", "torture",
    "massacre", "shooting", "stab", "execut", "mutilat", "cannibal",
    // self-harm
    "suicide", "self-harm", "self harm", "overdose",
    // drugs
    "cocaine", "heroin", "marijuana", "cannabis", "narcotic", "drug",
    // politics / religion (controversy)
    "trump", "biden", "election", "democrat", "republican", "abortion",
    "islam", "muslim", "christian", "jewish", "hindu", "religion", "terroris"
  ];
  // Match each term at the START of a word (leading \b) so inflections like
  // "killed"/"killing" are caught while mid-word matches ("skill", "diet") aren't.
  var UNSAFE_RE = new RegExp("\\b(" + UNSAFE_WORDS.join("|") + ")", "i");

  function isSafeFact(text) {
    if (!text || typeof text !== "string") return false;
    return !UNSAFE_RE.test(text);
  }

  /* Fetch ONE random fact */
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

  /* Keep fetching until we get a SAFE fact (up to MAX_TRIES attempts) */
  function getSafeFact(triesLeft) {
    if (triesLeft === undefined) triesLeft = MAX_TRIES;
    return getRandomFact().then(function (text) {
      if (isSafeFact(text)) return text;
      if (triesLeft > 1) return getSafeFact(triesLeft - 1);
      throw new Error("no clean fact");
    });
  }

  /* ---------- Render helpers ---------- */
  function renderLoading() {
    region.innerHTML =
      '<div class="fact-card"><p class="fact-loading">Finding a fun fact…</p></div>';
  }

  function renderFact(text) {
    region.innerHTML = "";
    var card = document.createElement("div");
    card.className = "fact-card";
    card.innerHTML =
      '<p class="fact-text"></p>' +
      '<p class="fact-source">Source · Useless Facts API</p>' +
      '<button type="button" class="fact-again">Tap for another</button>';
    card.querySelector(".fact-text").textContent = text;
    card.querySelector(".fact-again").addEventListener("click", runFactSearch);
    region.appendChild(card);
  }

  function renderMessage(message, isError) {
    region.innerHTML =
      '<div class="fact-card' + (isError ? " error" : "") + '">' +
      '<p class="fact-text"></p>' +
      '<button type="button" class="fact-again">Try again</button>' +
      "</div>";
    region.querySelector(".fact-text").textContent = message;
    region.querySelector(".fact-again").addEventListener("click", runFactSearch);
  }

  /* ---------- Main flow: always fetch a (safe) random fact ---------- */
  function runFactSearch() {
    renderLoading();
    getSafeFact()
      .then(renderFact)
      .catch(function () {
        renderMessage("I could not find a clean fact right now. Try again in a moment.", true);
      });
  }

  if (form && input && clearBtn && region) {
    // Show/hide the clear button as the user types (typed text is not used to
    // control the result — Enter / the search icon fetch a random fact).
    input.addEventListener("input", function () {
      clearBtn.hidden = input.value.length === 0;
    });

    // Enter key OR clicking the search-icon submit button -> fetch a fact
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runFactSearch();
    });

    // Clear input + results
    clearBtn.addEventListener("click", function () {
      input.value = "";
      clearBtn.hidden = true;
      region.innerHTML = "";
      input.focus();
    });
  }

  /* NOTE: Wheel highlighting is handled purely by CSS :hover / :focus-visible.
     No segment is "active" by default — see .seg:hover in style.css. */

  /* ============================================================
     EXPERIENCE TIMELINE — scroll activation (IntersectionObserver)
     Each .exp-item gets .active when it scrolls into view; the orange
     progress line grows to reach the furthest activated marker.
     ============================================================ */
  var expItems = Array.prototype.slice.call(document.querySelectorAll(".exp-item"));
  var tlLine = document.querySelector(".tl-line");
  var tlProgress = document.getElementById("tlProgress");
  var tlEnd = document.querySelector(".tl-end");

  /* The base + progress lines span from the FIRST marker's center all the way
     down to the center of the "TO BE CONTINUED" sticker, so the animation can
     visually reach the very end of the timeline. Recomputed on load/resize. */
  function layoutLine() {
    if (!tlLine || !expItems.length || !tlEnd) return 0;
    var firstMarker = expItems[0].querySelector(".exp-marker");
    var startY = expItems[0].offsetTop + (firstMarker ? firstMarker.offsetTop + firstMarker.offsetHeight / 2 : 0);
    var endY = tlEnd.offsetTop + tlEnd.offsetHeight / 2;
    var height = Math.max(0, endY - startY);
    tlLine.style.top = startY + "px";
    tlLine.style.bottom = "auto";
    tlLine.style.height = height + "px";
    return height;
  }

  /* Continuous scroll progress: the orange line fills from the top of the base
     line down to an activation line near the bottom of the viewport. Scrolling
     down grows it toward "TO BE CONTINUED"; scrolling up retracts it smoothly
     (CSS height transition does the easing). Markers light up as they pass. */
  function syncTimeline() {
    if (!tlProgress || !tlLine) return;
    var activationLine = window.innerHeight * 0.82;

    // marker glow state (reversible)
    expItems.forEach(function (item) {
      var marker = item.querySelector(".exp-marker");
      var rect = item.getBoundingClientRect();
      var markerCenter = rect.top + (marker ? marker.offsetTop + marker.offsetHeight / 2 : 0);
      if (markerCenter <= activationLine) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // progress fill = portion of the base line that sits above the activation line
    var lineRect = tlLine.getBoundingClientRect();
    var filled = activationLine - lineRect.top;
    if (filled < 0) filled = 0;
    if (filled > lineRect.height) filled = lineRect.height;
    tlProgress.style.height = filled + "px";
  }

  if (expItems.length) {
    var ticking = false;
    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        syncTimeline();
        ticking = false;
      });
    }
    function relayout() { layoutLine(); syncTimeline(); }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    relayout(); // set geometry + initial state
  }

  /* ============================================================
     LIVE NAVBAR GREETING + CLOCK
     Updates every minute. No external API — pure browser time.
     Greeting thresholds:
       05:00–11:59  Good Morning
       12:00–16:59  Good Afternoon
       17:00–20:59  Good Evening
       21:00–04:59  Good Night
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

    var greeting;
    if      (h >= 5  && h < 12) greeting = "Good Morning";
    else if (h >= 12 && h < 17) greeting = "Good Afternoon";
    else if (h >= 17 && h < 21) greeting = "Good Evening";
    else                         greeting = "Good Night";

    if (greetingEl) greetingEl.textContent = greeting;
    if (timeEl)     timeEl.textContent     = h12 + ":" + mm + " " + ampm;
  }

  if (greetingEl && timeEl) {
    updateGreeting();
    setInterval(updateGreeting, 60000);
  }

})();
