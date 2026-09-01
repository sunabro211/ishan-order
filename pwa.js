/* ============================================================
   pwa.js — 홈 화면 설치(다운로드) + 사람마다 다른 앱 이름
   index.html / shop.html 둘 다 이 파일 하나만 불러오면 됨.
   ▼ 이름만 바꾸고 싶으면 아래 PWA_CFG 4줄만 고치세요. ▼
   ============================================================ */
const PWA_CFG = {
  storeName: "Imperial Kitchen",          // 고객이 설치하면 이 이름 (shop.html)
  staff: {                                 // 직원 접근키 → 설치될 앱 이름
    "od-boss-7412":  "Ishan",              // 이샨 (사장)
    "od-vice-3856":  "Hansi",              // 한시 (부사장)
    "od-admin-9203": "Suneth"              // 나 (관리자)
  },
  fallback:   "Imperial Kitchen",          // 키가 없을 때 기본 이름
  themeColor: "#16a34a"
};

(function () {
  var dir = location.origin + location.pathname.replace(/[^/]*$/, ""); // 현재 폴더(끝에 /)
  var isShop = /shop\.html$/i.test(location.pathname);
  var key = new URLSearchParams(location.search).get("k") || "";
  var appName = isShop ? PWA_CFG.storeName : (PWA_CFG.staff[key] || PWA_CFG.fallback);
  var startUrl = isShop ? dir + "shop.html" : dir + "index.html" + (key ? "?k=" + key : "");

  /* ── 1) 앱 이름 반영 (탭 제목 + iOS 홈 화면 이름) ── */
  document.title = appName;
  setMeta("apple-mobile-web-app-title", appName);
  setMeta("apple-mobile-web-app-capable", "yes");
  setMeta("mobile-web-app-capable", "yes");
  setMeta("theme-color", PWA_CFG.themeColor);

  /* ── 2) 매니페스트를 코드로 만들어 연결 (사람마다 이름/시작주소 다름) ── */
  var manifest = {
    id: startUrl,
    name: appName,
    short_name: appName,
    start_url: startUrl,
    scope: dir,
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: PWA_CFG.themeColor,
    icons: [
      { src: dir + "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: dir + "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: dir + "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
  var mURL = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));
  var mLink = document.createElement("link");
  mLink.rel = "manifest"; mLink.href = mURL;
  document.head.appendChild(mLink);

  /* ── 3) 서비스워커 등록 (설치 가능 + 오프라인 캐시) ── */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(dir + "sw.js").catch(function () {});
    });
  }

  /* ── 4) 설치 버튼 ── */
  var css = document.createElement("style");
  css.textContent =
    "#pwaInstall{position:fixed;right:14px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:70;" +
    "display:none;align-items:center;gap:7px;border:0;border-radius:24px;padding:11px 16px;" +
    "background:" + PWA_CFG.themeColor + ";color:#fff;font-weight:700;font-size:14px;" +
    "box-shadow:0 6px 18px rgba(0,0,0,.22);cursor:pointer}" +
    "#pwaInstall .ico{font-size:16px;line-height:1}";
  document.head.appendChild(css);

  var btn = document.createElement("button");
  btn.id = "pwaInstall";
  btn.innerHTML = '<span class="ico">⬇</span><span>앱 설치</span>';
  window.addEventListener("DOMContentLoaded", function () { document.body.appendChild(btn); });

  // 이미 설치돼서 앱으로 열린 경우 → 버튼 숨김
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone) return;

  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e; btn.style.display = "flex";
  });
  window.addEventListener("appinstalled", function () { btn.style.display = "none"; deferred = null; });

  btn.addEventListener("click", function () {
    if (deferred) { deferred.prompt(); deferred = null; btn.style.display = "none"; return; }
    // iOS 사파리 등: 자동 설치가 없어 안내만
    hint("설치: 아래 공유 버튼 → “홈 화면에 추가”\nInstall: Share → Add to Home Screen");
  });

  // iOS( iPhone/iPad )는 beforeinstallprompt 가 없으니 버튼을 바로 노출
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) btn.style.display = "flex";

  /* ── 유틸 ── */
  function setMeta(name, content) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", name); document.head.appendChild(m); }
    m.setAttribute("content", content);
  }
  function hint(msg) {
    var t = document.getElementById("toast");
    if (t) { t.textContent = msg; t.classList.add("show"); setTimeout(function(){ t.classList.remove("show"); }, 4200); }
    else alert(msg);
  }
})();
