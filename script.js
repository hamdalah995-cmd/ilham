const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const progress = $('.progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${(scrollY / h) * 100}%`;

  const sections = [...$$('section')];
  let current = 'home';
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop - innerHeight * .35) current = sec.id;
  });
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('show');
  });
}, {threshold:.12});
$$('.reveal').forEach(el => observer.observe(el));

const menu = $('.menu');
const links = $('.nav-links');
menu.addEventListener('click', () => links.classList.toggle('open'));
$$('.nav-links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

const glow = $('.cursor-glow');
window.addEventListener('pointermove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

const core = $('.core-card');
window.addEventListener('pointermove', e => {
  if (innerWidth < 900) return;
  const x = (e.clientX / innerWidth - .5) * 8;
  const y = (e.clientY / innerHeight - .5) * -8;
  core.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
});
core.addEventListener('mouseleave', () => core.style.transform = 'perspective(1000px) rotateY(-5deg)');

const hero = $('.hero');
window.addEventListener('scroll', () => {
  if (scrollY < innerHeight) {
    hero.querySelector('.hero-copy').style.transform = `translateY(${scrollY * .12}px)`;
    hero.querySelector('.hero-core').style.transform = `translateY(${scrollY * -.08}px)`;
  }
});
