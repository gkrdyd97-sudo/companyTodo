import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setMsg("가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.");
      }
    } catch (err) {
      const m = err.message || "";
      setMsg(m.includes("Invalid login") ? "이메일이나 비밀번호가 맞지 않습니다."
        : m.includes("already registered") ? "이미 가입된 이메일입니다. 로그인하세요."
        : m.includes("Password should") ? "비밀번호는 6자 이상이어야 합니다."
        : m.includes("Email not confirmed") ? "가입 확인 메일의 링크를 먼저 눌러 주세요."
        : "로그인하지 못했습니다. " + m);
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center p-5 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl shadow-e2 p-7">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-9 h-9 rounded-lg bg-primary text-white grid place-items-center font-bold">L</span>
          <h1 className="text-lg font-medium">루시드컬러 데일리메모</h1>
        </div>
        <h2 className="text-2xl font-medium mb-1">{mode === "signin" ? "로그인" : "계정 만들기"}</h2>
        <p className="text-sm text-gray-600 mb-6">로그인하면 PC와 휴대폰에서 같은 기록을 볼 수 있습니다.</p>
        <label className="block text-sm font-medium mb-1" htmlFor="email">이메일</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none mb-4" />
        <label className="block text-sm font-medium mb-1" htmlFor="pw">비밀번호</label>
        <input id="pw" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none" />
        {msg && <p className="text-sm text-red-700 mt-3" role="alert">{msg}</p>}
        <button disabled={busy} className="w-full h-12 mt-6 rounded-full bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60">
          {busy ? "잠시만요" : mode === "signin" ? "로그인" : "계정 만들기"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
          className="w-full h-11 mt-2 rounded-full text-primary font-medium hover:bg-primary-light">
          {mode === "signin" ? "처음이신가요? 계정 만들기" : "이미 계정이 있어요. 로그인"}
        </button>
      </form>
    </div>
  );
}
