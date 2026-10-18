(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal
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

  // Terminal typing effect for `cat about_me.txt`
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
        setTimeout(function () {
          output.hidden = false;
          revealLines();
        }, 320);
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
