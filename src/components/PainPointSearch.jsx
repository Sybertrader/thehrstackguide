import { useEffect, useRef, useState } from 'react';

const PRESETS = [
  'Hire in Brazil without local entity or setup fees',
  'Flat PEPM rate for international contractor onboarding',
  'ATS for high-volume hiring without per-seat pricing',
  'Slack-native 360 performance reviews',
];

const MIN_QUERY = 3;

function logoSrc(path) {
  if (!path) return '';
  return encodeURI(path);
}

export default function PainPointSearch() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setMatches([]);
      return undefined;
    }

    const handle = setTimeout(() => {
      const id = requestId.current + 1;
      requestId.current = id;

      fetch('/api/jev-search/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (id !== requestId.current) return;
          if (!response.ok) {
            setMatches([]);
            return;
          }
          setMatches(Array.isArray(body.matches) ? body.matches : []);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setMatches([]);
        });
    }, 180);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="mx-auto my-12 max-w-4xl rounded-2xl border border-indigo-800/50 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 text-white shadow-xl sm:p-10">
      <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Describe your HR problem.</h2>
      <p className="mb-6 mt-1 text-center text-base text-indigo-200">We recommend the tools that fit.</p>

      <input
        id="pain-point-search"
        type="text"
        value={query}
        maxLength={400}
        autoComplete="off"
        aria-label="Describe your HR problem"
        placeholder="Describe a problem your team has (e.g., hiring engineers in LatAm)..."
        onChange={(event) => setQuery(event.target.value)}
        className="mx-auto block w-full max-w-2xl rounded-full border-0 bg-white px-6 py-3.5 text-slate-900 shadow-md outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400"
      />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium italic text-indigo-300">Try:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setQuery(preset)}
            className="rounded-full border border-indigo-700/60 bg-indigo-950/80 px-3.5 py-1.5 text-xs text-indigo-100 transition-colors hover:bg-indigo-800"
          >
            {preset}
          </button>
        ))}
      </div>

      {matches.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3" aria-live="polite">
          {matches.map((match) => {
            const affiliate = String(match.href).startsWith('/go/');
            const action = affiliate ? 'Try' : 'View';
            return (
              <span
                key={match.id}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-700/50 bg-white/5 py-1 pl-1.5 pr-1"
              >
                {match.logo ? (
                  <img
                    src={logoSrc(match.logo)}
                    alt=""
                    width="20"
                    height="20"
                    className="h-5 w-5 rounded bg-white object-contain p-0.5"
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-bold text-indigo-900">
                    {match.name.slice(0, 1)}
                  </span>
                )}
                <span className="text-sm font-bold text-white">{match.name}</span>
                <a
                  href={match.href}
                  aria-label={`${action} ${match.name}`}
                  className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-400"
                >
                  {action}
                </a>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
