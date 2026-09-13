import "./styles.css";

const menuToggle = document.querySelector(".menu-toggle");
const menuNav = document.getElementById("primary-navigation");
if (menuToggle && menuNav) {
  menuToggle.hidden = false;
  function setMenu(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "关闭导航菜单" : "打开导航菜单",
    );
    menuNav.toggleAttribute("data-open", open);
  }
  function toggleMenu() {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  }
  function closeMenu(event) {
    if (event.type === "keydown") {
      if (
        event.key !== "Escape" ||
        menuToggle.getAttribute("aria-expanded") !== "true"
      )
        return;
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
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      menuToggle.removeEventListener("click", toggleMenu);
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeMenu);
      window.removeEventListener("hashchange", closeMenu);
    });
}

// Scroll position is the timeline. The page never captures the wheel or hides content.
(() => {
  const root = document.documentElement;
  const opening = document.querySelector("[data-opening]");
  const openingContent = opening
    ? [...opening.querySelectorAll(".opening-copy, .opening-contact")]
    : [];
  const manifesto = document.querySelector("[data-manifesto]");
  const inkLines = [...(manifesto?.querySelectorAll("[data-ink-line]") ?? [])];
  const cases = [...document.querySelectorAll("[data-case]")].map(
    (element) => ({
      element,
      visual: element.querySelector(".case-visual"),
    }),
  );
  const finale = document.querySelector("[data-finale]");
  const header = document.querySelector(".site-header");
  const nav = [...(header?.querySelectorAll('nav a[href^="#"]') ?? [])]
    .map((link) => {
      try {
        const section = document.getElementById(
          decodeURIComponent(link.hash.slice(1)),
        );
        return section ? { link, section } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const smallScreen = matchMedia("(max-width: 720px)");
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const range = (value, start, end) => clamp((value - start) / (end - start));
  const set = (element, name, value) =>
    element?.style.setProperty(name, String(value));
  const bounds = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: element.offsetHeight };
  };

  let frame = 0;
  let active = false;
  let needsMeasure = true;
  let geometry = {};

  function measure() {
    geometry = {
      height: window.innerHeight,
      scrollHeight: root.scrollHeight,
      headerHeight: header?.getBoundingClientRect().height ?? 0,
      opening: bounds(opening),
      ink: inkLines.map(bounds),
      cases: cases.map(({ element }) => bounds(element)),
      finale: bounds(finale),
      nav: nav
        .map((item) => ({ ...item, top: bounds(item.section).top }))
        .sort((a, b) => a.top - b.top),
    };
    needsMeasure = false;
  }

  function render() {
    frame = 0;
    if (!active || document.hidden) return;
    const animated = !reduceMotion.matches && !smallScreen.matches;
    const motion = animated ? "scroll" : "static";
    if (root.dataset.motion !== motion) {
      root.dataset.motion = motion;
      needsMeasure = true;
    }
    if (needsMeasure) measure();

    const y = Math.max(0, window.scrollY);
    const vh = geometry.height;

    if (opening && geometry.opening) {
      const { top, height } = geometry.opening;
      opening.dataset.inView = String(
        animated && y + vh > top && y < top + height,
      );
      const progress = animated
        ? clamp((y - top) / Math.max(1, height - vh))
        : 0;
      const introExit = animated ? range(progress, 0.1, 0.42) : 0;
      openingContent.forEach((element) => {
        element.inert = introExit >= 0.99;
      });
      set(opening, "--opening-progress", progress.toFixed(4));
      set(
        opening,
        "--scene-scale",
        animated ? (1.04 + progress * 0.08).toFixed(4) : 1,
      );
      set(
        opening,
        "--scene-y",
        `${animated ? (-progress * vh * 0.04).toFixed(2) : 0}px`,
      );
      set(opening, "--intro-opacity", (1 - introExit).toFixed(4));
      set(opening, "--intro-y", `${(-introExit * 50).toFixed(2)}px`);
      set(
        opening,
        "--curtain-progress",
        (animated ? range(progress, 0.28, 1) : 0).toFixed(4),
      );
      opening.dataset.sceneState =
        progress >= 0.95 ? "content" : progress > 0.1 ? "transition" : "intro";
    }

    inkLines.forEach((line, index) => {
      const distance = geometry.ink[index].top - y;
      const progress = animated
        ? clamp((vh * 0.84 - distance) / Math.max(1, vh * 0.42))
        : 1;
      set(line, "--ink-progress", progress.toFixed(4));
    });

    cases.forEach(({ element, visual }, index) => {
      const { top, height } = geometry.cases[index];
      const progress = animated
        ? clamp((y + vh - top) / Math.max(1, height + vh))
        : 1;
      set(element, "--case-progress", progress.toFixed(4));
      // This only moves the decorative panel, never the project copy or its links.
      set(
        visual,
        "--visual-y",
        `${animated ? ((0.5 - progress) * 48).toFixed(2) : 0}px`,
      );
    });

    if (finale && geometry.finale) {
      const progress = animated
        ? clamp((y + vh - geometry.finale.top) / Math.max(1, vh * 0.75))
        : 1;
      set(finale, "--finale-progress", progress.toFixed(4));
    }

    const scrollRange = Math.max(1, geometry.scrollHeight - vh);
    set(header, "--read-progress", clamp(y / scrollRange).toFixed(4));
    const readingLine = y + Math.min(vh * 0.35, geometry.headerHeight + 80);
    let current = null;
    for (const item of geometry.nav) {
      if (item.top <= readingLine) current = item.link;
    }
    if (y >= scrollRange - 2) current = geometry.nav.at(-1)?.link ?? current;
    nav.forEach(({ link }) => {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function schedule() {
    if (active && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  }

  function refresh() {
    needsMeasure = true;
    schedule();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (opening) opening.dataset.inView = "false";
    } else {
      refresh();
    }
  }

  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(refresh) : null;
  const observed = [
    ...new Set(
      [
        document.body,
        opening,
        manifesto,
        finale,
        header,
        ...cases.map(({ element }) => element),
      ].filter(Boolean),
    ),
  ];

  function start() {
    if (active) return;
    active = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("hashchange", refresh);
    window.addEventListener("load", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("load", refresh, true);
    document.addEventListener("toggle", refresh, true);
    reduceMotion.addEventListener("change", refresh);
    smallScreen.addEventListener("change", refresh);
    observed.forEach((element) => resizeObserver?.observe(element));
    refresh();
  }

  function stop() {
    active = false;
    if (opening) opening.dataset.inView = "false";
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", refresh);
    window.removeEventListener("hashchange", refresh);
    window.removeEventListener("load", refresh);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("load", refresh, true);
    document.removeEventListener("toggle", refresh, true);
    reduceMotion.removeEventListener("change", refresh);
    smallScreen.removeEventListener("change", refresh);
  }

  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", start);
  document.fonts?.ready.then(() => {
    if (active) refresh();
  });
  start();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      stop();
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("pageshow", start);
    });
  }
})();

// Preserve incoming links shared from earlier versions of the portfolio.
const previousAnchors = {
  work: "projects",
  profile: "about",
  capabilities: "skills",
};
function restoreAnchor() {
  const next = previousAnchors[location.hash.slice(1)];
  if (next) {
    history.replaceState(null, "", "#" + next);
    document.getElementById(next)?.scrollIntoView({ behavior: "instant" });
  }
}
restoreAnchor();
window.addEventListener("hashchange", restoreAnchor);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener("hashchange", restoreAnchor),
  );
