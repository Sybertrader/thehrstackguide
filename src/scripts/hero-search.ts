interface SearchTool {
  name: string;
  href: string;
}

interface SearchComparison {
  slug: string;
  a: string;
  b: string;
}

interface SearchData {
  tools: SearchTool[];
  comparisons: SearchComparison[];
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (char) => entities[char] ?? char);
}

export function initHeroSearch(): void {
  const dataEl = document.getElementById('hero-search-data');
  const input = document.getElementById('hero-search-input') as HTMLInputElement | null;
  const results = document.getElementById('hero-search-results');
  const form = document.getElementById('hero-search-form') as HTMLFormElement | null;
  if (!dataEl?.textContent || !input || !results || !form) return;

  let data: SearchData;
  try {
    data = JSON.parse(dataEl.textContent) as SearchData;
  } catch {
    return;
  }

  function findMatches(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { tools: [] as SearchTool[], comparisons: [] as SearchComparison[], exactTool: null as SearchTool | null };

    const exactTool = data.tools.find((tool) => tool.name.toLowerCase() === q) ?? null;
    const tools = data.tools.filter((tool) => tool.name.toLowerCase().includes(q)).slice(0, 4);
    const comparisons = data.comparisons
      .filter((row) => row.a.toLowerCase().includes(q) || row.b.toLowerCase().includes(q))
      .slice(0, 5);

    return { tools, comparisons, exactTool };
  }

  function render(query: string) {
    const { tools, comparisons } = findMatches(query);

    if (!tools.length && !comparisons.length) {
      results!.classList.add('hidden');
      results!.innerHTML = '';
      return;
    }

    let html = '';
    if (tools.length) {
      html += '<p class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Software</p>';
      html += tools
        .map(
          (tool) =>
            `<a href="${tool.href}" class="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"><span>${escapeHtml(tool.name)}</span><span class="text-xs text-slate-400">View category</span></a>`,
        )
        .join('');
    }
    if (comparisons.length) {
      html += '<p class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Comparisons</p>';
      html += comparisons
        .map(
          (row) =>
            `<a href="/${row.slug}/" class="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"><span>${escapeHtml(row.a)} vs ${escapeHtml(row.b)}</span></a>`,
        )
        .join('');
    }

    results!.innerHTML = html;
    results!.classList.remove('hidden');
  }

  let debounceTimer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => render(input.value), 120);
  });
  input.addEventListener('focus', () => {
    if (input.value) render(input.value);
  });
  document.addEventListener('click', (event) => {
    if (!form.contains(event.target as Node)) results.classList.add('hidden');
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    render(initialQuery);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const { tools, comparisons, exactTool } = findMatches(query);
    if (exactTool) window.location.href = exactTool.href;
    else if (comparisons.length) window.location.href = `/${comparisons[0].slug}/`;
    else if (tools.length) window.location.href = tools[0].href;
  });
}
