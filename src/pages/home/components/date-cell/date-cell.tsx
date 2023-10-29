import './date-cell.scss';

import React, { memo } from 'react';

import { Event } from '../../home.hook';

export type EventKind<T extends string> = {
  kind: T;
  date: Date;
  duration: number;
  description: string;
  appointments: number;
  pending: number;
};

export interface DateCellProps {
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: React.CSSProperties;
  // add new properties here...
  date: Date;
  events: Event[];
}

type Props = DateCellProps;

function DateCellComponent(props: Props) {
  const { className, style, date, events } = props;

  const groupedEvents = React.useMemo(() => {
    return events?.length
      ? events.reduce((acc, event) => {
          const key = event.date.toISOString().split('T')[0];
          acc[key] ??= [undefined, undefined];
          if (!(acc as any)[key][event.kind === 'mrh' ? 0 : 1]) {
            (acc as any)[key][event.kind === 'mrh' ? 0 : 1] = event;
          } else {
            (acc as any)[key][event.kind === 'mrh' ? 0 : 1].duration += event.duration;
          }
          return acc;
        }, {} as Record<string, [EventKind<'meuRh'> | undefined, EventKind<'epm'> | undefined]>)
      : null;
  }, [events]);

  return (
    <div className={`date-cell ${className ?? ''}`.trim()} style={style} key={`date-cell-${date.toISOString()}`}>
      {groupedEvents &&
        Object.values(groupedEvents).map(([meuRHEvent, epmEvent]) => {
          const hasSameDuration = meuRHEvent?.duration === epmEvent?.duration;
          const hasOddAppointments = (meuRHEvent?.appointments ?? 2) % 2 === 1;
          const hasPendingAppointments = meuRHEvent?.pending && meuRHEvent.pending > 0;

          const extraMessage = hasOddAppointments
            ? ` (${meuRHEvent?.appointments} appointments${
                hasPendingAppointments ? `, ${meuRHEvent?.pending} pending approval` : ''
              })`
            : '';

          return (
            <div className="events-wrapper" key={`events-${date.toISOString()}`}>
              {meuRHEvent && (
                <div
                  className={`event-badge ${
                    hasOddAppointments || hasPendingAppointments
                      ? 'ultra'
                      : !epmEvent
                      ? 'missing'
                      : !hasSameDuration
                      ? 'warning'
                      : ''
                  }`}
                >
                  {/* <Tooltip title={`${meuRHEvent.description}${extraMessage}`}> */}
                  <span className="truncated-text">{meuRHEvent.description}</span>
                  {/* </Tooltip> */}
                </div>
              )}

              {epmEvent && (
                <div className={`event-badge ${!hasSameDuration ? 'warning' : ''}`}>
                  {/* <Tooltip title={epmEvent.description}> */}
                  <span className="truncated-text">{epmEvent.description}</span>
                  {/* </Tooltip> */}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

export const DateCell = memo(DateCellComponent) as unknown as typeof DateCellComponent;
