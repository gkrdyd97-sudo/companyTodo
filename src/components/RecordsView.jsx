import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { allRecords } from "../lib/api";
import { fmtFull } from "../lib/date";
import { FIELDS, FIELD_NAMES, hasText } from "../data/categories";

const FILTERS = [["all", "전체"], ["learned", "배운 것"], ["verified", "확인한 것"], ["diff", "본 차이"], ["questions", "여쭤볼 것"]];

function Highlight({ text, q }) {
  if (!q) return text;
  const parts = []; const lower = text.toLowerCase(), ql = q.toLowerCase();
  let i = 0, j, n = 0;
  while ((j = lower.indexOf(ql, i)) !== -1) {
    parts.push(text.slice(i, j));
    parts.push(<mark key={n++} className="bg-amber-200 rounded px-0.5">{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  parts.push(text.slice(i));
  return parts;
}

export default function RecordsView({ onOpenDay, toast }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    allRecords().then(setData).catch(() => toast("기록을 불러오지 못했습니다. 인터넷 연결을 확인하세요."));
  }, []);

  const entries = useMemo(() => {
    if (!data) return [];
    const map = {};
    data.journals.forEach(j => { if (hasText(j)) (map[j.date] ||= { date: j.date, todos: [] }).j = j; });
    data.todos.forEach(t => (map[t.date] ||= { date: t.date, todos: [] }).todos.push(t));
    const query = q.trim().toLowerCase();
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date)).filter(e => {
      const keys = filter === "all" ? FIELDS : [filter];
      e.fields = keys.filter(k => e.j && (e.j[k] || "").trim());
      if (filter !== "all" && !e.fields.length) return false;
      if (!query) return true;
      const hay = e.fields.map(k => e.j[k]).join("\n") + (filter === "all" ? "\n" + e.todos.map(t => t.text).join("\n") : "");
      return hay.toLowerCase().includes(query);
    });
  }, [data, q, filter]);

  return (
    <section>
      <div className="relative mb-4">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="배운 것, 질문, 할 일 검색" aria-label="기록 검색"
          className="w-full h-12 pl-12 pr-4 rounded-full bg-white shadow-e1 border border-transparent focus:border-primary focus:outline-none" />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto" role="group" aria-label="보기 필터">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
            className={`h-8 px-3 rounded-lg border text-sm whitespace-nowrap ${filter === k ? "bg-primary-light border-primary-light text-primary-ink font-medium" : "bg-white border-gray-300 text-gray-700"}`}>{label}</button>
        ))}
      </div>
      {!data && <p className="text-center text-gray-500 py-16">불러오는 중</p>}
      {data && !entries.length && (
        <div className="text-center py-16 text-gray-500">
          <Icon name="menu_book" className="!text-5xl text-gray-300" />
          <p className="mt-2">{q ? `‘${q}’에 맞는 기록이 없습니다.` : "아직 기록이 없습니다. 캘린더에서 날짜를 눌러 첫 메모를 적어 보세요."}</p>
        </div>
      )}
      <div className="space-y-3">
        {entries.map(e => (
          <article key={e.date} className="bg-white rounded-2xl shadow-e1 p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-medium">{fmtFull(e.date)}</h3>
              <button onClick={() => onOpenDay(e.date)} className="h-8 px-3 rounded-full text-sm text-primary font-medium hover:bg-primary-light flex-none">열기</button>
            </div>
            {filter === "all" && e.todos.length > 0 && (
              <p className="text-xs text-gray-500 mb-2">할 일 {e.todos.filter(t => t.done).length} / {e.todos.length} 완료</p>
            )}
            {e.fields.map(k => (
              <div key={k}>
                <p className="text-xs font-medium text-primary mt-3">{FIELD_NAMES[k]}</p>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap mt-0.5"><Highlight text={e.j[k].trim()} q={q.trim()} /></p>
              </div>
            ))}
            {!e.fields.length && <p className="text-sm text-gray-500">할 일만 적은 날입니다.</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
