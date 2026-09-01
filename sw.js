/* sw.js — 오프라인 캐시 + 설치 지원. (파일 바꾸면 아래 v 숫자만 올리세요) */
const CACHE = "ik-order-v1";
const ASSETS = [
  "index.html", "shop.html", "pwa.js",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png",
  "apple-touch-icon.png", "logo.png", "favicon-32.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS.map(function (a) { return new Request(a, { cache: "reload" }); }));
    }).catch(function () {})
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                          // 주문/로그인 등 POST는 그냥 통과
  if (new URL(req.url).origin !== location.origin) return;   // 구글 스크립트(API)는 그냥 통과
  // 최신 우선(network-first), 실패하면 캐시로
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match("index.html"); });
    })
  );
});
