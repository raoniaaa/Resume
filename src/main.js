import "./styles.css";

// --- Theme Management (Claude Official Dual-Mode: Warm Parchment & Deep Charcoal) ---
(() => {
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const storedTheme = localStorage.getItem("claude-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme, save = true) {
    root.setAttribute("data-theme", theme);
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#141413" : "#faf9f5");
    }
    if (save) {
      localStorage.setItem("claude-theme", theme);
    }
  }

  // Initial theme resolution
  const initialTheme = storedTheme || (prefersDark.matches ? "dark" : "light");
  applyTheme(initialTheme, false);

  // Listen for system theme changes if user hasn't explicitly set preference
  prefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("claude-theme")) {
      applyTheme(e.matches ? "dark" : "light", false);
    }
  });

  // Bind theme toggle button
  document.addEventListener("DOMContentLoaded", bindThemeToggle);
  bindThemeToggle();

  function bindThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle") || document.querySelector(".theme-toggle");
    if (!toggleBtn || toggleBtn.dataset.bound) return;
    toggleBtn.dataset.bound = "true";

    toggleBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }
})();

// --- Mobile navigation menu toggling ---
const menuToggle = document.querySelector(".menu-toggle");
const menuNav = document.getElementById("primary-navigation");

if (menuToggle && menuNav) {
  menuToggle.hidden = false;

  function setMenu(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    menuNav.toggleAttribute("data-open", open);
  }

  function toggleMenu() {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  }

  function closeMenu(event) {
    if (event.type === "keydown") {
      if (event.key !== "Escape" || menuToggle.getAttribute("aria-expanded") !== "true") return;
      setMenu(false);
      menuToggle.focus();
    } else if (
      event.type === "hashchange" ||
      event.target.closest("a") ||
      !event.target.closest(".site-header")
    ) {
      setMenu(false);
    }
  }

  menuToggle.addEventListener("click", toggleMenu);
  document.addEventListener("click", closeMenu);
  document.addEventListener("keydown", closeMenu);
  window.addEventListener("hashchange", closeMenu);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      menuToggle.removeEventListener("click", toggleMenu);
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeMenu);
      window.removeEventListener("hashchange", closeMenu);
    });
  }
}

// --- Scroll progress, header styling, and section spy ---
(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navLinks = [...(header?.querySelectorAll('nav a[href^="#"]') ?? [])]
    .map((link) => {
      try {
        const id = decodeURIComponent(link.hash.slice(1));
        const section = document.getElementById(id);
        return section ? { link, section } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const clamp = (value) => Math.min(1, Math.max(0, value));
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateScrollState);
      ticking = true;
    }
  }

  function updateScrollState() {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const scrollHeight = root.scrollHeight;
    const innerHeight = window.innerHeight;
    const maxScroll = Math.max(1, scrollHeight - innerHeight);
    const progress = clamp(y / maxScroll);

    // Update reading progress bar
    if (header) {
      header.style.setProperty("--read-progress", progress.toFixed(4));
      if (y > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    // Active navigation spy
    const headerHeight = header?.getBoundingClientRect().height ?? 64;
    const triggerLine = y + headerHeight + 100;
    let currentLink = null;

    for (const item of navLinks) {
      const top = item.section.getBoundingClientRect().top + y;
      if (top <= triggerLine) {
        currentLink = item.link;
      }
    }

    if (y >= maxScroll - 10 && navLinks.length > 0) {
      currentLink = navLinks[navLinks.length - 1].link;
    }

    navLinks.forEach(({ link }) => {
      if (link === currentLink) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Interactive slider micro-interactions on Benchmark Window
  const benchmarkWindow = document.querySelector(".benchmark-window");
  if (benchmarkWindow) {
    const items = benchmarkWindow.querySelectorAll(".benchmark-item");
    items.forEach((item) => {
      const fill = item.querySelector(".slider-fill");
      const thumb = item.querySelector(".slider-thumb");
      if (!fill || !thumb) return;
      const initialWidth = fill.style.width || "90%";
      item.addEventListener("mouseenter", () => {
        fill.style.transition = "width 0.25s ease";
        thumb.style.transition = "left 0.25s ease";
        fill.style.width = "99%";
        thumb.style.left = "99%";
      });
      item.addEventListener("mouseleave", () => {
        fill.style.width = initialWidth;
        thumb.style.left = initialWidth;
      });
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  updateScrollState();
})();
