import { useEffect, useState } from "react";
import Icon from "./Icon";
import * as api from "../lib/api";
import { CATS, CUSTOM_CAT } from "../data/categories";
import { fmt, today } from "../lib/date";

export default function LearnView({ toast }) {
  const [checks, setChecks] = useState(null);
  const [custom, setCustom] = useState([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    Promise.all([api.listChecks(), api.listCustom()]).then(([c, x]) => {
      setChecks(Object.fromEntries(c.map(r => [r.item_id, r.checked_on])));
      setCustom(x);
    }).catch(() => toast("목록을 불러오지 못했습니다. 인터넷 연결을 확인하세요."));
  }, []);

  if (!checks) return <p className="text-center text-gray-500 py-16">불러오는 중</p>;

  const groups = CATS.map(c => ({ cat: c, items: c.items.map((text, i) => ({ id: c.id + i, text })), custom: false }));
  groups.push({ cat: CUSTOM_CAT, items: custom.map(c => ({ id: c.id, text: c.text })), custom: true });
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const done = groups.reduce((n, g) => n + g.items.filter(it => checks[it.id]).length, 0);

  async function toggle(id) {
    const before = checks[id];
    const next = before ? null : today();
    setChecks(c => { const o = { ...c }; if (next) o[id] = next; else delete o[id]; return o; });
    try { await api.setCheck(id, next); if (next) toast("배운 날짜를 기록했습니다"); }
    catch { toast("저장하지 못했습니다."); setChecks(c => ({ ...c, [id]: before })); }
  }
  async function add() {
    const v = newItem.trim(); if (!v) return;
    setNewItem("");
    try { const row = await api.addCustom(v); setCustom(x => [...x, row]); }
    catch { toast("추가하지 못했습니다."); setNewItem(v); }
  }
  async function removeCustom(id) {
    const prev = custom;
    setCustom(x => x.filter(c => c.id !== id));
    try { await api.deleteCustom(id); } catch { toast("삭제하지 못했습니다."); setCustom(prev); }
  }

  return (
    <section>
      <div className="bg-white rounded-2xl shadow-e1 p-5 mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">배울 것</h2>
          <p className="text-sm text-gray-500 mt-0.5">위에서부터 대략 입사 후 순서입니다. 배운 날 체크하면 날짜가 남습니다.</p>
        </div>
        <p className="text-2xl font-bold text-primary flex-none">{total ? Math.round((done / total) * 100) : 0}%</p>
      </div>
      <div className="space-y-3">
        {groups.map(g => {
          const n = g.items.filter(it => checks[it.id]).length;
          return (
            <details key={g.cat.id} className="bg-white rounded-2xl shadow-e1 overflow-hidden">
              <summary className="cursor-pointer p-4 sm:p-5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary-light text-primary grid place-items-center flex-none"><Icon name={g.cat.icon} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{g.cat.name}</span>
                  <span className="block text-xs text-gray-500">{g.cat.when}</span>
                  <span className="block mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <span className="block h-full bg-primary rounded-full" style={{ width: `${g.items.length ? (n / g.items.length) * 100 : 0}%` }} />
                  </span>
                </span>
                <span className="text-sm text-gray-600 flex-none">{n} / {g.items.length}</span>
                <Icon name="expand_more" className="chev text-gray-500" />
              </summary>
              <div className="px-4 sm:px-5 pb-4 border-t border-gray-100">
                {g.items.map(it => (
                  <label key={it.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer">
                    <input type="checkbox" className="md-check" checked={!!checks[it.id]} onChange={() => toggle(it.id)} />
                    <span className={`flex-1 ${checks[it.id] ? "text-gray-400" : ""}`}>{it.text}</span>
                    {checks[it.id] && <span className="text-xs text-primary bg-primary-light rounded-full px-2 py-0.5 flex-none">{fmt(checks[it.id])}</span>}
                    {g.custom && (
                      <button type="button" onClick={e => { e.preventDefault(); removeCustom(it.id); }} aria-label="항목 삭제"
                        className="w-7 h-7 rounded-full hover:bg-gray-100 grid place-items-center text-gray-500 flex-none"><Icon name="close" className="!text-[18px]" /></button>
                    )}
                  </label>
                ))}
                {g.custom && (
                  <div className="flex gap-2 pt-3">
                    <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="배운 것이나 배울 것을 직접 추가" aria-label="새 항목"
                      onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }}
                      className="flex-1 min-w-0 h-11 px-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none" />
                    <button onClick={add} className="h-11 px-4 rounded-full bg-primary text-white font-medium hover:bg-primary-dark">추가</button>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
