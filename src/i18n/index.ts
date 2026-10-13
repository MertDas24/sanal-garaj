import { EN, EN_PATTERNS } from './en';

// Arayüz dili. Türkçe varsayılandır ve kaynak metinler Türkçedir.
// İngilizce seçilince ekrandaki metinler ve erişilebilirlik öznitelikleri sözlükten (tam eşleşme) veya
// kalıplardan (sayı içeren metinler) çevrilir. Araç/marka adları, model yazarları ve kullanıcı içeriği
// translate="no" ile işaretlenir ve çevrilmez. Karşılığı bulunmayan metinler missingTranslations()
// kümesine yazılır; uçtan uca test bu kümenin boş kalmasını denetler.

export type Lang = 'tr' | 'en';
const KEY = 'sanal-garaj:dil';
const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
/** Dile bağlı olmayan metin: sayı, birim, simge, renk kodu, adres. */
const NEUTRAL = /^(?:[\d\s.,:;%°+\-–—/·()×#←→↓↑↺↻¾“”"'’|<>=*&]*|#[0-9a-f]{3,8}|https?:\/\/\S+|[\d.,]+\s?(?:px|mm|m|KB|MB|MiB|ms|s|°)|Ctrl\/Cmd \+ [\w +]+)$/i;

let lang: Lang = 'tr';
const missing = new Set<string>();
/** Üretilen İngilizce metinler: gözlemci kendi yazdığını yeniden çevirmeye çalışmasın. */
const produced = new Set<string>(Object.values(EN));

export function currentLang(): Lang { return lang; }
export function missingTranslations(): string[] { return [...missing]; }

function readStoredLang(): Lang {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'tr'; } catch { return 'tr'; }
}

export function setLang(next: Lang) {
  try { localStorage.setItem(KEY, next); } catch { /* gizli mod: yalnızca bu oturum */ }
  window.location.reload();
}

/** Tek bir metni çevirir (Türkçe modda olduğu gibi döner). Kanvas yazıları ve diyaloglar için de kullanılır. */
export function tr(text: string): string {
  if (lang === 'tr') return text;
  const key = text.trim();
  if (!key || produced.has(key)) return text;
  let out: string | undefined = EN[key];
  if (out === undefined) {
    for (const [pattern, replacement] of EN_PATTERNS) {
      const m = key.match(pattern);
      if (!m) continue;
      out = typeof replacement === 'string' ? key.replace(pattern, replacement) : replacement(...m);
      if (out !== undefined) break;
    }
  }
  if (out === undefined) {
    if (!NEUTRAL.test(key)) missing.add(key);
    return text;
  }
  produced.add(out);
  // Baştaki/sondaki boşluk korunur (JSX metin parçaları arasındaki boşluklar)
  return text.slice(0, text.indexOf(key)) + out + text.slice(text.indexOf(key) + key.length);
}

const skipped = (el: Element | null) => !el || !!el.closest('[translate="no"], script, style, textarea');

function translateTextNode(node: Text) {
  if (skipped(node.parentElement)) return;
  const next = tr(node.data);
  if (next !== node.data) node.data = next;
}

function translateAttributes(el: Element) {
  if (skipped(el)) return;
  for (const name of ATTRS) {
    const value = el.getAttribute(name);
    if (value) { const next = tr(value); if (next !== value) el.setAttribute(name, next); }
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skipped(el)) return;
  translateAttributes(el);
  for (const child of el.querySelectorAll('[aria-label], [title], [placeholder], [alt]')) translateAttributes(child);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translateTextNode(walker.currentNode as Text);
}

/** main.tsx içinde, React ilk kez çizmeden önce çağrılır. */
export function startTranslation() {
  lang = readStoredLang();
  if (typeof window !== 'undefined') (window as unknown as { __sanalGarajI18n?: unknown }).__sanalGarajI18n = { missing: missingTranslations, lang: currentLang };
  if (lang === 'tr') return;
  document.documentElement.lang = 'en';
  document.title = tr(document.title);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', 'Sanal Garaj: pick a car, explore it in real-time 3D, change its paint and wheels, save and share your design.');
  // Mikro görev olarak çalışır: React'in yazdığı metin ekrana çizilmeden önce çevrilir.
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateTextNode(record.target as Text);
      else if (record.type === 'attributes') translateAttributes(record.target as Element);
      else record.addedNodes.forEach(translateTree);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  translateTree(document.body);
}
