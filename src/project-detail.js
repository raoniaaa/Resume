import './project-detail.css';

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
}

const nav = document.querySelector('[data-case-nav]');
window.addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', window.scrollY > 18), { passive: true });

const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-visible');
  observer.unobserve(entry.target);
}), { threshold: 0.08 });
reveals.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 55}ms`;
  revealObserver.observe(element);
});

const indexLinks = [...document.querySelectorAll('.case-index a')];
const navigationLinks = [...document.querySelectorAll('.case-index a, .case-nav nav a')];
const sections = indexLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
let activeSectionId = '';
let navigationFrame = 0;

const updateActiveSection = () => {
  navigationFrame = 0;
  const readingLine = (nav?.getBoundingClientRect().bottom ?? 88) + 120;
  const atPageEnd = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
  const activeSection = atPageEnd
    ? sections.at(-1)
    : sections.findLast((section) => section.getBoundingClientRect().top <= readingLine) ?? sections[0];
  if (!activeSection || activeSection.id === activeSectionId) return;
  activeSectionId = activeSection.id;

  navigationLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${activeSectionId}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const scheduleNavigationUpdate = () => {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateActiveSection);
};

window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
window.addEventListener('resize', scheduleNavigationUpdate);
document.fonts.ready.then(scheduleNavigationUpdate);
updateActiveSection();
