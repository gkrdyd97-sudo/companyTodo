export default function SetupScreen() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md bg-white rounded-3xl shadow-e2 p-7">
        <h1 className="text-xl font-medium mb-2">Supabase 연결이 필요합니다</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          프로젝트 폴더의 <code className="bg-gray-100 px-1 rounded">.env.example</code>을 복사해
          <code className="bg-gray-100 px-1 rounded">.env</code>로 이름을 바꾸고, Supabase 대시보드의 Project Settings → API에서
          Project URL과 anon public 키를 붙여 넣은 뒤 개발 서버를 다시 시작하세요.
        </p>
      </div>
    </div>
  );
}
