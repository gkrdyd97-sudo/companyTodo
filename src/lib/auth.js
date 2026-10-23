// 로그인과 가입에 관한 Supabase 작업은 여기에 모아 둡니다.
// 화면 코드에서는 이 함수들만 부르면 되고, 로그인 방식을 바꿀 때도 이 파일만 고치면 됩니다.
import { supabase } from "../supabaseClient";

/**
 * Supabase 로그인은 이메일이 필요해서, 이름을 16진수로 바꾼 가짜 이메일을 아이디로 씁니다.
 * 같은 이름은 항상 같은 아이디가 되므로 이름이 겹치면 가입할 수 없습니다.
 */
const ID_DOMAIN = "lucid-memo.vercel.app";
function nameToEmail(name) {
  const bytes = new TextEncoder().encode(name.trim().normalize("NFC").toLowerCase());
  if (bytes.length > 32) throw new Error("NAME_TOO_LONG");
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("") + "@" + ID_DOMAIN;
}

export async function signIn(name, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: nameToEmail(name), password });
  if (error) throw error;
}
/** 가입하고 바로 로그인되었으면 true, 메일 확인 설정 때문에 로그인되지 않았으면 false */
export async function signUp(name, password) {
  const { data, error } = await supabase.auth.signUp({ email: nameToEmail(name), password, options: { data: { name: name.trim() } } });
  if (error) throw error;
  return Boolean(data.session);
}
export async function signOut() {
  await supabase.auth.signOut();
}

/** 로그인 상태가 바뀔 때마다 callback(session)을 부릅니다. 돌려받은 함수를 부르면 멈춥니다. */
export function watchSession(callback) {
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data } = supabase.auth.onAuthStateChange((_e, s) => callback(s));
  return () => data.subscription.unsubscribe();
}
export const displayName = user => user.user_metadata?.name || user.email;
