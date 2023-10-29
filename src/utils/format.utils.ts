export class FormatUtils {
  static format2Digits = (number: number) => number.toString().padStart(2, '0');

  // Format dates as "dd/MM/yyyy"
  private static dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
  static formatDate = (date: Date) => FormatUtils.dateFormatter.format(date);

  // Format minutes as "HH:mm"
  private static minutesFormatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  static formatMinutes = (minutes: number) => FormatUtils.minutesFormatter.format(new Date(minutes * 60 * 1000));
}
