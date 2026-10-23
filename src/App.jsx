import { useEffect, useRef, useState } from "react";
import { isConfigured } from "./supabaseClient";
import { watchSession, displayName } from "./lib/auth";
import Icon from "./components/Icon";
import SetupScreen from "./components/SetupScreen";
import AuthScreen from "./components/AuthScreen";
import CalendarView from "./components/CalendarView";
import DayView from "./components/DayView";
import RecordsView from "./components/RecordsView";
import LearnView from "./components/LearnView";
import BackupDialog from "./components/BackupDialog";

const TABS = [
  { id: "calendar", label: "캘린더", icon: "calendar_month" },
  { id: "records", label: "기록 모아보기", short: "기록", icon: "menu_book" },
  { id: "learn", label: "배울 것", icon: "school" }
];

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!isConfigured) return;
    return watchSession(setSession);
  }, []);

  if (!isConfigured) return <SetupScreen />;
  if (session === undefined) return <div className="min-h-screen grid place-items-center text-gray-500">불러오는 중</div>;
  if (!session) return <AuthScreen />;
  return <Main name={displayName(session.user)} />;
}

function Main({ name }) {
  const now = new Date();
  const [tab, setTab] = useState("calendar");
  const [day, setDay] = useState(null);
  const [viewMonth, setViewMonth] = useState([now.getFullYear(), now.getMonth()]);
  const [dialog, setDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snack, setSnack] = useState("");
  const snackTimer = useRef(null);

  const toast = msg => { setSnack(msg); clearTimeout(snackTimer.current); snackTimer.current = setTimeout(() => setSnack(""), 2800); };
  const openDay = d => { setDay(d); window.scrollTo(0, 0); };
  const closeDay = () => {
    if (tab === "calendar") { const d = new Date(day + "T00:00:00"); setViewMonth([d.getFullYear(), d.getMonth()]); }
    setDay(null); setRefreshKey(k => k + 1);
  };
  const goTab = id => { setDay(null); setTab(id); setRefreshKey(k => k + 1); window.scrollTo(0, 0); };

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-white shadow-e1">
        <div className="max-w-4xl mx-auto h-16 px-4 flex items-center gap-2">
          {day && <button onClick={closeDay} className="w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="뒤로"><Icon name="arrow_back" /></button>}
          <span className="w-8 h-8 rounded-lg bg-primary text-white grid place-items-center text-sm font-bold flex-none">L</span>
          <h1 className="text-lg font-medium truncate">루시드컬러 데일리메모</h1>
          <nav className="hidden md:flex ml-auto h-full" aria-label="주요 메뉴">
            {TABS.map(t => (
              <button key={t.id} onClick={() => goTab(t.id)} aria-current={!day && tab === t.id ? "page" : undefined}
                className={`px-4 h-full text-sm font-medium border-b-2 ${!day && tab === t.id ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary"}`}>{t.label}</button>
            ))}
          </nav>
          <button onClick={() => setDialog(true)} className="ml-auto md:ml-2 w-10 h-10 rounded-full hover:bg-gray-100 grid place-items-center" aria-label="계정과 백업"><Icon name="account_circle" /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5 pb-28 md:pb-12">
        {day ? <DayView date={day} onChangeDate={openDay} toast={toast} />
          : tab === "calendar" ? <CalendarView key={refreshKey} viewMonth={viewMonth} setViewMonth={setViewMonth} onOpenDay={openDay} toast={toast} />
          : tab === "records" ? <RecordsView key={refreshKey} onOpenDay={openDay} toast={toast} />
          : <LearnView key={refreshKey} toast={toast} />}
      </main>

      <nav className="safe-bottom md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200" aria-label="주요 메뉴">
        <div className="grid grid-cols-3 h-16">
          {TABS.map(t => {
            const on = !day && tab === t.id;
            return (
              <button key={t.id} onClick={() => goTab(t.id)} aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 text-xs ${on ? "text-primary-ink font-medium" : "text-gray-600"}`}>
                <span className={`px-5 py-1 rounded-full ${on ? "bg-primary-light" : ""}`}><Icon name={t.icon} fill={on} /></span>{t.short || t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {dialog && <BackupDialog name={name} onClose={() => setDialog(false)} onImported={() => setRefreshKey(k => k + 1)} toast={toast} />}

      <div role="status" aria-live="polite"
        className={`fixed left-1/2 bottom-24 md:bottom-8 z-50 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-e2 transition-all ${snack ? "opacity-100" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        {snack}
      </div>
    </>
  );
}
