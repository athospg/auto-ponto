import { Credentials } from '../types/credentials.types';
import { ErrorCode } from '../types/error-codes.types';
import { Clockings } from '../types/meu-rh.types';
import { CookieUtils } from '../utils/cookieUtils';

export class MeuRHClient {
  private baseUrl: string | undefined;
  private urls: { login: string; period: string; clockings: string; occasionalDays: string } | undefined;

  token = CookieUtils.getCookie('meuRHToken');

  constructor() {
    const baseUrl = CookieUtils.getCookie('meuRHBaseUrl');
    if (baseUrl) this.setBaseURL(baseUrl);
  }

  setBaseURL = (baseUrl: string): void => {
    const url = baseUrl.replace(/\/$/, '').replace(/:\d+$/, '');
    CookieUtils.setCookie('meuRHBaseUrl', url);
    this.baseUrl = url;
    this.urls = {
      login: `${url}:8400/rest01/auth/login`,
      period: `${url}:8400/rest01/timesheet/periods/%7Bcurrent%7D/`,
      clockings: `${url}:8400/rest01/timesheet/clockings/%7Bcurrent%7D/`,
      occasionalDays: `${url}:8400/rest01/timesheet/occasionalDays/%7Bcurrent%7D/`,
    };
  };

  login = async (url?: string, credentials?: Credentials, saveCredentials?: boolean): Promise<void | ErrorCode> => {
    if ((!this.baseUrl || !this.urls) && url) this.setBaseURL(url);
    if (!this.baseUrl || !this.urls) {
      return {
        code: 'mrh-url-not-found',
        message: 'mrh url not found!',
      };
    }

    if (credentials && saveCredentials) {
      CookieUtils.setCookie('meuRHCredentials', JSON.stringify(credentials));
    }

    let userCredentials = credentials;
    if (!userCredentials) {
      const cookieCredentials = CookieUtils.getCookie('meuRHCredentials');
      if (cookieCredentials) userCredentials = JSON.parse(cookieCredentials) as Credentials;
    }
    if (!userCredentials?.username || !userCredentials?.password) {
      return {
        code: 'mrh-credentials-not-found',
        message: 'mrh credentials not found!',
      };
    }

    try {
      const resp = await fetch(this.urls.login, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'pt-BR',
          'content-type': 'application/x-www-form-urlencoded',
          'sec-ch-ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'x-totvs-app': '0200',
          Referer: `${this.baseUrl}:4020/`,
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: `user=${userCredentials.username}&password=${userCredentials.password}&redirectUrl=${this.baseUrl}:4020/01/&restUrl=${this.baseUrl}:8400/rest01`,
      });

      if (resp.status !== 201) {
        console.error('mrh login failed!');
        return {
          code: 'mrh-login-failed',
          message: 'mrh login failed!',
        };
      }

      const data = await resp.text();
      if (!data?.split('token=')?.[1]?.split('&')?.[0]) {
        return {
          code: 'mrh-login-failed',
          message: 'mrh login failed!',
        };
      }

      this.token = data.split('token=')[1].split('&')[0];
      CookieUtils.setCookie('meuRHToken', this.token, 36);

      console.log('mrh login successful!');
      return undefined;
    } catch (error) {
      console.error('mrh login failed!', error);
      return {
        code: 'mrh-login-failed',
        message: 'mrh login failed!',
      };
    }
  };

  // getPeriods = async () => {
  //   const resp = await fetch(this.urls.period, {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${this.token}`,
  //     },
  //   });

  //   const data = await resp.json();
  //   return data;
  // };

  getClocking = async (initPeriod: string, endPeriod: string): Promise<Clockings | ErrorCode> => {
    if (!this.baseUrl || !this.urls) {
      return {
        code: 'mrh-url-not-found',
        message: 'mrh url not found!',
      };
    }

    try {
      const urlWithParams = new URL(this.urls.clockings);
      urlWithParams.search = new URLSearchParams({ initPeriod, endPeriod }).toString();

      const resp = await fetch(urlWithParams.toString(), {
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'pt-BR',
          authorization: `Bearer ${CookieUtils.getCookie('meuRHToken')}`,
          'sec-ch-ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'x-totvs-app': '0200',
          Referer: `${this.baseUrl}:4020/`,
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: null,
      });

      const data = (await resp.json()) as Clockings | string;
      if (typeof data !== 'object' || !('initPeriod' in data)) {
        return {
          code: 'mrh-get-data-failed',
          message: 'mrh get clockings failed!',
        };
      }
      return data;
    } catch (error) {
      console.error('mrh get clockings failed!', error);
      return {
        code: 'mrh-get-data-failed',
        message: 'mrh get clockings failed!',
      };
    }
  };
}
