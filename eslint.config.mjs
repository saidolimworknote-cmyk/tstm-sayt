/* ESLint konfiguratsiyasi — TSTM veb-tizimi.
 *
 * Loyihada build/bundler YO'Q: har bir `.js` fayl brauzerga <script src> bilan
 * alohida yuklanadi va o'z IIFE'si ichida ishlaydi, global'lar (Site, Store,
 * I18N, A11Y) esa `window` orqali almashinadi. Shuning uchun:
 *   - sourceType: "script" (module EMAS — import/export ishlatilmaydi);
 *   - loyiha global'lari quyida qo'lda e'lon qilingan.
 *
 * Ishga tushirish:  npx eslint .
 * IDE (PhpStorm/WebStorm/VS Code) shu faylni avtomatik o'qiydi.
 */

// Brauzer muhiti (`globals` paketiga bog'liq bo'lmaslik uchun qo'lda — loyihada
// npm bog'liqliklari yo'q, konfiguratsiya o'zi yetarli bo'lishi kerak).
const browser = {
  window: "readonly", document: "readonly", location: "readonly", navigator: "readonly",
  history: "readonly", console: "readonly", fetch: "readonly", URL: "readonly",
  URLSearchParams: "readonly", FormData: "readonly", FileReader: "readonly", Blob: "readonly",
  setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
  requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
  localStorage: "readonly", sessionStorage: "readonly",
  alert: "readonly", confirm: "readonly", prompt: "readonly",
  Image: "readonly", Event: "readonly", CustomEvent: "readonly", Node: "readonly",
  NodeFilter: "readonly", HTMLElement: "readonly", DOMParser: "readonly",
  IntersectionObserver: "readonly", MutationObserver: "readonly", ResizeObserver: "readonly",
  getComputedStyle: "readonly", matchMedia: "readonly", screen: "readonly",
  speechSynthesis: "readonly", SpeechSynthesisUtterance: "readonly",
  XMLHttpRequest: "readonly", AbortController: "readonly",
  btoa: "readonly", atob: "readonly", crypto: "readonly"
};

// Sayt fayllari orasida `window` orqali bo'lishiladigan global'lar.
const projectGlobals = {
  Site: "readonly",     // site-common.js
  Store: "readonly",    // admin-store.js
  I18N: "readonly",     // i18n.js
  A11Y: "readonly",     // a11y.js
  Search: "readonly",   // search.js
  Diag: "readonly",     // diag.js — diagnostika paneli
  google: "readonly"    // Google Translate vidjeti (tashqi skript, a11y.js ishlatadi)
};

export default [
  {
    files: ["**/*.js"],
    ignores: ["uploads/**", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...browser, ...projectGlobals }
    },
    rules: {
      // --- Haqiqiy xatolarni ushlaydiganlar (error) ---
      "no-undef": "error",
      "no-redeclare": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-cond-assign": "error",
      "no-func-assign": "error",
      "no-irregular-whitespace": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-fallthrough": "error",
      "no-compare-neg-zero": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-constant-binary-expression": "error",

      // --- Tozalik (warn) ---
      "no-unused-vars": ["warn", {
        args: "none",              // hodisa qayta chaqiruvlarida (e, ev) argument ishlatilmasligi normal
        caughtErrors: "all",       // catch(e) da `e` ishlatilmasa — `catch {}` ga o'tkazing
        varsIgnorePattern: "^_"    // ataylab ishlatilmaydigan: `_nom`
      }],
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-sparse-arrays": "off",   // `(m.match(...)||[,'FAYL'])[1]` — ataylab qo'llanilgan idiom

      // MUHIM: bo'sh `catch {}` bu loyihada ATAYLAB ishlatiladi — "xatoga chidamli
      // render" tamoyili (TZ 4.1.2): ma'lumot buzilgan bo'lsa ham sahifa ochiladi.
      // Shuning uchun bo'sh catch ogohlantirish BERMAYDI, boshqa bo'sh bloklar beradi.
      "no-empty": ["warn", { allowEmptyCatch: true }]
    }
  }
];
