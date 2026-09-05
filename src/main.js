import './styles.css';

const filters = [...document.querySelectorAll('[data-filter]')];
const projects = [...document.querySelectorAll('[data-tags]')];
const count = document.querySelector('[data-project-count]');
const emptyState = document.querySelector('[data-empty-state]');

function selectFilter(filter) {
  filters.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  let visible = 0;
  projects.forEach((project) => {
    const show = filter === 'all' || project.dataset.tags.split(' ').includes(filter);
    project.hidden = !show;
    if (show) visible += 1;
  });
  count.textContent = String(visible).padStart(2, '0') + ' 个项目';
  emptyState.hidden = visible > 0;
}

filters.forEach((button) => button.addEventListener('click', () => selectFilter(button.dataset.filter)));
document.querySelectorAll('[data-skill-filter]').forEach((link) => {
  link.addEventListener('click', () => selectFilter(link.dataset.skillFilter));
});

const toast = document.querySelector('[data-toast]');
let toastTimer;
document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    toast.textContent = '已复制：' + button.dataset.copy;
  } catch {
    toast.textContent = '复制失败，请长按或选择文字复制';
  }
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}));

const navLinks = [...document.querySelectorAll('.nav a')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === '#' + entry.target.id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}), { rootMargin: '-20% 0px -60% 0px' });
sections.forEach((section) => sectionObserver.observe(section));
