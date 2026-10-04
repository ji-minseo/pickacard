# Pick a Card — 무료 타로 v0.2

https://pickacard.jijiminseo.chatgpt.site

기존 v0.1을 유지·확장한 의존성 없는 정적 사이트. 무료 리딩은 사전 작성한 데이터와 브라우저 로직으로 작동합니다. API key나 생성형 AI 런타임이 없습니다.

## 실행

Node.js 20 이상. npm install 불필요.

```sh
npm run build
npm test
npm start
```

기본 포트 4173. 정적 배포 디렉터리는 `dist/`. `SITE_URL=https://example.com npm run build`로 canonical/OG/sitemap 변경. 호스트는 디렉터리 index.html과 404.html 지원 필요.

## 구성

- `src/data/cards.mjs`: 기존 ID를 유지한 메이저 22장과 전체 78장 export
- `src/data/minor.mjs`: 완드·컵·소드·펜타클 각 14장. 카드별 정·역방향, 키워드, 조언, 수트, rank, 의미 태그
- `src/data/topic-context.mjs`: 주제별 맥락 문장
- `src/data/narratives.mjs`: 리딩별 포지션 관점, 의미 태그 어휘
- `src/data/readings.mjs`: 기존 8개 스프레드·고유 소개·FAQ·관련 리딩
- `src/data/guides.mjs`: 편집한 가이드 7편
- `src/engine.mjs`: 편향 없는 셔플, 해석, 포지션·태그 기반 전체 흐름, YES/NO, 일일 저장
- `src/card-view.mjs`: 일관된 프레임·이름·순위·아트워크 매핑
- `src/app.mjs`: 질문 → 직접 선택 → 뒤집기 → 보고서 → 관련 리딩
- `public/artwork/`: 5장 원본 일러스트의 WebP 최적화본. 나머지 73장은 공통 그래픽 체계
- `scripts/build.mjs`: 20개 정적 HTML 페이지와 sitemap/robots/404 생성
- `tests/engine.test.mjs`: 덱·해석·무중복·보관·SEO·내부링크·이미지 검증
- `ARTWORK.md`: 생성 도구/프롬프트/시안 평가와 확장 보류 근거

## 리딩과 개인정보

8종 리딩과 모든 기존 `/tarot/*/` URL을 유지합니다. `crypto.getRandomValues` rejection sampling과 Fisher–Yates로 78장을 동일한 기회로 섞고 방향을 독립 추첨합니다. 질문을 서버에 전송하거나 저장하지 않습니다. 입력한 질문을 의미 분석하지 않고 선택한 리딩 종류·카드·방향·위치로 해석합니다.

오늘의 카드만 기존 `pickacard:daily:v1` 키에 저장합니다. 기존 메이저 카드 기록도 계속 유효합니다. 기기의 현지 날짜 기준. 저장 불가/손상/자정 전환 처리 유지.

종합 리딩은 의미 태그 배열, 주요 장애물 위치, 처음과 마지막 위치를 사용합니다. YES/NO는 별도 방향성 요약입니다. 확률이나 확정된 미래가 아닙니다. 카드마다 모든 위치의 문장을 독립 작성한 방식이 아니라 편집된 층을 조합하는 규칙 엔진입니다.

## SEO와 확장

기존 8개 리딩 + `/guide/`와 7개 글 + `/faq/`, `/about/`, `/privacy/`. 고유 title/description/H1/canonical, 서버 없이 읽을 수 있는 소개/FAQ, FAQPage, sitemap/robots. FAQ 검색 특수 노출이나 검색 순위는 보장하지 않습니다.

광고 슬롯 3곳은 비활성·숨김. 켤 때 광고 크기를 예약하여 CLS 방지 필요. 유료 AI는 구현하지 않았고 `readingSnapshot()`에 readingType/question/selectedCards/positions/interpretations/summary 구조만 준비했습니다. 영어는 언어와 독립된 ID 및 locale 필드를 기반으로 추후 UI·콘텐츠 번들을 분리해야 합니다.

## 실제 남은 범위

73장 추가 일러스트 및 5장 시안의 작은 크기 디테일 정리, 더 많은 카드별 포지션 문장과 종합 패턴 편집, 실제 모바일 기기/스크린리더 QA, 도메인·검색콘솔·광고·분석 도구 연결. 사이트는 78장 전체 일러스트 완성을 주장하지 않습니다.
