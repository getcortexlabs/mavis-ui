const save = document.querySelector('#save-button');
save.addEventListener('click', () => {
  const selected = save.getAttribute('aria-pressed') !== 'true';
  save.setAttribute('aria-pressed', String(selected));
  document.querySelector('#save-icon').textContent = selected ? '♥' : '♡';
  document.querySelector('#save-label').textContent = selected ? 'Love it. Saved.' : 'A little love';
});

const accents = { blue: '#304bea', orange: '#b5552c', green: '#53704a' };
const swatches = document.querySelectorAll('.swatch');
swatches.forEach(button => button.addEventListener('click', () => {
  document.querySelector('#theme-preview').style.setProperty('--accent', accents[button.dataset.color]);
  swatches.forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch === button)));
}));

const bars = document.querySelector('.motion-bars');
document.querySelector('#replay').addEventListener('click', () => {
  bars.classList.remove('play');
  void bars.offsetWidth;
  bars.classList.add('play');
});
