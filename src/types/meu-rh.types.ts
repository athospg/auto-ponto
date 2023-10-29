export type Direction = 'entry' | 'exit';

export type Origin = 'geolocation' | 'manual';

export type Label = 'Aguardando aprovação' | 'Aprovada';

export type StatusEnum = 'approved' | 'approving';

export interface ClockingParams extends Record<string, string> {
  initPeriod: string;
  endPeriod: string;
}

export interface Clockings {
  initPeriod: string;
  endPeriod: string;
  clockings?: Clocking[];
}

export interface Clocking {
  id: string;
  date: string; // ISO 8601 with 0 hours 0 minutes and 0 seconds
  origin: Origin;
  hasCoordinates?: boolean;
  latitude?: string;
  longitude?: string;
  referenceDate: string; // same as date
  hour: number; // milliseconds from 00:00
  direction: Direction;
  sequence: number;
  status: StatusClass;
  divergent: any[];
}

export interface StatusClass {
  id: string;
  status: StatusEnum;
  label: Label;
}

// ====================================================

export interface MRHMinutes {
  minutes: number;
  appointments: number;
  pending: number;
}
