import { renderElement } from './render';
import Playroom from './Playroom/Playroom';
import { StoreProvider } from './StoreContext/StoreContext';
import playroomConfig from './config';

const polyfillIntersectionObserver = () =>
  typeof window.IntersectionObserver !== 'undefined'
    ? Promise.resolve()
    : import('intersection-observer');

polyfillIntersectionObserver().then(() => {
  const widths = playroomConfig.widths || [320, 375, 768, 1024];
  const defaultWidths = playroomConfig.defaultWidths;

  const outlet = document.createElement('div');
  document.body.appendChild(outlet);

  const renderPlayroom = ({
    themes = require('./themes'),
    components = require('./components'),
    snippets = require('./snippets'),
  } = {}) => {
    const themeNames = Object.keys(themes);

    // Exclude undefined components, e.g. an exported TypeScript type.
    const filteredComponents = Object.fromEntries(
      Object.entries(components).filter(([_, value]) => value)
    );

    renderElement(
      <StoreProvider themes={themeNames} widths={widths}>
        <Playroom
          components={filteredComponents}
          widths={widths}
          defaultWidths={defaultWidths}
          themes={themeNames}
          snippets={
            typeof snippets.default !== 'undefined'
              ? snippets.default
              : snippets
          }
        />
      </StoreProvider>,
      outlet
    );
  };
  renderPlayroom();

  if (module.hot) {
    module.hot.accept('./components', () => {
      renderPlayroom({ components: require('./components') });
    });

    module.hot.accept('./themes', () => {
      renderPlayroom({ themes: require('./themes') });
    });

    module.hot.accept('./snippets', () => {
      renderPlayroom({ snippets: require('./snippets') });
    });
  }
});
