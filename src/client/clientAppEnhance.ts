import { defineClientAppEnhance } from '@vuepress/client';
import join from '../utils/join';

import { RedirectPluginOptions, RedirectorStorage, Redirector } from '../interface';

interface ResolvedRedirector extends Redirector {
  base: string;
  storage: false | RedirectorStorage;
}

declare const __RDR_OPTIONS: RedirectPluginOptions;
const options = __RDR_OPTIONS;

const enhanceApp = defineClientAppEnhance(({ router, siteData }) => {
  if (__VUEPRESS_SSR__) return;
  const { routes = [] } = router.options;
  const { redirectors: rawRedirectors = [] } = options;

  // if a path has corresponding route
  function hasRoute(path: string): boolean {
    return routes.some(route => route.path.toLowerCase() === path.toLowerCase());
  }

  // get the route or fallback route of a path
  function getFallbackRoute(path: string): string | null {
    // if has exact route
    if (hasRoute(path)) return path;

    // if has route with /
    if (!/\/$/.test(path)) {
      const endingSlashUrl = path + '/';
      if (hasRoute(endingSlashUrl)) return endingSlashUrl;
    }

    // if has route with .html
    if (!/\.html$/.test(path)) {
      const endingHtmlUrl = path.replace(/\/$/, '') + '.html';
      if (hasRoute(endingHtmlUrl)) return endingHtmlUrl;
    }

    return null;
  }

  // locales redirector
  if (options.locales && siteData.value.locales) {
    // resolve locales config from siteData
    const siteLocales = siteData.value.locales;
    const localeKeys = Object.keys(siteLocales);
    const locales = localeKeys.map(key => ({
      key: key.replace(/^\/|\/$/, ''),
      lang: siteLocales[key].lang,
    }));

    // resolve locales config from plugin options
    if (typeof options.locales !== 'object') {
      options.locales = {};
    }
    const { fallback, storage = true } = options.locales;
    if (fallback) {
      localeKeys.unshift(fallback);
    }

    // add locales redirector
    rawRedirectors.unshift({
      storage,
      base: '/',
      alternative() {
        if (typeof window !== 'undefined' && window.navigator) {
          const langs = window.navigator.languages || [window.navigator.language];

          // use the browser sort order to select a matching locale, the user default should come first
          const localeStrings = locales.map(l => l.lang);
          const locale = langs.find(lang => localeStrings.includes(lang));
          if (locale) {
            return locale;
          }
        }
        return localeKeys;
      },
    });
  }

  // all redirectors
  const redirectors: ResolvedRedirector[] = rawRedirectors.map(
    ({ base = '/', storage: rawStorage = false, alternative }) => {
      let storage: false | RedirectorStorage = false;
      if (rawStorage) {
        if (typeof rawStorage !== 'object') {
          const key = typeof rawStorage !== 'string' ? `vuepress:redirect:${base}` : rawStorage;
          storage = {
            get(): string | null {
              if (typeof localStorage === 'undefined') return null;
              return localStorage.getItem(key);
            },
            set(val): void {
              if (typeof localStorage === 'undefined') return;
              localStorage.setItem(key, val);
            },
          };
        } else if (!!rawStorage.get && !!rawStorage.set) {
          // warning
          storage = rawStorage;
        }
      }
      return {
        base,
        storage,
        alternative,
      };
    },
  );

  router.beforeEach((to, from, next) => {
    // if router exists, skip redirection
    const fallback = getFallbackRoute(to.path);
    if (fallback) return next();

    let target;

    for (const redirector of redirectors) {
      const { base = '/', storage = false } = redirector;
      let { alternative } = redirector;
      if (!to.path.startsWith(base)) continue;

      // get rest of the path
      // ensure ending slash at root
      const rest = to.path.slice(base.length) || '/';

      if (storage) {
        const alt = storage.get(redirector);
        if (alt) {
          const path = getFallbackRoute(join(base, alt, rest));
          if (path) {
            target = path;
            break;
          }
        }
      }

      // resolve alternatives
      if (typeof alternative === 'function') {
        alternative = alternative(rest);
      }
      if (!alternative) continue;
      if (typeof alternative === 'string') {
        alternative = [alternative];
      }

      for (const alt of alternative) {
        const path = getFallbackRoute(join(base, alt, rest));
        if (path) {
          target = path;
          break;
        }
      }

      if (target) break;
    }

    return target ? next(target) : next();
  });

  router.afterEach(to => {
    // if router doesn't exist, skip storage
    if (!hasRoute(to.path)) return;

    for (const redirector of redirectors) {
      const { base, storage } = redirector;
      if (!storage || !to.path.startsWith(base)) continue;
      const alt = to.path.slice(base.length).split('/')[0];
      if (alt) {
        storage.set(alt, redirector);
      }
    }
  });
});

export default enhanceApp;
