export function initMobileNav(): void {
  const toggle = document.getElementById('mobile-nav-toggle');
  const menu = document.getElementById('mobile-nav');
  const iconOpen = document.getElementById('mobile-nav-icon-open');
  const iconClose = document.getElementById('mobile-nav-icon-close');
  if (!toggle || !menu || !iconOpen || !iconClose) return;

  toggle.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    iconOpen.classList.toggle('hidden', !isOpen);
    iconClose.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    toggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  });
}
