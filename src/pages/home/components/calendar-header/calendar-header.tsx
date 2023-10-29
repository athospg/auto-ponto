import './calendar-header.scss';

import React, { memo } from 'react';

import { CalendarMode } from 'antd/lib/calendar/generateCalendar';

import { Dayjs } from 'dayjs';
import { Button, DatePicker, Radio } from 'antd';

export interface CalendarHeaderProps {
  value: Dayjs;
  type: CalendarMode;
  onChange: (date: Dayjs | null) => void;
  onTypeChange: (type: CalendarMode) => void;
  showTypeSelect?: boolean;
  yearSelectOffset?: number;
}

function CalendarHeaderComponent({ value, type, onChange, onTypeChange, showTypeSelect }: CalendarHeaderProps) {
  return (
    <div className={`calendar-header`.trim()}>
      <Button
        type="link"
        // prefixIcon={{ name: 'ChevronLeft' }}
        onClick={() => {
          const now = value.clone().subtract(1, type);
          onChange(now);
        }}
      />

      <div className="centralized">
        <DatePicker picker="month" value={value} onChange={(date) => onChange(date)} />

        {showTypeSelect && (
          <Radio.Group
            onChange={(e) => onTypeChange(e.target.value)}
            value={type}
            options={[
              { label: 'Month', value: 'month' },
              { label: 'Year', value: 'year' },
            ]}
          />
        )}
      </div>

      <Button
        type="link"
        // prefixIcon={{ name: 'ChevronRight' }}
        onClick={() => {
          const now = value.clone().add(1, type);
          onChange(now);
        }}
      />
    </div>
  );
}

export const CalendarHeader = memo(CalendarHeaderComponent) as unknown as typeof CalendarHeaderComponent;
