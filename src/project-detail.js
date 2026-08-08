import './project-detail.css';

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
const sections = indexLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  indexLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin: '-28% 0px -62% 0px' });
sections.forEach((section) => sectionObserver.observe(section));
