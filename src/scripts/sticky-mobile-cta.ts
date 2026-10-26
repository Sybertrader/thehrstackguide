export function initStickyMobileCta(): void {
  const bar = document.querySelector<HTMLElement>('[data-sticky-mobile-cta]');
  const hero = document.querySelector<HTMLElement>('[data-comparison-hero]');
  if (!bar || !hero) return;

  const desktop = window.matchMedia('(min-width: 768px)');

  const setShown = (shown: boolean) => {
    bar.classList.toggle('translate-y-full', !shown);
    bar.classList.toggle('pointer-events-none', !shown);
    bar.classList.toggle('invisible', !shown);
    bar.setAttribute('aria-hidden', shown ? 'false' : 'true');
  };

  const update = () => {
    if (desktop.matches) {
      setShown(false);
      return;
    }
    setShown(hero.getBoundingClientRect().bottom <= 0);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  desktop.addEventListener('change', update);
  update();
}
