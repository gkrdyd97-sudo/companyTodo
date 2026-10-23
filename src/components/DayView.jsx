import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import * as api from "../lib/api";
import { fmt, dow, today, shift } from "../lib/date";
import { FIELDS, FIELD_LABELS, FIELD_HINTS } from "../data/categories";

const EMPTY = { learned: "", verified: "", diff: "", questions: "" };

export default function DayView({ date, onChangeDate, toast }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [memo, setMemo] = useState(EMPTY);
  const [prevQ, setPrevQ] = useState(null);
  const [unfinished, setUnfinished] = useState(null);
  const [note, setNote] = useState("");
  const timer = useRef(null);
  const pending = useRef(null);

  // 날짜가 바뀌면: 이전 날짜에 저장 안 된 메모가 있으면 먼저 저장하고, 새 날짜 데이터를 불러옵니다.
  useEffect(() => {
    let alive = true;
    setNote("");
    Promise.all([api.listTodos(date), api.getJournal(date), api.lastQuestions(date), api.lastUnfinished(date)])
      .then(([t, j, q, u]) => {
        if (!alive) return;
        setTodos(t);
        setMemo(j ? FIELDS.reduce((o, k) => ({ ...o, [k]: j[k] || "" }), {}) : EMPTY);
        setPrevQ(q); setUnfinished(u);
      })
      .catch(() => toast("기록을 불러오지 못했습니다. 인터넷 연결을 확인하세요."));
    return () => { alive = false; flush(); };
  }, [date]);

  // 화면을 닫거나 새로고침할 때도 저장
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  function flush() {
    if (!pending.current) return;
    clearTimeout(timer.current);
    const { d, m } = pending.current; pending.current = null;
    api.saveJournal(d, m).catch(() => toast("메모를 저장하지 못했습니다."));
  }

  function onMemo(k, v) {
    const next = { ...memo, [k]: v };
    setMemo(next); setNote("입력 중");
    pending.current = { d: date, m: next };
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const p = pending.current; pending.current = null;
      if (!p) return;
      try { await api.saveJournal(p.d, p.m); setNote("저장됨"); }
      catch { setNote("저장 실패"); toast("메모를 저장하지 못했습니다. 인터넷 연결을 확인하세요."); pending.current = p; }
    }, 700);
  }

  async function add() {
    const v = newTodo.trim(); if (!v) return;
    setNewTodo("");
    try { const row = await api.addTodo(date, v); setTodos(t => [...t, row]); }
    catch { toast("할 일을 추가하지 못했습니다."); setNewTodo(v); }
  }
  async function toggle(item) {
    setTodos(t => t.map(x => x.id === item.id ? { ...x, done: !x.done } : x));
    try { await api.setTodoDone(item.id, !item.done); }
    catch { toast("저장하지 못했습니다."); setTodos(t => t.map(x => x.id === item.id ? item : x)); }
  }
  async function remove(item) {
    setTodos(t => t.filter(x => x.id !== item.id));
    try { await api.deleteTodo(item.id); toast("할 일을 삭제했습니다"); }
    catch { toast("삭제하지 못했습니다."); setTodos(t => [...t, item]); }
  }
  const carryTexts = unfinished ? unfinished.texts.filter(x => !todos.some(t => t.text === x)) : [];
  async function carry() {
    try { const rows = await api.addTodos(date, carryTexts); setTodos(t => [...t, ...rows]); toast(`${rows.length}개를 가져왔습니다`); }
    catch { toast("가져오지 못했습니다."); }
  }

  const ok = todos.filter(t => t.done).length;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-4">
        <button onClick={() => onChangeDate(shift(date, -1))} className="w-10 h-10 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="이전 날"><Icon name="chevron_left" /></button>
        <div className="text-center">
          <h2 className="text-lg font-medium">{fmt(date)} {dow(date)}요일</h2>
          <p className="text-xs text-gray-500">{date === today() ? "오늘" : date.slice(0, 4) + "년"}</p>
        </div>
        <button onClick={() => onChangeDate(shift(date, 1))} className="w-10 h-10 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="다음 날"><Icon name="chevron_right" /></button>
      </div>

      <div className="bg-white rounded-2xl shadow-e1 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="checklist" className="text-primary" />
          <h3 className="font-medium">할 일</h3>
          {todos.length > 0 && <span className="ml-auto text-sm text-gray-500">{ok} / {todos.length} 완료</span>}
        </div>
        <div className="flex gap-2">
          <input value={newTodo} onChange={e => setNewTodo(e.target.value)} aria-label="새 할 일"
            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }}
            placeholder="할 일을 적고 Enter" className="flex-1 min-w-0 h-11 px-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none" />
          <button onClick={add} className="h-11 px-4 rounded-full bg-primary text-white font-medium hover:bg-primary-dark">추가</button>
        </div>
        <ul className="mt-2">
          {todos.map(item => (
            <li key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <label className="flex-1 flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="md-check" checked={item.done} onChange={() => toggle(item)} />
                <span className={item.done ? "text-gray-400 line-through" : ""}>{item.text}</span>
              </label>
              <button onClick={() => remove(item)} className="w-8 h-8 -my-1 rounded-full hover:bg-gray-100 grid place-items-center text-gray-500" aria-label="할 일 삭제"><Icon name="close" className="!text-[20px]" /></button>
            </li>
          ))}
        </ul>
        {!todos.length && <p className="text-sm text-gray-500 mt-3">아직 할 일이 없습니다.</p>}
        {carryTexts.length > 0 && (
          <button onClick={carry} className="mt-3 h-9 px-3 rounded-full border border-gray-300 text-sm text-primary font-medium hover:bg-primary-light">
            {fmt(unfinished.date)}에 못 끝낸 할 일 {carryTexts.length}개 가져오기
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-e1 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="edit_note" className="text-primary" />
          <h3 className="font-medium">학습 메모</h3>
          <span className="ml-auto text-xs text-gray-500" aria-live="polite">{note}</span>
        </div>
        <div className="space-y-5">
          {FIELDS.map(k => (
            <div key={k}>
              <label htmlFor={"f-" + k} className="block font-medium">{FIELD_LABELS[k]}</label>
              <p className="text-xs text-gray-500">{FIELD_HINTS[k]}</p>
              {k === "verified" && prevQ && (
                <div className="mt-2 p-3 rounded-lg bg-primary-light text-sm text-primary-ink whitespace-pre-wrap">
                  <strong className="block mb-0.5">{fmt(prevQ.date)}에 남긴 질문</strong>{prevQ.questions.trim()}
                </div>
              )}
              <textarea id={"f-" + k} rows={3} value={memo[k]} onChange={e => onMemo(k, e.target.value)}
                className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:outline-none resize-y" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
