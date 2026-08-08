import './styles.css';

const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-tags]');
const emptyState = document.querySelector('[data-empty-state]');

filters.forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filters.forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  let visible = 0;
  projects.forEach((project) => {
    const show = filter === 'all' || project.dataset.tags.split(' ').includes(filter);
    project.hidden = !show;
    if (show) visible += 1;
  });
  emptyState.hidden = visible > 0;
}));

document.querySelectorAll('.project-trigger').forEach((button) => {
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.classList.toggle('is-open', !expanded);
    if (!expanded) window.setTimeout(() => button.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  });
});

const toast = document.querySelector('[data-toast]');
let toastTimer;
document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    toast.textContent = `已复制：${button.dataset.copy}`;
  } catch {
    toast.textContent = '复制失败，请手动选择文字';
  }
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}));

const navLinks = [...document.querySelectorAll('.nav a')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin: '-25% 0px -65% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-visible');
  observer.unobserve(entry.target);
}), { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
  revealObserver.observe(element);
});

const header = document.querySelector('[data-header]');
window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true });

const flowNodes = [...document.querySelectorAll('[data-flow-node]')];
const flowPaths = [...document.querySelectorAll('[data-path]')];
const flowStatus = document.querySelector('[data-flow-status]');
const playButton = document.querySelector('[data-flow-play]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let playTimer;
let playing = false;

function describeNode(node) {
  flowNodes.forEach((item) => item.classList.toggle('is-active', item === node));
  flowStatus.textContent = node.dataset.detail;
}

flowNodes.forEach((node) => {
  node.addEventListener('mouseenter', () => describeNode(node));
  node.addEventListener('focus', () => describeNode(node));
  node.addEventListener('click', () => describeNode(node));
});

function stopFlow() {
  window.clearInterval(playTimer);
  playing = false;
  playButton?.classList.remove('is-playing');
  if (playButton) {
    playButton.querySelector('.play-icon').textContent = '▶';
    playButton.querySelector('.play-label').textContent = '播放流程';
  }
}

function playFlow() {
  if (!playButton || reducedMotion) {
    if (flowStatus) flowStatus.textContent = '系统已启用“减少动态效果”，可点击节点逐步查看。';
    return;
  }
  if (playing) return stopFlow();
  playing = true;
  playButton.classList.add('is-playing');
  playButton.querySelector('.play-icon').textContent = '■';
  playButton.querySelector('.play-label').textContent = '停止播放';
  const sequence = ['target', 'query', 'judge', 'graph', 'api', 'video', 'content', 'clean', 'evaluate', 'truth', 'drift'];
  let index = 0;
  const advance = () => {
    flowPaths.forEach((path) => path.classList.remove('is-active'));
    const node = flowNodes.find((item) => item.dataset.flowNode === sequence[index]);
    if (node) describeNode(node);
    if (index > 0) {
      const path = flowPaths.find((item) => item.dataset.path === String(Math.min(index, 9)));
      path?.classList.add('is-active');
    }
    index += 1;
    if (index >= sequence.length) stopFlow();
  };
  advance();
  playTimer = window.setInterval(advance, 850);
}

playButton?.addEventListener('click', playFlow);

const flowStage = document.querySelector('[data-flow-stage]');
if (flowStage && !reducedMotion) {
  const flowObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    flowNodes.forEach((node, index) => window.setTimeout(() => node.classList.add('is-entered'), index * 70));
    observer.unobserve(entry.target);
  }), { threshold: 0.25 });
  flowObserver.observe(flowStage);
}
