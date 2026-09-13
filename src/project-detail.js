import './project-detail.css';

const root = document.documentElement;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const nav = document.querySelector('[data-case-nav]');
const reveals = [...document.querySelectorAll('.reveal')];
const indexLinks = [...document.querySelectorAll('.case-index a')];
const navigationLinks = [...document.querySelectorAll('.case-index a, .case-nav nav a')];
const sections = indexLinks
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);
let revealObserver;
let activeSectionId = '';
let navigationFrame = 0;
let disposed = false;

// Content remains readable without JavaScript or intersection observation.
const updateMotion = () => {
  revealObserver?.disconnect();
  const animate = !motionPreference.matches && 'IntersectionObserver' in window;
  root.classList.toggle('js-motion', animate);
  if (!animate) {
    reveals.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.05 });
  reveals.forEach((element) => {
    if (!element.classList.contains('is-visible')) revealObserver.observe(element);
  });
};

const updateActiveSection = () => {
  navigationFrame = 0;
  const scrollTop = Math.max(0, window.scrollY);
  const scrollRange = root.scrollHeight - window.innerHeight;
  nav?.classList.toggle('is-scrolled', scrollTop > 18);
  nav?.style.setProperty('--reading-progress', scrollRange > 0 ? Math.min(1, scrollTop / scrollRange) : 1);

  const readingLine = (nav?.getBoundingClientRect().bottom ?? 88) + 120;
  const atPageEnd = Math.ceil(scrollTop + window.innerHeight) >= root.scrollHeight - 2;
  const activeSection = atPageEnd
    ? sections.at(-1)
    : [...sections].reverse().find((section) => section.getBoundingClientRect().top <= readingLine) ?? sections[0];
  if (!activeSection || activeSection.id === activeSectionId) return;
  activeSectionId = activeSection.id;

  navigationLinks.forEach((link) => {
    const active = link.hash === `#${activeSectionId}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const scheduleNavigationUpdate = () => {
  if (!disposed && !navigationFrame) navigationFrame = requestAnimationFrame(updateActiveSection);
};

window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
window.addEventListener('resize', scheduleNavigationUpdate);
window.addEventListener('hashchange', scheduleNavigationUpdate);
window.addEventListener('pageshow', scheduleNavigationUpdate);
motionPreference.addEventListener('change', updateMotion);
document.fonts?.ready.then(scheduleNavigationUpdate);
updateMotion();
updateActiveSection();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    revealObserver?.disconnect();
    cancelAnimationFrame(navigationFrame);
    window.removeEventListener('scroll', scheduleNavigationUpdate);
    window.removeEventListener('resize', scheduleNavigationUpdate);
    window.removeEventListener('hashchange', scheduleNavigationUpdate);
    window.removeEventListener('pageshow', scheduleNavigationUpdate);
    motionPreference.removeEventListener('change', updateMotion);
    root.classList.remove('js-motion');
  });
}
