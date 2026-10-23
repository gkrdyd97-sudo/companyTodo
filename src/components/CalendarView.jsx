import { useEffect, useState } from "react";
import Icon from "./Icon";
import { monthData, allRecords, listChecks, listCustom } from "../lib/api";
import { today, shift, monthRange, monthKey, pad, fmtFull } from "../lib/date";
import { hasText, TOTAL_BASE_ITEMS } from "../data/categories";

export default function CalendarView({ viewMonth, setViewMonth, onOpenDay, toast }) {
  const [y, m] = viewMonth;
  const [month, setMonth] = useState({ todos: [], journals: [] });
  const [stats, setStats] = useState({ learned: 0, total: TOTAL_BASE_ITEMS, days: 0, streak: 0 });

  useEffect(() => {
    let alive = true;
    const [s, e] = monthRange(y, m);
    monthData(s, e).then(d => alive && setMonth(d)).catch(() => toast("캘린더를 불러오지 못했습니다. 인터넷 연결을 확인하세요."));
    return () => { alive = false; };
  }, [y, m]);

  useEffect(() => {
    let alive = true;
    Promise.all([allRecords(), listChecks(), listCustom()]).then(([rec, checks, custom]) => {
      if (!alive) return;
      const days = new Set(rec.todos.map(t => t.date));
      rec.journals.forEach(j => { if (hasText(j)) days.add(j.date); });
      let d = today(); if (!days.has(d)) d = shift(d, -1);
      let streak = 0; while (days.has(d)) { streak++; d = shift(d, -1); }
      setStats({ learned: checks.length, total: TOTAL_BASE_ITEMS + custom.length, days: days.size, streak });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const byDate = {};
  month.todos.forEach(t => { const b = (byDate[t.date] ||= { n: 0, ok: 0, wrote: false }); b.n++; if (t.done) b.ok++; });
  month.journals.forEach(j => { if (hasText(j)) (byDate[j.date] ||= { n: 0, ok: 0, wrote: false }).wrote = true; });
  const mTotal = month.todos.length, mDone = month.todos.filter(t => t.done).length;

  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  const t = today();
  const go = n => { let yy = y, mm = m + n; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } setViewMonth([yy, mm]); };

  return (
    <section>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="배울 것" value={stats.learned} sub={`/ ${stats.total}`} ratio={stats.total ? stats.learned / stats.total : 0} />
        <Stat label="기록한 날" value={stats.days} sub="일" note={stats.streak ? `${stats.streak}일 연속` : ""} />
        <Stat label="이번 달 할 일" value={mDone} sub={`/ ${mTotal}`} ratio={mTotal ? mDone / mTotal : 0} />
      </div>

      <div className="bg-white rounded-2xl shadow-e1 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-medium">{y}년 {m + 1}월</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => go(-1)} className="w-10 h-10 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="이전 달"><Icon name="chevron_left" /></button>
            <button onClick={() => { const d = new Date(); setViewMonth([d.getFullYear(), d.getMonth()]); }} className="h-9 px-3 rounded-full border border-gray-300 text-sm font-medium text-primary hover:bg-primary-light">오늘</button>
            <button onClick={() => go(1)} className="w-10 h-10 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="다음 달"><Icon name="chevron_right" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {"일월화수목금토".split("").map((d, i) => (
            <div key={d} className={`text-center text-xs py-1 ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-700" : "text-gray-500"}`}>{d}</div>
          ))}
          {Array.from({ length: first }, (_, i) => <div key={"b" + i} />)}
          {Array.from({ length: last }, (_, i) => {
            const d = i + 1, key = `${monthKey(y, m)}-${pad(d)}`, wd = (first + i) % 7;
            const b = byDate[key];
            const isToday = key === t;
            const label = [fmtFull(key), b && b.n ? `할 일 ${b.ok}개 완료, 전체 ${b.n}개` : "", b && b.wrote ? "메모 있음" : ""].filter(Boolean).join(", ");
            return (
              <button key={key} onClick={() => onOpenDay(key)} aria-label={label}
                className={`relative aspect-square sm:aspect-[4/3.4] rounded-xl p-1.5 sm:p-2 text-left flex flex-col transition-colors ${isToday ? "bg-primary-light ring-2 ring-primary" : "bg-gray-50 hover:bg-gray-100"} ${key > t ? "opacity-60" : ""}`}>
                <span className={`text-sm font-medium ${isToday ? "text-primary-ink" : wd === 0 ? "text-red-600" : wd === 6 ? "text-blue-700" : "text-gray-800"}`}>{d}</span>
                {b && b.wrote && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                {b && b.n > 0 && (<>
                  <span className="hidden sm:block mt-auto text-[11px] text-gray-500">{b.ok}/{b.n}</span>
                  <span className="mt-auto sm:mt-1 h-1 rounded-full bg-gray-200 overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${(b.ok / b.n) * 100}%` }} /></span>
                </>)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 px-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-primary" />할 일 완료</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />메모를 쓴 날</span>
        </div>
      </div>

      <button onClick={() => onOpenDay(today())}
        className="fixed right-5 bottom-24 md:bottom-8 z-20 h-14 px-5 rounded-2xl bg-primary text-white shadow-e2 flex items-center gap-2 font-medium hover:bg-primary-dark">
        <Icon name="edit_note" />오늘 메모
      </button>
    </section>
  );
}

function Stat({ label, value, sub, ratio, note }) {
  return (
    <div className="bg-white rounded-2xl shadow-e1 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}<span className="text-sm font-normal text-gray-500"> {sub}</span></p>
      {ratio !== undefined
        ? <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${ratio * 100}%` }} /></div>
        : <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </div>
  );
}
