// Dixon-Coles (1997) met tijdsverval. log λ = att[thuis] − def[uit] + thuisvoordeel, log μ = att[uit] − def[thuis].
export interface Match { home: string; away: string; hg: number; ag: number; date: number }
export interface Model { teams: string[]; att: number[]; def: number[]; home: number; rho: number; idx: Map<string, number> }
export interface FitOptions { xi?: number; asOf?: number; ridge?: number; maxIter?: number; init?: Model }

const DAY = 86400000;
const MAXG = 10;

const tau = (x: number, y: number, l: number, m: number, rho: number) =>
  x === 0 && y === 0 ? 1 - l * m * rho : x === 0 && y === 1 ? 1 + l * rho : x === 1 && y === 0 ? 1 + m * rho : x === 1 && y === 1 ? 1 - rho : 1;

export function fit(matches: Match[], o: FitOptions = {}): Model {
  const xi = o.xi ?? 0.0019, ridge = o.ridge ?? 0.01, maxIter = o.maxIter ?? 400;
  const asOf = o.asOf ?? Math.max(...matches.map((m) => m.date));
  const teams = [...new Set(matches.flatMap((m) => [m.home, m.away]))].sort();
  const n = teams.length, idx = new Map(teams.map((t, i) => [t, i]));
  const H = matches.map((m) => idx.get(m.home)!), A = matches.map((m) => idx.get(m.away)!);
  const w = matches.map((m) => Math.exp(-xi * Math.max(0, asOf - m.date) / DAY));
  const W = w.reduce((a, b) => a + b, 0);
  const iHome = 2 * n, iRho = 2 * n + 1, dim = 2 * n + 2;

  const th = new Array<number>(dim).fill(0);
  th[iHome] = 0.25;
  if (o.init) for (const t of teams) { const j = o.init.idx.get(t); if (j !== undefined) { th[idx.get(t)!] = o.init.att[j]; th[n + idx.get(t)!] = o.init.def[j]; } }
  if (o.init) { th[iHome] = o.init.home; th[iRho] = o.init.rho; }

  const evalAt = (p: number[], grad: number[] | null): number => {
    if (grad) grad.fill(0);
    let f = 0;
    for (let k = 0; k < matches.length; k++) {
      const h = H[k], a = A[k], x = matches[k].hg, y = matches[k].ag;
      const lh = p[h] - p[n + a] + p[iHome], la = p[a] - p[n + h];
      const l = Math.exp(lh), m = Math.exp(la), rho = p[iRho];
      const t = tau(x, y, l, m, rho);
      if (!(t > 1e-10)) return -Infinity;
      f += w[k] * (x * lh - l + y * la - m + Math.log(t));
      if (grad) {
        let dl = x - l, dm = y - m, dr = 0;
        if (x === 0 && y === 0) { dl += l * (-m * rho) / t; dm += m * (-l * rho) / t; dr = -l * m / t; }
        else if (x === 0 && y === 1) { dl += l * rho / t; dr = l / t; }
        else if (x === 1 && y === 0) { dm += m * rho / t; dr = m / t; }
        else if (x === 1 && y === 1) { dr = -1 / t; }
        grad[h] += w[k] * dl; grad[n + a] -= w[k] * dl; grad[iHome] += w[k] * dl;
        grad[a] += w[k] * dm; grad[n + h] -= w[k] * dm; grad[iRho] += w[k] * dr;
      }
    }
    f /= W;
    let pen = 0;
    for (let i = 0; i < 2 * n; i++) pen += p[i] * p[i];
    f -= (ridge / 2) * pen;
    if (grad) {
      for (let i = 0; i < dim; i++) grad[i] /= W;
      for (let i = 0; i < 2 * n; i++) grad[i] -= ridge * p[i];
    }
    return f;
  };

  const g = new Array<number>(dim).fill(0), gPrev = new Array<number>(dim).fill(0), thPrev = new Array<number>(dim).fill(0);
  let f = evalAt(th, g), step = 0.5;
  for (let it = 0; it < maxIter; it++) {
    const gn = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
    if (gn < 1e-7) break;
    let accepted = false;
    for (let bt = 0; bt < 40; bt++) {
      const cand = th.map((v, i) => v + step * g[i]);
      cand[iRho] = Math.min(0.5, Math.max(-0.5, cand[iRho]));
      const gc = new Array<number>(dim).fill(0);
      const fc = evalAt(cand, gc);
      if (fc >= f + 1e-4 * step * gn * gn || (fc > f && bt > 20)) {
        gPrev.splice(0, dim, ...g); thPrev.splice(0, dim, ...th);
        th.splice(0, dim, ...cand); g.splice(0, dim, ...gc);
        const improved = fc - f; f = fc; accepted = true;
        // Barzilai-Borwein-stap voor de volgende iteratie
        let sy = 0, yy = 0;
        for (let i = 0; i < dim; i++) { const s = th[i] - thPrev[i], yv = gPrev[i] - g[i]; sy += s * yv; yy += yv * yv; }
        step = sy > 1e-14 ? Math.min(50, sy / yy * 1) : step * 2;
        if (improved < 1e-13) it = maxIter;
        break;
      }
      step /= 2;
    }
    if (!accepted) break;
  }
  return { teams, att: th.slice(0, n), def: th.slice(n, 2 * n), home: th[iHome], rho: th[iRho], idx };
}

const poisPmf = (k: number, lam: number) => { let p = Math.exp(-lam); for (let i = 1; i <= k; i++) p *= lam / i; return p; };

/** Kansen H/D/A, of null als een team het model niet kent. */
export function predict(model: Model, home: string, away: string): { H: number; D: number; A: number } | null {
  const h = model.idx.get(home), a = model.idx.get(away);
  if (h === undefined || a === undefined) return null;
  const l = Math.exp(model.att[h] - model.def[a] + model.home), m = Math.exp(model.att[a] - model.def[h]);
  let H = 0, D = 0, A = 0, tot = 0;
  for (let i = 0; i <= MAXG; i++) for (let j = 0; j <= MAXG; j++) {
    const p = poisPmf(i, l) * poisPmf(j, m) * tau(i, j, l, m, model.rho);
    tot += p; if (i > j) H += p; else if (i === j) D += p; else A += p;
  }
  return { H: H / tot, D: D / tot, A: A / tot };
}

/** Rondt af naar basispunten die samen exact 10000 zijn (grootste-restmethode), elk minstens 1. */
export function toBasisPoints(p: { H: number; D: number; A: number }): [number, number, number] {
  const raw = [p.H, p.D, p.A].map((v) => Math.max(v, 0.0001) * 10000);
  const fl = raw.map(Math.floor);
  let left = 10000 - fl.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - fl[i], i]).sort((x, y) => y[0] - x[0]);
  for (let k = 0; left > 0; k = (k + 1) % 3, left--) fl[order[k][1]]++;
  while (left < 0) { const i = fl.indexOf(Math.max(...fl)); fl[i]--; left++; }
  return [fl[0], fl[1], fl[2]];
}
