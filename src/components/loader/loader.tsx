import './loader.scss';

import { memo, CSSProperties } from 'react';

export interface LoaderProps {
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: CSSProperties;
  // add new properties here...
}

type Props = LoaderProps;

function LoaderComponent(props: Props) {
  const { className, style } = props;

  return <span className={`loader ${className ?? ''}`.replace(/\s+/g, ' ').trim()} style={style} />;
}

export const Loader = memo(LoaderComponent) as unknown as typeof LoaderComponent;
