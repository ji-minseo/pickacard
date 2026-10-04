# pick a card — 무료 타로 v0.1

공개 웹사이트: https://pickacard.spicy-dace-8806.chatgpt.site

Node.js 20+ 기반의 의존성 없는 정적 사이트 생성기와 브라우저 ES modules. 생성형 AI API, API key, 서버 데이터베이스가 필요하지 않습니다.

## 실행

```sh
npm run build
npm start
# http://localhost:4173
npm test
```

`npm install`은 필요하지 않습니다. `PORT=3000 npm start`로 포트를 변경할 수 있습니다. 정적 호스팅에는 `dist/`를 업로드합니다. 주소 변경 시 `SITE_URL=https://your-domain.com npm run build`로 canonical, sitemap, OG URL을 재생성하세요. 디렉터리 index.html 및 404.html을 지원하는 호스트를 사용하세요.

## 구조

- `src/data/cards.mjs`: 메이저 아르카나 22장, 정·역방향 및 8개 맥락의 해석 데이터
- `src/data/readings.mjs`: 8개 스프레드, 소개, FAQ, 포지션별 관점, 관련 타로
- `src/engine.mjs`: 보안 난수 셔플, 해석 조합, YES/NO 방향성, 일일 저장 검증
- `src/app.mjs`: 질문 → 선택 → 뒤집기 → 결과 → 관련 리딩 UI
- `public/style.css`: 반응형 및 접근성 스타일
- `scripts/build.mjs`: 10개 독립 HTML 페이지, robots.txt, sitemap.xml 생성
- `scripts/serve.mjs`: 로컬 정적 서버, 디렉터리 리다이렉트와 404
- `tests/engine.test.mjs`: 해석 데이터, 중복 방지, 편향 제거, 일일 저장, SEO 검증
- `dist/`: 배포용 생성물

## 기능

연애운 5장 / 재회운 5장 / 이별운 5장 / 속마음 4장 / 연락운 3장 / 재회 시기 3장 / YES·NO 1~3장 / 오늘의 카드 1장.

브라우저 `crypto.getRandomValues`와 rejection sampling을 이용한 Fisher–Yates shuffle로 동일 리딩 내 중복을 방지합니다. 정·역방향은 각각 50%입니다. YES/NO는 상징적 방향성일 뿐 실제 확률이 아닙니다. 상반된 긍정·부정 카드가 있으면 중립으로 처리합니다.

질문은 화면 메모리에만 있으며 전송·저장하지 않습니다. 오늘의 카드만 localStorage `pickacard:daily:v1`에 `{date,card:{id,reversed}}`로 저장합니다. 현지 날짜 기준이며 손상되거나 지난 날짜의 값은 사용하지 않습니다. 저장 차단 시 안내를 표시합니다. 리딩 결과는 URL에 담지 않아 질문이 검색에 노출되지 않습니다.

SEO 콘텐츠는 빌드 시 실제 HTML에 들어갑니다. 각 타로의 title/description/H1/소개/스프레드 안내/FAQ가 고유하며 FAQPage JSON-LD를 포함합니다. FAQ 리치 결과나 검색 순위는 보장하지 않습니다.

## 확장

- 78장: 카드 배열에 동일 스키마로 `arcana: 'minor'`, 고유 id, suit 등의 레코드를 추가. UI의 덱 장수 안내도 데이터 길이를 사용합니다.
- 더 정교한 해석: 포지션별 별도 필드/오버라이드를 추가해 `interpret()`에서 선택 가능.
- 영어: `locale`별 cards/readings/UI 문구를 분리하고 빌더에 언어별 경로를 추가. 카드 id는 언어와 무관합니다.
- 광고: `data-ad-placement="before-selection|result-middle|result-bottom"` 슬롯 준비. 현재 숨김이며 광고 스크립트 없음. 활성화 시 고정 공간, 동의 정책, 개인정보 안내를 함께 검토.
- 유료 AI: `readingSnapshot()` DTO만 준비. 상담 UI/결제/서버/API 호출은 구현하지 않았습니다. 추후 키는 서버에서만 관리.

## 남은 개선사항

마이너 아르카나 56장, 카드별 오리지널 일러스트, 카드×위치×방향별 편집 해석 확대, 영어 로케일, 커스텀 도메인과 Search Console 등록, 광고 승인 및 동의 관리, 실제 운영 분석 도구는 다음 버전 범위입니다.
