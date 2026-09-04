/**
 * 옛 주소(love-8r5.pages.dev) 로 들어온 요청을 새 주소(a.nolcool.com) 로 301 보낸다.
 *
 * 왜 _redirects 가 아니라 Function 인가
 *   두 주소는 같은 Cloudflare Pages 프로젝트다. _redirects 는 **경로만** 보고
 *   호스트를 구분하지 못하므로, 거기에 규칙을 넣으면 a.nolcool.com 도 자기 자신으로
 *   끝없이 되돌게 된다. 호스트를 보고 판단하려면 Function 이어야 한다.
 *
 * 규칙
 *   · 호스트가 *.pages.dev 일 때만 옮긴다. a.nolcool.com 은 그대로 통과시킨다.
 *   · 경로·쿼리는 그대로 유지한다 (/night/x?a=1 → https://a.nolcool.com/night/x?a=1)
 *   · 301(영구 이동) — 네이버·구글에 "주소가 완전히 바뀌었다"고 알린다.
 */
const NEW_HOST = 'a.nolcool.com';

/* [폐기 404 — 시작] state/indexnow-removed.json 에서 도구가 채움. 손으로 고치지 않음 */
const REMOVED_PATHS = new Set(["/bulgwang-1","/policy-1"]);
/* [폐기 404 — 끝] */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (REMOVED_PATHS.has(url.pathname.replace(/\/+$/, '') || '/')) { const nf = await context.env.ASSETS.fetch(new URL('/404.html', url.origin)); return new Response(nf.ok ? nf.body : 'Not Found', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }); } // 폐기 쪽 404(엣지 잔상 차단)

  if (url.hostname.endsWith('.pages.dev')) {
    url.protocol = 'https:';
    url.hostname = NEW_HOST;
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }

  // 새 주소로 들어온 요청은 평소대로 파일을 내보낸다.
  return context.next();
}
