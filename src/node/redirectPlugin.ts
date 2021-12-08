import type { Plugin } from '@vuepress/core';

/* eslint-disable @typescript-eslint/no-var-requires */
import { path } from '@vuepress/utils';
import { RedirectPluginOptions } from '../interface';
/* eslint-enable @typescript-eslint/no-var-requires */

export const redirectPlugin: Plugin<RedirectPluginOptions> = options => ({
  name: 'vuepress-plugin-redirect',

  // workaround SSR mismatch in 404.html
  //   plugins: ['dehydrate'],

  clientAppEnhanceFiles: path.resolve(__dirname, '../client/clientAppEnhance.js'),
  define: {
    __RDR_OPTIONS: options,
  },
});

export default redirectPlugin;
