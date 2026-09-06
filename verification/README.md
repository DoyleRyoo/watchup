# UI verification

실제 `src/App.tsx`의 `AppRoutes`와 컴포넌트를 로드하는 별도 개발 진입점입니다. 프로덕션 `main.tsx`와 인증 로직은 변경하지 않습니다. `server.mjs`는 `envDir: false`로 `.env`를 읽지 않고 알려진 가짜 설정만 사용합니다. 세션은 `main.tsx`에서만 설정하며, API는 Playwright 요청 가로채기로 계약 형태의 응답을 제공합니다. **실제 API·OAuth·서버 데이터 영속성을 검증한 결과가 아닙니다.**

도구 설치 위치: `/tmp/watchup-ui-tools` (프로젝트 의존성 변경 없음).

```sh
npm install --prefix /tmp/watchup-ui-tools playwright@1.63.0 pngjs@7.0.0 pixelmatch@7.2.0
PLAYWRIGHT_BROWSERS_PATH=/tmp/watchup-ui-tools/browsers /tmp/watchup-ui-tools/node_modules/.bin/playwright install chromium
node verification/server.mjs
# 별도 터미널
node verification/capture.mjs --name=mobile_mainpage_white --out=verification/artifacts/current
node verification/compare.mjs mobile_mainpage_white verification/artifacts/current
```

모바일 기준: 375×812 CSS px, DPR 2. PC 기준: 1275×900 CSS px, DPR 2. 원본과 캡처 픽셀 크기가 다르면 비교 스크립트가 실패하며 임의 확대·축소·잘라내기를 하지 않습니다. 폰트·이미지 로딩 후 캡처하고 JSON에 사용 상태와 요청을 기록합니다. side-by-side는 원본 왼쪽·구현 오른쪽, overlay는 50% 합성, diff는 안티앨리어싱을 제외한 차이 시각화입니다. 수치 일치율은 완료 근거로 사용하지 않습니다.


전체 재현 명령(검증 서버 실행 후):

```sh
node verification/capture-all.mjs
node verification/flows.mjs
node verification/pc-flows.mjs
node verification/responsive-content.mjs
```

최종 결과: [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md), [DESIGN_MAPPING.md](DESIGN_MAPPING.md), [비교 갤러리](artifacts/index.html). Chromium 실행 파일은 검증 당시 설치된 `/tmp/watchup-ui-tools/browsers/chromium-1243/chrome-linux64/chrome`을 사용합니다. 새 환경에서 브라우저 버전이 달라지면 각 스크립트의 executablePath를 설치된 경로로 맞춰야 합니다. 동일한 시각 재현에는 같은 Chromium·DPR·폰트가 필요합니다.
