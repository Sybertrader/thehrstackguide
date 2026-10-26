const ACTIVE_CLASSES = ['relative', 'translate-y-0', 'opacity-100'] as const;
const INACTIVE_CLASSES = ['pointer-events-none', 'absolute', 'inset-x-0', 'top-0', 'translate-y-1', 'opacity-0'] as const;

function setPanelState(panel: HTMLElement, on: boolean): void {
  for (const name of ACTIVE_CLASSES) panel.classList.toggle(name, on);
  for (const name of INACTIVE_CLASSES) panel.classList.toggle(name, !on);
  panel.setAttribute('aria-hidden', on ? 'false' : 'true');
}

function activateSegment(root: HTMLElement, segmentId: string): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  const stack = root.querySelector<HTMLElement>('[data-segment-stack]');
  const next = panels.find((panel) => panel.dataset.segment === segmentId);
  const current = panels.find((panel) => panel.getAttribute('aria-hidden') !== 'true');
  if (!next) return;

  for (const tab of tabs) {
    const on = tab.dataset.segment === segmentId;
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
    tab.tabIndex = on ? 0 : -1;
  }

  if (next === current) {
    setPanelState(next, true);
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fromHeight = stack?.getBoundingClientRect().height ?? 0;

  if (stack && !reduceMotion && fromHeight > 0) {
    stack.style.height = `${fromHeight}px`;
  }

  for (const panel of panels) {
    setPanelState(panel, panel.dataset.segment === segmentId);
  }

  if (!stack || reduceMotion) {
    if (stack) {
      stack.style.height = '';
      stack.style.transition = '';
    }
    return;
  }

  const toHeight = next.scrollHeight;
  const finish = (event?: TransitionEvent) => {
    if (event && (event.target !== stack || event.propertyName !== 'height')) return;
    stack.style.height = '';
    stack.style.transition = '';
    stack.removeEventListener('transitionend', finish);
  };

  requestAnimationFrame(() => {
    stack.style.transition = 'height 280ms ease';
    stack.style.height = `${toHeight}px`;
  });
  stack.addEventListener('transitionend', finish);
  window.setTimeout(() => finish(), 360);
}

export function initSegmentTabs(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-segment-tabs]'));

  for (const root of roots) {
    if (root.dataset.segmentBound === 'true') continue;
    root.dataset.segmentBound = 'true';

    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    if (tabs.length === 0) continue;

    const ids = tabs.map((tab) => tab.dataset.segment).filter((id): id is string => Boolean(id));

    root.addEventListener('click', (event) => {
      const tab = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[role="tab"]');
      if (!tab || !root.contains(tab) || !tab.dataset.segment) return;
      activateSegment(root, tab.dataset.segment);
      history.replaceState(null, '', `#${tab.dataset.segment}`);
    });

    root.addEventListener('keydown', (event) => {
      const current = document.activeElement;
      if (!(current instanceof HTMLButtonElement) || current.getAttribute('role') !== 'tab') return;
      if (!root.contains(current)) return;
      const index = tabs.indexOf(current);
      if (index < 0) return;
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      const target = tabs[next];
      if (!target?.dataset.segment) return;
      target.focus();
      activateSegment(root, target.dataset.segment);
      history.replaceState(null, '', `#${target.dataset.segment}`);
    });

    const hash = window.location.hash.replace(/^#/, '');
    if (hash && ids.includes(hash)) activateSegment(root, hash);
  }
}
