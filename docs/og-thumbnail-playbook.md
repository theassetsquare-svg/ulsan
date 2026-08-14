# 랜딩 사이트 1:1 검색 썸네일(OG 이미지) 작업 플레이북

네이버/구글 검색 썸네일용 1200x1200 이미지를 만들 때마다 꺼내 쓰는 체크리스트.
ulsand.pages.dev 작업(2026-08-01) 기준으로 실제 검증된 절차만 남긴다.

## 1. SEO 안전 규칙 (가장 중요)

- **다른 랜딩의 PNG를 복사해 오지 않는다.** 바이트가 같으면 검색엔진이 중복으로
  걸러서 한쪽이 이미지 노출을 못 받는다. 반드시 새로 렌더링한다.
- **이미지 하단 도메인 표기는 반드시 그 사이트 자기 도메인.** 다른 도메인이 박히면
  남의 사이트를 광고하는 꼴이 된다.
- **배경색 / 포인트컬러 / 레이아웃 배치를 다른 랜딩과 눈에 띄게 다르게.**
  색만 바꾸는 건 부족하다. 요소 위치(정렬 축, 장식 도형 위치)까지 바꾼다.
- **페이지 수만큼 전부 고유 이미지.** 하단 라벨 문구를 페이지마다 다르게 해서
  같은 이미지 돌려쓰기를 없앤다.
- **og:image:alt 문구도 다른 랜딩과 다르게.**
- 썸네일만 다르게 해도 본문·제목·메타가 비슷하면 중복 페널티는 그대로다.
  랜딩 간 제목/메타/본문이 전부 다른지 같이 점검할 것.

## 2. 이미지 규격

| 항목 | 값 |
|---|---|
| 크기 | 정확히 1200x1200 (1:1). 다른 비율 금지 |
| 닉네임 | 260~300px, 화면에서 가장 큰 요소, 고대비 색 |
| 전화번호 | 110~130px, **반드시 배경 도형(알약/박스) 위에 흰 글씨** |
| 보조 정보 | 업소명, 역할(예: 예약 담당 실장), 페이지별 라벨, 도메인 |
| 이모지 | **절대 금지** — 서버에 이모지 폰트가 없어 두부(□)로 렌더링됨 |

전화번호를 어두운 배경 위에 색 글씨로만 쓰면 축소했을 때 뭉개진다. 알약 도형이 핵심.

## 3. 한글 폰트 — 이거 안 하면 한글이 전부 두부(□)

이 환경에는 시스템 한글 폰트가 없고 fontconfig에도 등록돼 있지 않다. `fc-list`,
`fc-match` 명령 자체가 없다.

해결: 스크립트가 실행 시점에 임시 `fonts.conf`를 만들고 `FONTCONFIG_FILE`
환경변수로 등록한다. **`require('sharp')` 보다 반드시 먼저** 설정해야 한다
(librsvg가 로드 시점에 fontconfig를 초기화하기 때문).

```js
process.env.FONTCONFIG_FILE = confPath;   // 먼저
const sharp = require('sharp');           // 그 다음
```

`fonts.conf` 최소 형태:

```xml
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>/폰트가/있는/디렉터리</dir>
  <cachedir>/쓰기가능한/캐시경로</cachedir>
  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="assign" binding="same"><string>Noto Sans KR</string></edit>
  </match>
</fontconfig>
```

폰트 실물: `scripts/NotoSansKR-Black.ttf` (약 2.4MB). **git에 커밋돼 있고
`.gitignore`에 걸리지 않는다.** 없어졌다면 Noto Sans KR Black TTF를 같은 경로에
다시 받아 두면 된다.

## 4. 렌더러 선택

- **sharp의 SVG 변환(librsvg)을 쓴다.** 검증됨.
- `node-canvas`는 `libuuid.so.1`이 없어 이 환경에서 로드 자체가 실패한다.
- Python `PIL`은 설치돼 있지 않다.

## 5. 코드에 반영할 것

페이지 전환 시 **아래 5개가 전부 같이** 바뀌어야 한다. 하나라도 빠지면
그 크롤러는 옛 이미지를 계속 쓴다.

1. `og:image`
2. `og:image:secure_url`
3. `twitter:image`
4. `<meta name="thumbnail">` ← **네이버용. 빠뜨리기 쉬움**
5. `<link rel="image_src">`

추가로:

- `og:image:width=1200`, `og:image:height=1200`, `og:image:type=image/png` 선언
- JSON-LD 스키마 `image` 배열에 새 이미지 등록 후 **`JSON.parse`로 파싱 검증**
  - 사업장 노드(NightClub/LocalBusiness/Organization): 전체 목록, 자기 페이지 것 먼저
  - 문서 노드(Article 등): 자기 페이지 것만
- `canonical`과 `og:url`이 자기 도메인인지 확인. 다른 랜딩 도메인 잔재 전부 교체
- 사이트 전역 파일도 같이 갱신: `sitemap.xml`(`image:loc`), `rss.xml`,
  `sw.js`(precache + 캐시 버전 bump), `_headers`(preload), 헬스체크 워크플로
- 스키마 생성 스크립트(`inject-schema.js` 등)도 같이 고쳐야 한다.
  안 고치면 다음 실행 때 전부 옛 이미지로 되돌아간다.

### 본문 CTA 링크는 건드리지 말 것

본문에 있는 메인 사이트 아웃바운드 링크(예: `ilsanroom.pages.dev`)는 의도된
80/20 규칙용 링크다. 도메인 잔재 점검은 `<head>`와 JSON-LD 범위로 한정한다.

## 6. 검증 — 추측하지 말고 실제로 확인

1. 생성된 이미지 전부 sharp로 width/height 읽어 **1200x1200 확인**
2. 전부 **md5가 서로 다른지** 확인 (기존 이미지와도 겹치지 않는지)
3. 로컬 서버 + 헤드리스 브라우저로 각 페이지의 **5개 태그가 실제로 바뀌는지** 확인
   - 이 환경엔 puppeteer/playwright가 없지만 `chromium` 바이너리는 있다:
     `chromium --headless --disable-gpu --no-sandbox --virtual-time-budget=3000 --dump-dom URL`
4. **축소 판독 테스트**: 150 / 200 / 300px로 줄여서 닉네임과 전화번호가 실제로
   읽히는지 눈으로 확인. 안 읽히면 폰트 크기와 대비를 키워 재생성
5. 커밋/푸시 후 **배포 반영될 때까지 폴링**하고, 라이브 URL 이미지 바이트가
   로컬과 md5 일치하는지 확인. **반영 전에 "완료"라고 하지 않는다**
   - 정적 SPA면 `/index.html` 직접 요청이 리다이렉트에 걸려 빈 응답이 올 수 있으니
     확인은 `/` 로 한다
   - 캐시 우회: `?cb=$RANDOM` 붙여서 curl

## 7. 배포

GitHub push → Cloudflare Pages 자동 빌드 → 약 60초 후 반영.
푸시 인증은 device flow가 필요하다(비대화형 셸 제약). `.github/workflows/*.yml`을
건드렸다면 scope는 `repo,workflow`.

## 8. 마무리 보고 항목

- 만든 이미지 목록과 각 페이지 매핑
- 다른 랜딩과 어떻게 다르게 만들었는지 (색 / 배치 / 문구)
- 라이브 검증 결과
- 네이버 서치어드바이저 수집 요청 URL 목록

## 9. 이 저장소의 실행 명령

```bash
node scripts/generate-og-thumbs.js   # 이미지 9장 생성
node scripts/apply-og-thumbs.js      # 메타 태그 + JSON-LD 연결
```
