(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---- Keyboard shortcut label ----
  var isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || "");
  var shortcutLabel = isMac ? "\u2318K" : "ctrl K";
  document.querySelectorAll("[data-shortcut]").forEach(function (el) {
    el.textContent = shortcutLabel;
  });

  // ---- Mobile nav sheet ----
  var menuToggle = document.getElementById("menu-toggle");
  var menuPanel = document.getElementById("mobile-menu");
  var setMenu = function () {};

  if (menuToggle && menuPanel) {
    var menuOpen = false;

    setMenu = function (open) {
      menuOpen = open;
      menuToggle.setAttribute("aria-expanded", String(open));
      menuPanel.classList.toggle("is-open", open);
    };

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

  // ---- Quick jump palette (Cmd/Ctrl + K) ----
  var palette = document.getElementById("palette");
  var paletteInput = document.getElementById("palette-input");
  var paletteList = document.getElementById("palette-list");
  var paletteTriggers = document.querySelectorAll("[data-palette-open]");

  if (palette && paletteInput && paletteList) {
    var paletteItems = Array.prototype.slice.call(paletteList.querySelectorAll(".palette__item"));
    var paletteEmpty = paletteList.querySelector(".palette__empty");
    var paletteVisible = [];
    var paletteIndex = 0;
    var paletteIsOpen = false;
    var paletteReturnFocus = null;

    function paletteMatch(item, query) {
      if (!query) return true;
      var hay = (item.getAttribute("data-keywords") || "") + " " +
        item.textContent.replace(/\s+/g, " ").toLowerCase();
      return hay.indexOf(query) !== -1;
    }

    function paletteHighlight(scroll) {
      if (!paletteVisible.length) {
        paletteInput.removeAttribute("aria-activedescendant");
        return;
      }
      paletteIndex = (paletteIndex + paletteVisible.length) % paletteVisible.length;
      paletteVisible.forEach(function (item, i) {
        item.classList.toggle("is-active", i === paletteIndex);
        item.setAttribute("aria-selected", i === paletteIndex ? "true" : "false");
      });
      var current = paletteVisible[paletteIndex];
      paletteInput.setAttribute("aria-activedescendant", current.id);
      if (scroll) current.scrollIntoView({ block: "nearest" });
    }

    function paletteRender() {
      var query = paletteInput.value.trim().toLowerCase();
      paletteVisible = paletteItems.filter(function (item) {
        return paletteMatch(item, query);
      });
      paletteItems.forEach(function (item) {
        item.hidden = paletteVisible.indexOf(item) === -1;
      });
      if (paletteEmpty) paletteEmpty.hidden = paletteVisible.length > 0;
      paletteIndex = 0;
      paletteHighlight(true);
    }

    function paletteOpen(trigger) {
      if (paletteIsOpen) return;
      if (document.documentElement.classList.contains("booting")) return;
      setMenu(false);
      paletteReturnFocus = trigger && trigger.closest(".mobile-menu") ? menuToggle : (trigger || document.activeElement);
      palette.hidden = false;
      document.documentElement.classList.add("palette-open");
      void palette.offsetHeight;
      palette.classList.add("is-open");
      paletteIsOpen = true;
      paletteInput.value = "";
      paletteRender();
      paletteTriggers.forEach(function (btn) { btn.setAttribute("aria-expanded", "true"); });
      window.setTimeout(function () {
        if (paletteIsOpen) paletteInput.focus();
      }, 30);
    }

    function paletteClose() {
      if (!paletteIsOpen) return;
      paletteIsOpen = false;
      palette.classList.remove("is-open");
      document.documentElement.classList.remove("palette-open");
      paletteTriggers.forEach(function (btn) { btn.setAttribute("aria-expanded", "false"); });
      window.setTimeout(function () {
        if (!paletteIsOpen) palette.hidden = true;
      }, 200);
      var restore = paletteReturnFocus;
      if (restore && restore.focus && document.contains(restore)) {
        restore.focus({ preventScroll: true });
      }
      paletteReturnFocus = null;
    }

    function paletteGo(item) {
      if (!item) return;
      var href = item.getAttribute("data-href");
      var external = item.getAttribute("data-external") === "true";
      paletteClose();
      if (external) {
        window.open(href, "_blank", "noopener");
        return;
      }
      if (href && href.charAt(0) === "#") {
        var target = document.querySelector(href);
        if (!target) return;
        if (history.replaceState) history.replaceState(null, "", href);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      } else if (href) {
        window.location.href = href;
      }
    }

    paletteTriggers.forEach(function (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        paletteOpen(btn);
      });
    });

    paletteInput.addEventListener("input", paletteRender);

    paletteList.addEventListener("click", function (e) {
      var item = e.target.closest(".palette__item");
      if (item) paletteGo(item);
    });

    paletteList.addEventListener("mouseover", function (e) {
      var item = e.target.closest(".palette__item");
      if (!item) return;
      var i = paletteVisible.indexOf(item);
      if (i !== -1) {
        paletteIndex = i;
        paletteHighlight(false);
      }
    });

    document.addEventListener("click", function (e) {
      if (paletteIsOpen && e.target.closest("[data-palette-close]")) paletteClose();
    });

    document.addEventListener("keydown", function (e) {
      var isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        if (paletteIsOpen) paletteClose();
        else paletteOpen(null);
        return;
      }
      if (!paletteIsOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        paletteClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        paletteIndex += 1;
        paletteHighlight(true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        paletteIndex -= 1;
        paletteHighlight(true);
      } else if (e.key === "Enter") {
        e.preventDefault();
        paletteGo(paletteVisible[paletteIndex]);
      } else if (e.key === "Tab") {
        e.preventDefault();
        paletteInput.focus();
      }
    });

    document.addEventListener("focusin", function (e) {
      if (paletteIsOpen && !palette.contains(e.target)) paletteInput.focus();
    });
  }

  // ---- Boot sequence (once per session, starts on first input) ----
  (function boot() {
    var bootEl = document.getElementById("boot");
    var logEl = document.getElementById("boot-log");
    if (!bootEl || !logEl) return;

    var seen = false;
    try { seen = sessionStorage.getItem("booted-v2") === "1"; } catch (e) {}

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

    var intro = document.getElementById("intro-sound");
    var i = 0;
    var timer;
    var started = false;
    var finished = false;

    function introStart() {
      if (!intro) return;
      intro.volume = 0.35;
      var p;
      try { p = intro.play(); } catch (e) { return; }
      if (p && p.catch) p.catch(function () {});
    }

    function begin() {
      if (started || finished) return;
      started = true;
      bootEl.classList.remove("boot--idle");
      logEl.innerHTML = "";
      introStart();
      timer = setTimeout(next, 180);
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { sessionStorage.setItem("booted-v2", "1"); } catch (e) {}
      document.documentElement.classList.remove("booting");
      bootEl.classList.add("boot--done");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () {
        if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl);
      }, 520);
    }

    function onKey(e) {
      if (e.key === "Tab" || e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      if (e.repeat) return;
      if (!started) {
        begin();
        return;
      }
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

    bootEl.addEventListener("click", function () {
      if (!started) begin();
      else finish();
    });
    document.addEventListener("keydown", onKey);
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
