export interface RedirectorStorage {
  get(redirector: Redirector): string | null;
  set(value: string, redirector: Redirector): void;
}

export interface Redirector {
  base?: string;
  storage?: boolean | string | RedirectorStorage;
  alternative?: string | string[] | ((rel: string) => string | string[]);
}

export interface LocalesRedirector {
  fallback?: string;
  storage?: boolean | string | RedirectorStorage;
}

export interface RedirectPluginOptions {
  locales?: true | LocalesRedirector;
  redirectors?: Redirector[];
}
