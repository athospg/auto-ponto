import { MeuRHClient } from '../../../services/mrh.client';
import { MeuRHUtils } from '../../../services/mrh.utils';
import { ErrorCode } from '../../../types/error-codes.types';
import { MRHMinutes } from '../../../types/meu-rh.types';
import { CookieUtils } from '../../../utils/cookieUtils';
import { FormatUtils } from '../../../utils/format.utils';

export class MeuRH {
  preloadCount: number | undefined;

  private _year: number = new Date().getFullYear();
  public get year(): number {
    return this._year;
  }
  public set year(value: number) {
    this._year = value;
  }

  private _month: number = new Date().getMonth() + 1;
  public get month(): number {
    return this._month;
  }
  public set month(value: number) {
    this._month = value;
  }

  // The primary key here is 'YYYY-MM' and the inner key is 'YYYY-MM-DD'
  private cache: Record<string, Record<string, MRHMinutes>> = {};

  constructor(private meuRHClient: MeuRHClient) {
    if (!CookieUtils.getCookie('meuRHToken')) this.meuRHClient.login();
  }

  getDailyMinutes = async (ignoreCache?: boolean): Promise<Record<string, MRHMinutes> | ErrorCode> => {
    const requested = await this.getMinutesInternal(this.year, this.month, ignoreCache);

    if (this.preloadCount) {
      for (let i = 1; i <= this.preloadCount; i++) {
        const year = this.month - i <= 0 ? this.year - 1 : this.year;
        const month = this.month - i <= 0 ? this.month - i + 12 : this.month - i;
        this.getMinutesInternal(year, month);
      }
    }

    return requested;
  };

  private getMinutesInternal = async (
    year: number,
    month: number,
    ignoreCache?: boolean,
  ): Promise<Record<string, MRHMinutes> | ErrorCode> => {
    const monthString = FormatUtils.format2Digits(month);
    const cacheKey = `${year}-${monthString}`;
    if (!ignoreCache && cacheKey in this.cache) return this.cache[cacheKey];

    const dayEndString = FormatUtils.format2Digits(new Date(Date.UTC(year, month)).getDate());

    const initPeriod = `${year}-${monthString}-01T00:00:00.000Z`;
    const endPeriod = `${year}-${monthString}-${dayEndString}T00:00:00.000Z`;

    let clocking = await this.meuRHClient.getClocking(initPeriod, endPeriod);
    if ('code' in clocking) {
      const loginResult = await this.meuRHClient.login();
      if (loginResult) return loginResult;

      clocking = await this.meuRHClient.getClocking(initPeriod, endPeriod);
    }

    if ('code' in clocking) return clocking;

    const minutes = MeuRHUtils.convertToDailyMinutes(clocking.clockings ?? []);
    this.cache[cacheKey] = minutes;
    return minutes;
  };
}

export default MeuRH;
