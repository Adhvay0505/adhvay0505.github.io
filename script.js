(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---- CRT toggle (persisted) ----
  var crtToggles = document.querySelectorAll("[data-crt-toggle]");
  var crtOn = true;
  try {
    if (localStorage.getItem("crt") === "off") crtOn = false;
  } catch (e) {}

  function applyCrt() {
    document.documentElement.classList.toggle("crt-off", !crtOn);
    crtToggles.forEach(function (btn) {
      btn.textContent = crtOn ? "[ crt: on ]" : "[ crt: off ]";
      btn.setAttribute("aria-pressed", String(crtOn));
    });
  }

  applyCrt();

  crtToggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      crtOn = !crtOn;
      try { localStorage.setItem("crt", crtOn ? "on" : "off"); } catch (e) {}
      applyCrt();
    });
  });

  // ---- Mobile nav sheet ----
  var menuToggle = document.getElementById("menu-toggle");
  var menuPanel = document.getElementById("mobile-menu");

  if (menuToggle && menuPanel) {
    var menuOpen = false;

    function setMenu(open) {
      menuOpen = open;
      menuToggle.setAttribute("aria-expanded", String(open));
      menuPanel.classList.toggle("is-open", open);
    }

    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!menuOpen);
    });

    menuPanel.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      setMenu(false);
      var hash = link.getAttribute("href");
      if (hash && hash.charAt(0) === "#") {
        var target = document.querySelector(hash);
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    });

    document.addEventListener("click", function (e) {
      if (menuOpen && !menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (menuOpen && e.key === "Escape") {
        setMenu(false);
        menuToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && menuOpen) setMenu(false);
    });
  }

  // ---- Boot sequence (once per session, skippable) ----
  (function boot() {
    var bootEl = document.getElementById("boot");
    var logEl = document.getElementById("boot-log");
    if (!bootEl || !logEl) return;

    var seen = false;
    try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}

    if (reduceMotion || seen) {
      bootEl.remove();
      return;
    }

    var lines = [
      "KALI GNU/Linux 2026.1 (adhvay) tty1",
      "",
      'adhvay login: <span class="hi">visitor</span>',
      '<span class="ok">[  OK  ]</span> Mounted /home/adhvay',
      '<span class="ok">[  OK  ]</span> Loaded profile: <span class="hi">adhvay-banerjee</span>',
      '<span class="ok">[  OK  ]</span> Started <span class="hi">portfolio.service</span>',
      '<span class="ok">[  OK  ]</span> Reached target <span class="hi">personal-brand.target</span>',
      "",
      'Welcome. <span class="cmdline">visitor@portfolio</span>:<span class="cmdline">~</span>$ '
    ];

    document.documentElement.classList.add("booting");

    var i = 0;
    var timer;
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { sessionStorage.setItem("booted", "1"); } catch (e) {}
      document.documentElement.classList.remove("booting");
      bootEl.classList.add("boot--done");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () {
        if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl);
      }, 520);
    }

    function onKey(e) {
      if (e.key === "Tab" || e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      finish();
    }

    function next() {
      if (i >= lines.length) {
        timer = setTimeout(finish, 620);
        return;
      }
      var p = document.createElement("p");
      p.className = "boot__line";
      p.innerHTML = lines[i] || "&nbsp;";
      logEl.appendChild(p);
      i += 1;
      timer = setTimeout(next, i === 1 ? 260 : 120);
    }

    bootEl.addEventListener("click", finish);
    document.addEventListener("keydown", onKey);
    timer = setTimeout(next, 180);
  })();

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- Terminal typing effect for `cat about_me.txt` ----
  var cmdEl = document.getElementById("type-cmd");
  var caret = document.getElementById("caret");
  var output = document.getElementById("term-output");

  if (!cmdEl || !output) return;

  var fullText = cmdEl.getAttribute("data-text") || cmdEl.textContent;
  var lines = output.querySelectorAll(".out-line");

  function revealLines() {
    if (reduceMotion) {
      lines.forEach(function (line) { line.classList.add("is-visible"); });
      return;
    }
    lines.forEach(function (line, i) {
      setTimeout(function () {
        line.classList.add("is-visible");
      }, 180 + i * 220);
    });
  }

  function runTyping() {
    if (reduceMotion) {
      cmdEl.textContent = fullText;
      output.hidden = false;
      revealLines();
      return;
    }
    cmdEl.textContent = "";
    var i = 0;
    (function typeChar() {
      if (i <= fullText.length) {
        cmdEl.textContent = fullText.slice(0, i);
        i += 1;
        setTimeout(typeChar, 38 + Math.random() * 45);
      } else {
        if (caret) caret.style.display = "none";
        var dots = document.createElement("span");
        dots.className = "term-dots";
        dots.setAttribute("aria-hidden", "true");
        cmdEl.parentNode.insertBefore(dots, cmdEl.nextSibling);
        setTimeout(function () {
          if (dots.parentNode) dots.parentNode.removeChild(dots);
          output.hidden = false;
          revealLines();
        }, 520);
      }
    })();
  }

  if ("IntersectionObserver" in window) {
    var termIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runTyping();
            termIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    termIo.observe(cmdEl.closest(".terminal"));
  } else {
    runTyping();
  }
})();
