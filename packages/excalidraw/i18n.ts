import { isDevEnv } from "@excalidraw/common";

import type { NestedKeyOf } from "@excalidraw/common/utility-types";

import { useAtomValue, editorJotaiStore, atom } from "./editor-jotai";
import fallbackLangData from "./locales/en.json";
import percentages from "./locales/percentages.json";

const COMPLETION_THRESHOLD = 85;

export interface Language {
  code: string;
  label: string;
  rtl?: boolean;
}

export type TranslationKeys = NestedKeyOf<typeof fallbackLangData>;

export const defaultLang = { code: "en", label: "English" };

// Verlo only ships the English canvas UI translation (apps/web never calls
// setLanguage or exposes a langCode prop) — the other ~49 upstream locale
// JSON files were removed from ./locales to keep this package's bundle
// under Cloudflare Workers' 25MB per-function limit (esbuild/webpack bundle
// every file matched by the templated `import(\`./locales/${code}.json\`)`
// below regardless of which is actually used, since edge runtimes can't
// lazy-fetch extra chunks the way a browser can). Restore entries here only
// alongside restoring their matching locales/<code>.json file.
export const languages: Language[] = [defaultLang];

const TEST_LANG_CODE = "__test__";
if (isDevEnv()) {
  languages.unshift(
    { code: TEST_LANG_CODE, label: "test language" },
    {
      code: `${TEST_LANG_CODE}.rtl`,
      label: "\u{202a}test language (rtl)\u{202c}",
      rtl: true,
    },
  );
}

let currentLang: Language = defaultLang;
let currentLangData = {};

export const setLanguage = async (lang: Language) => {
  currentLang = lang;
  document.documentElement.dir = currentLang.rtl ? "rtl" : "ltr";
  document.documentElement.lang = currentLang.code;

  if (lang.code.startsWith(TEST_LANG_CODE)) {
    currentLangData = {};
  } else {
    try {
      currentLangData = await import(`./locales/${currentLang.code}.json`);
    } catch (error: any) {
      console.error(`Failed to load language ${lang.code}:`, error.message);
      currentLangData = fallbackLangData;
    }
  }

  editorJotaiStore.set(editorLangCodeAtom, lang.code);
};

export const getLanguage = () => currentLang;

const findPartsForData = (data: any, parts: string[]) => {
  for (let index = 0; index < parts.length; ++index) {
    const part = parts[index];
    if (data[part] === undefined) {
      return undefined;
    }
    data = data[part];
  }
  if (typeof data !== "string") {
    return undefined;
  }
  return data;
};

export const t = (
  path: NestedKeyOf<typeof fallbackLangData>,
  replacement?: { [key: string]: string | number } | null,
  fallback?: string,
) => {
  if (currentLang.code.startsWith(TEST_LANG_CODE)) {
    const name = replacement
      ? `${path}(${JSON.stringify(replacement).slice(1, -1)})`
      : path;
    return `\u{202a}[[${name}]]\u{202c}`;
  }

  const parts = path.split(".");
  let translation =
    findPartsForData(currentLangData, parts) ||
    findPartsForData(fallbackLangData, parts) ||
    fallback;
  if (translation === undefined) {
    const errorMessage = `Can't find translation for ${path}`;
    // in production, don't blow up the app on a missing translation key
    if (import.meta.env.PROD) {
      console.warn(errorMessage);
      return "";
    }
    throw new Error(errorMessage);
  }

  if (replacement) {
    for (const key in replacement) {
      translation = translation.replace(`{{${key}}}`, String(replacement[key]));
    }
  }
  return translation;
};

/** @private atom used solely to rerender components using `useI18n` hook */
const editorLangCodeAtom = atom(defaultLang.code);

// Should be used in components that fall under these cases:
// - component is rendered as an <Excalidraw> child
// - component is rendered internally by <Excalidraw>, but the component
//   is memoized w/o being updated on `langCode`, `AppState`, or `UIAppState`
export const useI18n = () => {
  const langCode = useAtomValue(editorLangCodeAtom);
  return { t, langCode };
};
