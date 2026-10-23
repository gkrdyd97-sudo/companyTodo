import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { supabase } from "../supabaseClient";
import { exportAll, importBackup } from "../lib/api";
import { today } from "../lib/date";

export default function BackupDialog({ email, onClose, onImported, toast }) {
  const [busy, setBusy] = useState(false);
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function doExport() {
    setBusy(true);
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `데일리메모_백업_${today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("백업 파일을 내려받았습니다"); onClose();
    } catch { toast("백업하지 못했습니다."); } finally { setBusy(false); }
  }
  async function doImport(e) {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const json = JSON.parse(await f.text());
      if (!confirm("백업의 메모와 체크를 내 계정에 합칩니다. 같은 날짜의 메모는 백업 내용으로 바뀌고, 할 일은 추가됩니다. 계속할까요?")) return;
      const r = await importBackup(json);
      toast(`가져왔습니다: 메모 ${r.journals}일, 할 일 ${r.todos}개, 체크 ${r.checks}개`);
      onImported(); onClose();
    } catch (err) { toast(err.message?.includes("백업") ? err.message : "가져오지 못했습니다. 데일리메모 백업 파일인지 확인하세요."); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="dlgTitle"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-e2 p-6">
        <h2 id="dlgTitle" className="text-xl font-medium mb-1">계정과 백업</h2>
        <p className="text-sm text-gray-600 mb-5">{email}로 로그인되어 있습니다. 기록은 Supabase에 자동 저장되어 어느 기기에서든 이어집니다.</p>
        <div className="space-y-2">
          <button ref={first} disabled={busy} onClick={doExport} className="w-full h-11 rounded-full bg-primary text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"><Icon name="download" />백업 파일 내려받기</button>
          <label className="w-full h-11 rounded-full border border-gray-300 text-primary font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-light">
            <Icon name="upload" />백업 파일 가져오기
            <input type="file" accept="application/json,.json" className="sr-only" onChange={doImport} disabled={busy} />
          </label>
          <button onClick={() => supabase.auth.signOut()} className="w-full h-11 rounded-full text-gray-700 font-medium hover:bg-gray-100 flex items-center justify-center gap-2"><Icon name="logout" />로그아웃</button>
        </div>
        <p className="text-xs text-gray-500 mt-4">단일 파일 버전(데일리메모 HTML)에서 내려받은 백업도 가져올 수 있습니다.</p>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="h-10 px-4 rounded-full text-primary font-medium hover:bg-primary-light">닫기</button>
        </div>
      </div>
    </div>
  );
}
