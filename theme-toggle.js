(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");

  const saved = localStorage.getItem("theme");
  const systemPrefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (btn) {
      btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      btn.setAttribute(
        "aria-label",
        "Switch to " + (theme === "dark" ? "light" : "dark") + " mode"
      );
    }
  }

  const initial = saved || (systemPrefersDark ? "dark" : "light");
  apply(initial);

  if (btn) {
    btn.addEventListener("click", function () {
      const current =
        root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      apply(next);
    });
  }

  // Shift-click copyright line for a secret!
  const copyright = document.getElementById("copyright");
  if (copyright) {
    copyright.addEventListener("click", (e) => {
      if (e.shiftKey) window.location.href = "/arcade/";
    });
  }
})();
