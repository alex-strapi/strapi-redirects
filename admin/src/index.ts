import { prefixPluginTranslations } from './utils/prefixPluginTranslations';
import { PLUGIN_ID } from './pluginId';
import AlertRedirectPrompt from './components/AlertRedirectPrompt';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/Icons/PluginIcon';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Redirects',
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    // Inject into Content Manager Edit View
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'alert-redirect-prompt',
      Component: AlertRedirectPrompt,
    });

    app.createSettingSection(
      {
        id: PLUGIN_ID,
        intlLabel: {
          id: `${PLUGIN_ID}.plugin.name`,
          defaultMessage: 'Redirects',
        },
      },
      [
        {
          intlLabel: {
            id: `${PLUGIN_ID}.plugin.name`,
            defaultMessage: 'Redirects',
          },
          id: 'redirects-settings',
          to: `/settings/${PLUGIN_ID}`,
          Component: async () => {
            const { Settings } = await import('./pages/Settings');

            return Settings;
          },
        },
      ]
    );

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};
