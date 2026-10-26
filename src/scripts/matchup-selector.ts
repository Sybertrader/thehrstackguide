function canonicalHref(map: Record<string, string>, vendorA: string, vendorB: string): string | null {
  return map[`${vendorA}|${vendorB}`] ?? map[`${vendorB}|${vendorA}`] ?? `/${vendorA}-vs-${vendorB}/`;
}

function syncDisabledOptions(selectA: HTMLSelectElement, selectB: HTMLSelectElement): void {
  const a = selectA.value;
  const b = selectB.value;
  for (const option of Array.from(selectA.options)) {
    if (!option.value) continue;
    option.disabled = option.value === b;
  }
  for (const option of Array.from(selectB.options)) {
    if (!option.value) continue;
    option.disabled = option.value === a;
  }
}

export function initMatchupSelectors(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-matchup-selector]'));

  for (const root of roots) {
    if (root.dataset.matchupBound === 'true') continue;
    root.dataset.matchupBound = 'true';

    const form = root.querySelector<HTMLFormElement>('[data-matchup-form]');
    const selectA = root.querySelector<HTMLSelectElement>('[data-vendor-a]');
    const selectB = root.querySelector<HTMLSelectElement>('[data-vendor-b]');
    const cta = root.querySelector<HTMLButtonElement>('[data-compare-cta]');
    const error = root.querySelector<HTMLElement>('[data-matchup-error]');
    if (!form || !selectA || !selectB || !cta) continue;

    let canonicalMap: Record<string, string> = {};
    try {
      canonicalMap = JSON.parse(root.dataset.canonicalMap || '{}') as Record<string, string>;
    } catch {
      canonicalMap = {};
    }

    function updateCta() {
      const ready = Boolean(selectA!.value && selectB!.value && selectA!.value !== selectB!.value);
      cta!.disabled = !ready;
      if (error) {
        error.classList.add('hidden');
        error.textContent = '';
      }
    }

    function onChange() {
      if (selectA!.value && selectA!.value === selectB!.value) {
        selectB!.value = '';
      }
      syncDisabledOptions(selectA!, selectB!);
      updateCta();
    }

    selectA.addEventListener('change', onChange);
    selectB.addEventListener('change', onChange);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const vendorA = selectA.value;
      const vendorB = selectB.value;
      if (!vendorA || !vendorB || vendorA === vendorB) {
        if (error) {
          error.textContent = 'Select two different platforms to compare.';
          error.classList.remove('hidden');
        }
        return;
      }
      const target = canonicalHref(canonicalMap, vendorA, vendorB);
      if (target) window.location.href = target;
    });

    syncDisabledOptions(selectA, selectB);
    updateCta();
  }
}
