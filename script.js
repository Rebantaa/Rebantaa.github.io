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
  var tlProgress = document.getElementById("tlProgress");

  function updateProgress() {
    if (!tlProgress) return;
    var furthest = 0;
    expItems.forEach(function (item) {
      if (!item.classList.contains("active")) return;
      var marker = item.querySelector(".exp-marker");
      var center = item.offsetTop + (marker ? marker.offsetTop + marker.offsetHeight / 2 : 0);
      if (center > furthest) furthest = center;
    });
    tlProgress.style.height = furthest + "px";
  }

  if (expItems.length && "IntersectionObserver" in window) {
    var expObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // activate once and keep it lit as you continue scrolling
            entry.target.classList.add("active");
            expObserver.unobserve(entry.target);
          }
        });
        updateProgress();
      },
      { threshold: 0.35, rootMargin: "0px 0px -15% 0px" }
    );
    expItems.forEach(function (item) { expObserver.observe(item); });

    // keep the progress line accurate if the layout reflows
    window.addEventListener("resize", updateProgress);
  } else {
    // No IO support -> just show everything active
    expItems.forEach(function (item) { item.classList.add("active"); });
    updateProgress();
  }
})();
