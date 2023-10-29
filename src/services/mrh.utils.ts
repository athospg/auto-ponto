import { Clocking, MRHMinutes } from '../types/meu-rh.types';

export class MeuRHUtils {
  static convertToDailyMinutes = (clockings: Clocking[]): Record<string, MRHMinutes> => {
    const groupedClockings = clockings.reduce((acc, clocking) => {
      const date = clocking.date.split('T')[0];
      acc[date] ??= [];
      acc[date].push({
        milliseconds: clocking.hour,
        pending: clocking.status.status === 'approving' ? 1 : 0,
      });
      return acc;
    }, {} as Record<string, { milliseconds: number; pending: 0 | 1 }[]>);

    const dailyMinutes = Object.entries(groupedClockings).reduce((acc, [date, groupValue]) => {
      const minutes =
        groupValue
          .map((x) => x.milliseconds)
          .sort()
          .reduce((mAcc, curr, index, array) => {
            if (index % 2 === 1) {
              const previous = array[index - 1];
              const diff = curr - previous;
              return mAcc + diff;
            }
            return mAcc;
          }, 0) / 60000;

      acc[date] = {
        minutes,
        appointments: groupValue.length,
        pending: groupValue.reduce((pAcc, curr) => pAcc + curr.pending, 0),
      };
      return acc;
    }, {} as Record<string, MRHMinutes>);

    return dailyMinutes;
  };
}
