// Supabase와 주고받는 모든 함수는 여기에 모아 둡니다.
// 화면 코드에서는 이 함수들만 부르면 되고, 저장소를 바꿀 때도 이 파일만 고치면 됩니다.
import { supabase } from "../supabaseClient";
import { FIELDS } from "../data/categories";

const must = ({ data, error }) => { if (error) throw error; return data; };

/* ----- 할 일 ----- */
export async function listTodos(date) {
  return must(await supabase.from("todos").select("*").eq("date", date).order("created_at"));
}
export async function addTodo(date, text) {
  return must(await supabase.from("todos").insert({ date, text }).select().single());
}
export async function addTodos(date, texts) {
  if (!texts.length) return [];
  return must(await supabase.from("todos").insert(texts.map(text => ({ date, text }))).select());
}
export async function setTodoDone(id, done) {
  must(await supabase.from("todos").update({ done }).eq("id", id));
}
export async function deleteTodo(id) {
  must(await supabase.from("todos").delete().eq("id", id));
}
/** 이 날짜 이전에서 못 끝낸 할 일이 남아 있는 가장 가까운 날 */
export async function lastUnfinished(date) {
  const rows = must(await supabase.from("todos").select("date,text").lt("date", date).eq("done", false).order("date", { ascending: false }).limit(50));
  if (!rows.length) return null;
  const d = rows[0].date;
  return { date: d, texts: rows.filter(r => r.date === d).map(r => r.text) };
}

/* ----- 학습 메모 ----- */
export async function getJournal(date) {
  return must(await supabase.from("journals").select("*").eq("date", date).maybeSingle());
}
export async function saveJournal(date, fields) {
  const row = { date, updated_at: new Date().toISOString() };
  FIELDS.forEach(k => { row[k] = fields[k] || ""; });
  must(await supabase.from("journals").upsert(row, { onConflict: "user_id,date" }));
}
/** 이 날짜 이전에 남긴 마지막 질문 */
export async function lastQuestions(date) {
  const rows = must(await supabase.from("journals").select("date,questions").lt("date", date).neq("questions", "").order("date", { ascending: false }).limit(1));
  return rows[0] || null;
}

/* ----- 캘린더, 기록, 통계 ----- */
export async function monthData(start, end) {
  const [todos, journals] = await Promise.all([
    supabase.from("todos").select("date,done").gte("date", start).lte("date", end).then(must),
    supabase.from("journals").select("*").gte("date", start).lte("date", end).then(must)
  ]);
  return { todos, journals };
}
export async function allRecords() {
  const [todos, journals] = await Promise.all([
    supabase.from("todos").select("date,text,done").order("date", { ascending: false }).then(must),
    supabase.from("journals").select("*").order("date", { ascending: false }).then(must)
  ]);
  return { todos, journals };
}

/* ----- 배울 것 ----- */
export async function listChecks() {
  return must(await supabase.from("learn_checks").select("item_id,checked_on"));
}
export async function setCheck(itemId, checkedOn) {
  if (checkedOn) must(await supabase.from("learn_checks").upsert({ item_id: itemId, checked_on: checkedOn }, { onConflict: "user_id,item_id" }));
  else must(await supabase.from("learn_checks").delete().eq("item_id", itemId));
}
export async function listCustom() {
  return must(await supabase.from("custom_items").select("*").order("created_at"));
}
export async function addCustom(text) {
  return must(await supabase.from("custom_items").insert({ text }).select().single());
}
export async function deleteCustom(id) {
  must(await supabase.from("learn_checks").delete().eq("item_id", id));
  must(await supabase.from("custom_items").delete().eq("id", id));
}

/* ----- 백업 내보내기와 가져오기 ----- */
export async function exportAll() {
  const [todos, journals, checks, custom] = await Promise.all([
    supabase.from("todos").select("date,text,done,created_at").then(must),
    supabase.from("journals").select("date,learned,verified,diff,questions,updated_at").then(must),
    supabase.from("learn_checks").select("item_id,checked_on").then(must),
    supabase.from("custom_items").select("id,text,created_at").then(must)
  ]);
  return { app: "lucidcolour-daily-memo", version: 2, exportedAt: new Date().toISOString(), todos, journals, checks, custom };
}

/**
 * 단일 파일 앱(버전 1)과 이 앱(버전 2)의 백업을 모두 받아서 Supabase에 넣습니다.
 * 같은 날짜의 메모는 백업 내용으로 덮어쓰고, 할 일은 추가합니다.
 */
export async function importBackup(json) {
  let todos = [], journals = [], checks = [], custom = [];
  const v1 = json && json.data && (json.data.journal || json.data.todos || json.data.checked);
  if (v1) {
    const d = json.data;
    Object.entries(d.todos || {}).forEach(([date, list]) => (list || []).forEach(t => todos.push({ date, text: t.text, done: !!t.done })));
    Object.entries(d.journal || {}).forEach(([date, j]) => journals.push({ date, ...FIELDS.reduce((o, k) => ({ ...o, [k]: j[k] || "" }), {}) }));
    const idMap = {};
    const customRows = (d.custom || []).filter(c => c && c.text);
    if (customRows.length) {
      const inserted = must(await supabase.from("custom_items").insert(customRows.map(c => ({ text: c.text }))).select());
      customRows.forEach((c, i) => { idMap[c.id] = inserted[i].id; });
    }
    Object.entries(d.checked || {}).forEach(([item, date]) => {
      const id = idMap[item] || (item.startsWith("x") ? null : item);
      if (id) checks.push({ item_id: id, checked_on: date });
    });
  } else if (json && json.version === 2) {
    todos = (json.todos || []).map(({ date, text, done }) => ({ date, text, done }));
    journals = (json.journals || []).map(({ date, learned, verified, diff, questions }) => ({ date, learned, verified, diff, questions }));
    const idMap = {};
    if ((json.custom || []).length) {
      const inserted = must(await supabase.from("custom_items").insert(json.custom.map(c => ({ text: c.text }))).select());
      json.custom.forEach((c, i) => { idMap[c.id] = inserted[i].id; });
    }
    checks = (json.checks || []).map(c => ({ item_id: idMap[c.item_id] || c.item_id, checked_on: c.checked_on }));
  } else {
    throw new Error("데일리메모 백업 파일이 아닙니다.");
  }
  todos = todos.filter(t => t.text && t.text.trim());
  if (todos.length) must(await supabase.from("todos").insert(todos));
  if (journals.length) must(await supabase.from("journals").upsert(journals, { onConflict: "user_id,date" }));
  if (checks.length) must(await supabase.from("learn_checks").upsert(checks, { onConflict: "user_id,item_id" }));
  return { todos: todos.length, journals: journals.length, checks: checks.length };
}
