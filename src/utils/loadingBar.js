// src/utils/loadingBar.js — thanh tiến trình mảnh ở đầu trang (kiểu NProgress), không cần React.
//
// Vì sao cần: React Router v7 chuyển trang trong startTransition → khi trang mới (chunk JS) còn đang
// tải, giao diện CŨ đứng yên, không hiện spinner → người dùng tưởng bấm không ăn. Thanh này hiện
// NGAY khi bấm: lazyPage() gọi start/done quanh việc tải chunk, axios (api/http.js) gọi quanh mỗi request.
//
//   import loadingBar from "~/utils/loadingBar";
//   loadingBar.start(); … loadingBar.done();       // lồng nhau được (đếm số việc đang chạy)
//   await loadingBar.track(promise);                 // tiện cho 1 promise

let el = null;
let active = 0;
let value = 0;
let trickleTimer = null;
let hideTimer = null;
let showTimer = null;

function ensureEl() {
  if (el || typeof document === "undefined") return el;
  el = document.createElement("div");
  el.setAttribute("role", "progressbar");
  el.setAttribute("aria-label", "Đang tải");
  Object.assign(el.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "3px",
    width: "0%",
    zIndex: "99999",
    background: "linear-gradient(90deg, #2563eb, #38bdf8)",
    boxShadow: "0 0 8px rgba(37, 99, 235, 0.6)",
    opacity: "0",
    transition: "width 200ms ease, opacity 300ms ease",
    pointerEvents: "none",
  });
  document.body.appendChild(el);
  return el;
}

function render() {
  const e = ensureEl();
  if (!e) return;
  e.style.width = `${value}%`;
}

function trickle() {
  // nhanh lúc đầu, chậm dần, không bao giờ tới 100% khi chưa xong
  const step = value < 30 ? 8 : value < 60 ? 4 : value < 85 ? 1.5 : 0.3;
  value = Math.min(94, value + step);
  render();
}

function show() {
  const e = ensureEl();
  if (!e) return;
  clearTimeout(hideTimer);
  if (e.style.opacity !== "1") {
    value = 8;
    e.style.transition = "none";
    render();
    // reflow để lần đổi width sau có hiệu ứng
    void e.offsetWidth;
    e.style.transition = "width 200ms ease, opacity 300ms ease";
    e.style.opacity = "1";
  }
  clearInterval(trickleTimer);
  trickleTimer = setInterval(trickle, 200);
  trickle();
}

function start() {
  active += 1;
  if (active === 1) {
    clearTimeout(showTimer);
    // việc xong trong < 80 ms (cache) thì khỏi nháy thanh
    showTimer = setTimeout(show, 80);
  }
}

function done() {
  if (active === 0) return;
  active -= 1;
  if (active > 0) return;
  clearTimeout(showTimer);
  clearInterval(trickleTimer);
  const e = el;
  if (!e || e.style.opacity !== "1") return;
  value = 100;
  render();
  hideTimer = setTimeout(() => {
    e.style.opacity = "0";
    hideTimer = setTimeout(() => {
      value = 0;
      if (active === 0) render();
    }, 300);
  }, 200);
}

async function track(promise) {
  start();
  try {
    return await promise;
  } finally {
    done();
  }
}

const loadingBar = { start, done, track };
export default loadingBar;
