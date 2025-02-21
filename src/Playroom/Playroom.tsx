import { useContext, type ComponentType, Fragment } from 'react';
import classnames from 'classnames';
// @ts-expect-error no types
import { useDebouncedCallback } from 'use-debounce';
import { Resizable } from 're-resizable';
import Frames from './Frames/Frames';
import { WindowPortal } from './WindowPortal';
import type { Snippets } from '../../utils';
import componentsToHints from '../utils/componentsToHints';
import Toolbar, { toolbarItemCount } from './Toolbar/Toolbar';
import ChevronIcon from './icons/ChevronIcon';
import { StatusMessage } from './StatusMessage/StatusMessage';
import {
  StoreContext,
  type EditorPosition,
} from '../StoreContext/StoreContext';

const MIN_HEIGHT = toolbarItemSize * toolbarItemCount;
const MIN_WIDTH = toolbarOpenSize + toolbarItemSize + 80;

import { CodeEditor } from './CodeEditor/CodeEditor';

import * as styles from './Playroom.css';
import { toolbarOpenSize } from './Toolbar/Toolbar.css';
import { toolbarItemSize } from './ToolbarItem/ToolbarItem.css';

const resizableConfig = (position: EditorPosition = 'bottom') => ({
  top: position === 'bottom',
  right: false,
  bottom: false,
  left: position === 'right',
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
});

const resolveDirection = (
  editorPosition: EditorPosition,
  editorHidden: boolean
) => {
  if (editorPosition === 'right') {
    return editorHidden ? 'left' : 'right';
  }

  return editorHidden ? 'up' : 'down';
};

export interface PlayroomProps {
  components: Record<string, ComponentType>;
  themes: string[];
  widths: number[];
  defaultWidths: number[];
  snippets: Snippets;
}

export default ({ components, themes, widths, defaultWidths, snippets }: PlayroomProps) => {
  const [
    {
      editorPosition,
      editorHeight,
      editorWidth,
      editorHidden,
      visibleThemes,
      visibleWidths,
      code,
      previewRenderCode,
      previewEditorCode,
      ready,
    },
    dispatch,
  ] = useContext(StoreContext);

  const updateEditorSize = useDebouncedCallback(
    ({
      isVerticalEditor,
      offsetWidth,
      offsetHeight,
    }: {
      isVerticalEditor: boolean;
      offsetHeight: number;
      offsetWidth: number;
    }) => {
      dispatch({
        type: isVerticalEditor ? 'updateEditorWidth' : 'updateEditorHeight',
        payload: { size: isVerticalEditor ? offsetWidth : offsetHeight },
      });
    },
    1
  );

  const resetEditorPosition = useDebouncedCallback(() => {
    if (editorPosition === 'undocked') {
      dispatch({ type: 'resetEditorPosition' });
    }
  }, 1);

  if (!ready) {
    return null;
  }

  const codeEditor = (
    <Fragment>
      <div className={styles.editorContainer}>
        <CodeEditor
          code={code}
          onChange={(newCode: string) =>
            dispatch({ type: 'updateCode', payload: { code: newCode } })
          }
          previewCode={previewEditorCode}
          hints={componentsToHints(components)}
        />
        <StatusMessage />
      </div>
      <div className={styles.toolbarContainer}>
        <Toolbar widths={widths} themes={themes} snippets={snippets} />
      </div>
    </Fragment>
  );

  const isVerticalEditor = editorPosition === 'right';
  const isHorizontalEditor = editorPosition === 'bottom';
  const sizeStyles = {
    height: isHorizontalEditor ? `${editorHeight}px` : 'auto', // issue in ff & safari when not a string
    width: isVerticalEditor ? `${editorWidth}px` : 'auto',
  };
  const editorContainer =
    editorPosition === 'undocked' ? (
      <WindowPortal
        height={window.outerHeight}
        width={window.outerWidth}
        onUnload={resetEditorPosition}
        onError={resetEditorPosition}
      >
        {codeEditor}
      </WindowPortal>
    ) : (
      <Resizable
        className={classnames(styles.resizeableContainer, {
          [styles.resizeableContainer_isRight]: isVerticalEditor,
          [styles.resizeableContainer_isBottom]: isHorizontalEditor,
          [styles.resizeableContainer_isHidden]: editorHidden,
        })}
        defaultSize={sizeStyles}
        size={sizeStyles}
        minWidth={isVerticalEditor ? MIN_WIDTH : undefined}
        minHeight={MIN_HEIGHT}
        onResize={(_event, _direction, { offsetWidth, offsetHeight }) => {
          updateEditorSize({ isVerticalEditor, offsetWidth, offsetHeight });
        }}
        enable={resizableConfig(editorPosition)}
      >
        {codeEditor}
      </Resizable>
    );

  return (
    <div className={styles.root}>
      <div
        className={styles.previewContainer}
        style={
          editorHidden
            ? undefined
            : {
                right: { right: editorWidth },
                bottom: { bottom: editorHeight },
                undocked: undefined,
              }[editorPosition]
        }
      >
        <Frames
          code={previewRenderCode || code}
          themes={
            visibleThemes && visibleThemes.length > 0 ? visibleThemes : themes
          }
          widths={
            visibleWidths && visibleWidths.length > 0 ? visibleWidths : defaultWidths ?? widths
          }
        />
        <div
          className={classnames(styles.toggleEditorContainer, {
            [styles.isBottom]: isHorizontalEditor,
          })}
        >
          <button
            className={styles.toggleEditorButton}
            title={`${editorHidden ? 'Show' : 'Hide'} the editor`}
            onClick={() =>
              dispatch({ type: editorHidden ? 'showEditor' : 'hideEditor' })
            }
          >
            <ChevronIcon
              size={16}
              direction={resolveDirection(editorPosition, editorHidden)}
            />
          </button>
        </div>
      </div>
      {editorContainer}
    </div>
  );
};
