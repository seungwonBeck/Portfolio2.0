# folio 2 — 게임기 속 인터랙티브 포트폴리오

React 18 + Vite + TypeScript + Tailwind v4 + Framer Motion. 기기는 전부 CSS로 그렸습니다(이미지·로고 없음).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드 (dist/)
```

## 폰트 (KBL 점프체)

`public/fonts/KBLJump_R.ttf`(Regular, 굵기 500 이하)와 `KBLJump_B.ttf`(Bold, 600 이상)를 씁니다. https://www.kbl.or.kr/intro/font 에서 받은 파일입니다. 없으면 아래 Paperlogy, 그것도 없으면 시스템 폰트로 대체됩니다. 상업적 사용·웹 임베딩 조건은 다운로드 페이지의 이용 약관을 확인하세요.

## 폰트 (Paperlogy, 대체용)

https://freesentation.blog/paperlogyfont 에서 받아 아래 이름으로 `public/fonts/`에 넣으세요. 없으면 시스템 폰트로 대체됩니다.

`Paperlogy-3Light.woff2` · `4Regular` · `6SemiBold` · `7Bold` · `8ExtraBold` · `9Black`
(ttf만 받았다면 woff2로 변환하거나 `src/styles/globals.css`의 `@font-face`를 ttf로 바꾸세요.)

## 콘텐츠 수정

`src/data/`의 JSON만 고치면 화면 안·대체 뷰·푸터에 모두 반영됩니다.

- `profile.json` — 이름, 직무, 소개, 이메일, SNS 링크, 경력 타임라인
- `projects.json` — 프로젝트 (썸네일은 `public/images/projects/`에 넣고 `"/images/projects/x.webp"` 지정. 비우면 그라디언트)
- `skills.json` — 카테고리별 스킬과 level(1~5)

컬러 토큰은 `src/styles/globals.css`의 `@theme`에서 바꿉니다.

## 조작

| 동작 | 키보드 | 기기 |
|---|---|---|
| 이동 | ← → ↑ ↓ | 방향 버튼 / 왼쪽 스틱 드래그 |
| 선택 (링크는 새 탭) | Enter, Z | A |
| 뒤로 | Esc, X, Backspace | B |
| 홈 | H | HOME |
| 화면 크게 보기 | P | + |
| 화면 다크/라이트 | Y | Y |
| 효과음 ON/OFF (기본 OFF) | M | − (푸터 토글도 가능) |

모든 입력은 `src/hooks/useControls.ts`의 `press()` 하나로 모입니다. 화면 전환 규칙은 `src/store/nav.ts`.

## Supabase (방명록 · 연락 폼)

1. supabase.com에서 프로젝트 생성 → SQL Editor에 `supabase/schema.sql` 실행 (테이블 + RLS)
2. `.env.example`을 `.env`로 복사하고 URL / anon key 입력 (Vercel에는 같은 값을 Environment Variables로 등록)
3. 키가 없으면 폼 자리에 안내 문구만 나오고 나머지는 정상 동작합니다.

연락 폼(`contacts`)은 공개 읽기를 막았습니다(이메일 노출 방지). 받은 문의는 Supabase 대시보드 Table Editor에서 확인하세요.

## 배포 (Vercel)

GitHub에 푸시 → Vercel에서 저장소 Import → Framework Preset `Vite` (빌드 `npm run build`, 출력 `dist`). 자동 배포됩니다.
`index.html`의 OG 이미지는 `public/og.png`(1200×630)를 직접 넣어주세요.

## 3차 (미구현)

커스텀 도메인 연결. (미니게임은 홈의 GAME 타일, 화면 테마는 Y 버튼)
