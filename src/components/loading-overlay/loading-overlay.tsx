import './loading-overlay.scss';

import { memo, CSSProperties } from 'react';

import { Loader } from '../loader';

export interface LoadingOverlayProps {
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: CSSProperties;
  // add new properties here...
  loading?: boolean;
}

type Props = LoadingOverlayProps;

function LoadingOverlayComponent(props: Props) {
  const { className, style, loading } = props;

  return (
    <div className={`loading-overlay ${className ?? ''}`.replace(/\s+/g, ' ').trim()} style={style}>
      <Loader className="loading-spin" style={{ display: loading ? 'block' : 'none' }} />
    </div>
  );
}

export const LoadingOverlay = memo(LoadingOverlayComponent) as unknown as typeof LoadingOverlayComponent;
