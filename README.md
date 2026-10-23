# 루시드컬러 데일리메모

루시드컬러 입사 후 매일 배운 것, 확인한 것, 본 차이, 여쭤볼 것을 기록하고 다시 보는 앱입니다.
React + Vite로 화면을 만들고, Supabase에 저장해 PC와 휴대폰에서 같은 기록을 봅니다.

## 폴더 구조

```
lucid-memo/
├─ supabase/schema.sql        데이터베이스 표와 보안 규칙 (Supabase에서 한 번 실행)
├─ src/
│  ├─ main.jsx               앱 시작점
│  ├─ App.jsx                로그인 확인, 상단 바, 탭, 화면 전환
│  ├─ supabaseClient.js      Supabase 연결
│  ├─ lib/api.js             저장·불러오기 함수 모음 (데이터 작업은 전부 여기)
│  ├─ lib/date.js            날짜 계산
│  ├─ data/categories.js     배울 것 50개 항목과 메모 칸 이름
│  └─ components/            화면 조각 (캘린더, 하루, 기록, 배울 것, 로그인, 백업)
├─ .env.example              Supabase 주소와 키를 넣는 견본
└─ package.json
```

## 처음 한 번 준비

1. Node.js LTS 버전을 설치합니다. (nodejs.org)
2. supabase.com 에서 무료 계정을 만들고 New project를 만듭니다. 지역은 Northeast Asia (Seoul)을 고르세요.
3. 프로젝트 대시보드 왼쪽 SQL Editor에서 `supabase/schema.sql` 내용을 전부 붙여 넣고 Run을 누릅니다.
4. Project Settings → API에서 Project URL과 anon public 키를 복사합니다.
5. 이 폴더의 `.env.example`을 복사해 `.env`로 이름을 바꾸고 두 값을 붙여 넣습니다.
6. (필수) Authentication → Providers → Email에서 "Confirm email"을 끕니다. 이 앱은 이메일 대신 이름과 비밀번호로 가입하므로, 켜 두면 가입한 사람이 로그인할 수 없습니다.
   가입한 사람의 이름은 Table Editor의 `profiles` 표에서 `user_id`와 함께 볼 수 있습니다.

## 실행

VS Code에서 이 폴더를 열고 터미널(Ctrl + `)에서:

```
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.
같은 와이파이의 휴대폰에서는 터미널에 함께 나오는 Network 주소(예: http://192.168.0.5:5173)로 접속하면 됩니다.

## 배포 (어디서나 쓰기)

```
npm run build
```

생성된 `dist` 폴더를 Netlify나 Vercel에 올립니다. 이때 사이트 설정의 환경 변수에
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 똑같이 넣어야 합니다.
배포 후 Supabase의 Authentication → URL Configuration → Site URL에 배포 주소를 넣으세요.
휴대폰에서 배포 주소를 열고 "홈 화면에 추가"를 하면 앱처럼 쓸 수 있습니다.

## 기존 기록 옮기기

단일 파일 버전(lucidcolour-daily-memo.html)에서 메뉴 → 백업 파일 내려받기를 한 뒤,
이 앱에서 오른쪽 위 계정 아이콘 → 백업 파일 가져오기로 그 파일을 선택하면 됩니다.

## 보안

- `.env`는 `.gitignore`에 들어 있어 깃허브에 올라가지 않습니다.
- anon 키는 브라우저에 노출되어도 되는 공개 키입니다. 대신 schema.sql의 행 단위 보안(RLS)이
  로그인한 본인의 기록만 읽고 쓰게 막아 줍니다. RLS를 끄지 마세요.
- service_role 키는 절대 이 앱에 넣지 마세요.
