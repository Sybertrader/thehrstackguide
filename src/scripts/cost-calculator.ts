function money(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function annualCost(
    eorCount: number,
    contractorCount: number,
    eorRate: number,
    contractorRate: number,
    fixedMonthly = 0,
  ): number {
    return (eorCount * eorRate + contractorCount * contractorRate + fixedMonthly) * 12;
  }

  function fixedMonthly(
    eorCount: number,
    contractorCount: number,
    vendor: { contractorBaseFee?: number; platformBaseFee?: number; platformPerUser?: number } | undefined,
  ): number {
    const headcount = eorCount + contractorCount;
    if (!vendor || headcount <= 0) return 0;
    const contractorBase = contractorCount > 0 ? vendor.contractorBaseFee ?? 0 : 0;
    return contractorBase + (vendor.platformBaseFee ?? 0) + (vendor.platformPerUser ?? 0) * headcount;
  }

  function num(root: HTMLElement, key: string): number {
    return Number(root.dataset[key] ?? 0) || 0;
  }

  function initCalculator(root: HTMLElement) {
    const MAX_EOR = 250;
    const MAX_CONTRACTORS = 500;
    const ENTERPRISE_EOR_THRESHOLD = 50;

    const eorSlider = root.querySelector<HTMLInputElement>('[data-eor-slider]');
    const contractorSlider = root.querySelector<HTMLInputElement>('[data-contractor-slider]');
    const eorCountEl = root.querySelector<HTMLInputElement>('[data-eor-count]');
    const contractorCountEl = root.querySelector<HTMLInputElement>('[data-contractor-count]');
    const savingsWrap = root.querySelector<HTMLElement>('[data-savings-badge]');
    const savingsText = root.querySelector('[data-savings-text]');
    const enterpriseCallout = root.querySelector<HTMLElement>('[data-enterprise-callout]');
    const cardA = root.querySelector<HTMLElement>('[data-vendor-card="a"]');
    const cardB = root.querySelector<HTMLElement>('[data-vendor-card="b"]');
    const selectA = root.querySelector<HTMLSelectElement>('[data-vendor-select="a"]');
    const selectB = root.querySelector<HTMLSelectElement>('[data-vendor-select="b"]');
    const pairCopy = root.querySelector('[data-pair-copy]');
    if (!eorSlider || !contractorSlider || !eorCountEl || !contractorCountEl || !cardA || !cardB) return;

    function clamp(value: number, min: number, max: number): number {
      if (!Number.isFinite(value)) return min;
      return Math.min(max, Math.max(min, Math.round(value)));
    }

    let cycle: 'annual' | 'monthly' = 'annual';
    let catalog: Record<string, {
      id: string;
      name: string;
      affiliateUrl: string;
      logo?: string;
      eorMonthlyRate: number;
      eorAnnualRate: number;
      contractorMonthlyRate: number;
      contractorAnnualRate: number;
      contractorBaseFee?: number;
      platformBaseFee?: number;
      platformPerUser?: number;
      fxMarkupPercent?: number;
      depositMonths?: number;
    }> = {};

    const catalogNode = root.querySelector('[data-cost-calculator-catalog]');
    if (catalogNode?.textContent) {
      try {
        const list = JSON.parse(catalogNode.textContent) as Array<(typeof catalog)[string]>;
        catalog = Object.fromEntries(list.map((vendor) => [vendor.id, vendor]));
      } catch {
        catalog = {};
      }
    }

    const applyVendor = (side: 'a' | 'b', vendorId: string) => {
      const vendor = catalog[vendorId];
      if (!vendor) return;
      const prefix = side;
      root.dataset[`${prefix}Id`] = vendor.id;
      root.dataset[`${prefix}Name`] = vendor.name;
      root.dataset[`${prefix}EorMonthly`] = String(vendor.eorMonthlyRate);
      root.dataset[`${prefix}EorAnnual`] = String(vendor.eorAnnualRate);
      root.dataset[`${prefix}ContractorMonthly`] = String(vendor.contractorMonthlyRate);
      root.dataset[`${prefix}ContractorAnnual`] = String(vendor.contractorAnnualRate);
      root.dataset[`${prefix}EorPublished`] = 'true';
      root.dataset[`${prefix}ContractorPublished`] = 'true';

      const card = side === 'a' ? cardA : cardB;
      const nameEl = card.querySelector('[data-vendor-name]');
      if (nameEl) nameEl.textContent = vendor.name;
      const logo = card.querySelector<HTMLImageElement>('[data-vendor-logo]');
      if (logo) {
        logo.src = vendor.logo || '';
        logo.alt = `${vendor.name} logo`;
        logo.classList.toggle('hidden', !vendor.logo);
      }

      const cta = root.querySelector(`[data-calc-cta="${side}"] .js-affiliate-cta`);
      if (cta instanceof HTMLAnchorElement) {
        cta.href = vendor.affiliateUrl;
        cta.setAttribute('data-vendor-id', vendor.id);
        cta.setAttribute('data-vendor-name', vendor.name);
        cta.setAttribute('data-track-vendor', vendor.name);
        cta.textContent = `Book ${vendor.name} Demo to Lock in Custom Quote →`;
      }

      if (pairCopy) {
        pairCopy.textContent = `Estimate your total annual software & platform fees for ${root.dataset.aName} vs ${root.dataset.bName} based on your exact team roadmap.`;
      }
    };

    const ratesFor = (side: 'a' | 'b') =>
      cycle === 'annual'
        ? {
            eor: num(root, `${side}EorAnnual`),
            contractor: num(root, `${side}ContractorAnnual`),
          }
        : {
            eor: num(root, `${side}EorMonthly`),
            contractor: num(root, `${side}ContractorMonthly`),
          };

    function sideNeedsQuote(side: 'a' | 'b', eorCount: number, contractorCount: number): boolean {
      const eorPublished = root.dataset[`${side}EorPublished`] === 'true';
      const contractorPublished = root.dataset[`${side}ContractorPublished`] === 'true';
      return (eorCount > 0 && !eorPublished) || (contractorCount > 0 && !contractorPublished);
    }

    function paintCard(
      card: HTMLElement,
      side: 'a' | 'b',
      eorCount: number,
      contractorCount: number,
      eorRate: number,
      contractorRate: number,
      vendor?: { contractorBaseFee?: number; platformBaseFee?: number; platformPerUser?: number; fxMarkupPercent?: number; depositMonths?: number },
    ): number | null {
      const annualEl = card.querySelector('[data-annual-total]');
      const suffix = card.querySelector('[data-annual-suffix]');
      const monthlyWrap = card.querySelector('[data-monthly-wrap]');
      const monthlyEl = card.querySelector('[data-monthly-total]');
      const quoteNote = card.querySelector('[data-quote-note]');
      const rateLines = card.querySelector('[data-rate-lines]');
      const eorLine = card.querySelector('[data-eor-line]');
      const contractorLine = card.querySelector('[data-contractor-line]');
      if (sideNeedsQuote(side, eorCount, contractorCount)) {
        if (annualEl) annualEl.textContent = root.dataset.quoteLabel || 'Custom Quote Required';
        suffix?.classList.add('hidden');
        monthlyWrap?.classList.add('hidden');
        quoteNote?.classList.remove('hidden');
        if (quoteNote) quoteNote.textContent = root.dataset.quoteSubtext || '';
        rateLines?.classList.add('hidden');
        return null;
      }
      const fixed = fixedMonthly(eorCount, contractorCount, vendor);
      const yearly = annualCost(eorCount, contractorCount, eorRate, contractorRate, fixed);
      if (annualEl) annualEl.textContent = money(yearly);
      suffix?.classList.remove('hidden');
      monthlyWrap?.classList.remove('hidden');
      quoteNote?.classList.add('hidden');
      rateLines?.classList.remove('hidden');
      if (monthlyEl) monthlyEl.textContent = money(yearly / 12);
      if (eorLine) eorLine.textContent = `EOR Fees (${eorCount} × ${money(eorRate)}/mo)`;
      if (contractorLine) {
        const base = contractorCount > 0 ? vendor?.contractorBaseFee ?? 0 : 0;
        contractorLine.textContent =
          base > 0
            ? `Contractor Fees (${contractorCount} × ${money(contractorRate)}/mo + ${money(base)} base)`
            : `Contractor Fees (${contractorCount} × ${money(contractorRate)}/mo)`;
      }
      const fixedLine = card.querySelector('[data-fixed-line]');
      if (fixedLine) {
        const platformOnly = fixed - (contractorCount > 0 ? vendor?.contractorBaseFee ?? 0 : 0);
        fixedLine.textContent = `Platform base (${money(platformOnly)}/mo)`;
        fixedLine.classList.toggle('hidden', platformOnly <= 0);
      }
      const depositLine = card.querySelector('[data-deposit-line]');
      if (depositLine) {
        const months = vendor?.depositMonths ?? 0;
        depositLine.textContent = `Upfront deposit: ${months} month of gross salary per EOR employee`;
        depositLine.classList.toggle('hidden', months <= 0 || eorCount <= 0);
      }
      const fxLine = card.querySelector('[data-fx-line]');
      if (fxLine) {
        const fx = vendor?.fxMarkupPercent ?? 0;
        fxLine.textContent = `FX markup about ${fx}% of cross-border payroll`;
        fxLine.classList.toggle('hidden', fx <= 0);
      }
      return yearly;
    }

    function update() {
      if (!cardA || !cardB || !contractorCountEl || !eorCountEl || !contractorSlider || !eorSlider) return;
      const eorCount = clamp(Number(eorSlider.value), 0, MAX_EOR);
      const contractorCount = clamp(Number(contractorSlider.value), 0, MAX_CONTRACTORS);
      if (document.activeElement !== eorCountEl) eorCountEl.value = String(eorCount);
      if (document.activeElement !== contractorCountEl) contractorCountEl.value = String(contractorCount);

      const a = ratesFor('a');
      const b = ratesFor('b');
      const vendorA = catalog[root.dataset.aId ?? ''];
      const vendorB = catalog[root.dataset.bId ?? ''];
      const yearlyA = paintCard(cardA, 'a', eorCount, contractorCount, a.eor, a.contractor, vendorA);
      const yearlyB = paintCard(cardB, 'b', eorCount, contractorCount, b.eor, b.contractor, vendorB);
      const comparable = yearlyA != null && yearlyB != null;
      const delta = comparable ? Math.abs(yearlyA - yearlyB) : 0;
      const aWins = comparable && yearlyA < yearlyB;
      const bWins = comparable && yearlyB < yearlyA;
      const enterprise = eorCount > ENTERPRISE_EOR_THRESHOLD;

      cardA.classList.toggle('border-emerald-300', aWins);
      cardA.classList.toggle('ring-2', aWins);
      cardA.classList.toggle('ring-emerald-100', aWins);
      cardA.classList.toggle('border-slate-200', !aWins);
      cardB.classList.toggle('border-emerald-300', bWins);
      cardB.classList.toggle('ring-2', bWins);
      cardB.classList.toggle('ring-emerald-100', bWins);
      cardB.classList.toggle('border-slate-200', !bWins);

      if (savingsWrap && savingsText) {
        if (delta > 0) {
          const winner = aWins ? root.dataset.aName : root.dataset.bName;
          savingsText.textContent = `${winner} saves you ${money(delta)}/yr for this team size`;
          savingsWrap.classList.remove('hidden');
        } else {
          savingsWrap.classList.add('hidden');
        }
      }

      enterpriseCallout?.classList.toggle('hidden', !enterprise);
      root.querySelectorAll('[data-calc-cta] .js-affiliate-cta').forEach((cta) => {
        cta.classList.toggle('ring-2', enterprise);
        cta.classList.toggle('ring-amber-400', enterprise);
        cta.classList.toggle('ring-offset-2', enterprise);
        cta.classList.toggle('shadow-lg', enterprise);
      });
    }

    function setCountFromInput(slider: HTMLInputElement, numberInput: HTMLInputElement, min: number, max: number) {
      if (numberInput.value === '') {
        slider.value = String(min);
        update();
        return;
      }
      const next = clamp(Number(numberInput.value), min, max);
      numberInput.value = String(next);
      slider.value = String(next);
      update();
    }

    function setCountFromSlider(slider: HTMLInputElement, numberInput: HTMLInputElement) {
      numberInput.value = slider.value;
      update();
    }

    function setCycle(next: 'annual' | 'monthly') {
      cycle = next;
      root.querySelectorAll<HTMLButtonElement>('[data-billing]').forEach((button) => {
        const active = button.getAttribute('data-billing') === next;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      update();
    }

    eorSlider.addEventListener('input', () => setCountFromSlider(eorSlider, eorCountEl));
    contractorSlider.addEventListener('input', () => setCountFromSlider(contractorSlider, contractorCountEl));
    eorCountEl.addEventListener('input', () => setCountFromInput(eorSlider, eorCountEl, 0, MAX_EOR));
    contractorCountEl.addEventListener('input', () => setCountFromInput(contractorSlider, contractorCountEl, 0, MAX_CONTRACTORS));
    eorCountEl.addEventListener('blur', () => {
      if (eorCountEl.value === '') eorCountEl.value = '0';
      setCountFromInput(eorSlider, eorCountEl, 0, MAX_EOR);
    });
    contractorCountEl.addEventListener('blur', () => {
      if (contractorCountEl.value === '') contractorCountEl.value = '0';
      setCountFromInput(contractorSlider, contractorCountEl, 0, MAX_CONTRACTORS);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-billing]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = button.getAttribute('data-billing');
        if (next === 'annual' || next === 'monthly') setCycle(next);
      });
    });

    const onVendorChange = (side: 'a' | 'b', select: HTMLSelectElement, other: HTMLSelectElement | null) => {
      let nextId = select.value;
      if (other && nextId === other.value) {
        const previous = side === 'a' ? root.dataset.aId : root.dataset.bId;
        if (previous && previous !== nextId) {
          other.value = previous;
          applyVendor(side === 'a' ? 'b' : 'a', previous);
        }
      }
      applyVendor(side, select.value);
      update();
    };

    selectA?.addEventListener('change', () => onVendorChange('a', selectA, selectB));
    selectB?.addEventListener('change', () => onVendorChange('b', selectB, selectA));

    update();
  }


export function initCostCalculators(): void {
  document.querySelectorAll<HTMLElement>('[data-cost-calculator]').forEach(initCalculator);
}
