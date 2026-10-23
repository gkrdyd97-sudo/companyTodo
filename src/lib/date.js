const pad = n => String(n).padStart(2, "0");

export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const shift = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return ymd(d); };
export const fmt = s => { const [, m, d] = s.split("-"); return `${Number(m)}월 ${Number(d)}일`; };
export const dow = s => "일월화수목금토"[new Date(s + "T00:00:00").getDay()];
export const fmtFull = s => `${s.slice(0, 4)}년 ${fmt(s)} ${dow(s)}요일`;
export const monthRange = (y, m) => [`${y}-${pad(m + 1)}-01`, ymd(new Date(y, m + 1, 0))];
export const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
export { pad };
