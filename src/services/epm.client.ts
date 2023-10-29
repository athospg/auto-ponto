import { v4 } from 'uuid';

import { Credentials } from '../types/credentials.types';
import { EPMActivities } from '../types/epm.types';
import { ErrorCode } from '../types/error-codes.types';
import { CookieUtils } from '../utils/cookieUtils';
import { FormatUtils } from '../utils/format.utils';

export class EPMClient {
  private baseUrl: string | undefined;
  private urls: { login: string; activities: string; createActivity: string } | undefined;

  token = CookieUtils.getCookie('epmToken');

  constructor() {
    const baseUrl = CookieUtils.getCookie('epmBaseUrl');
    if (baseUrl) this.setBaseUrl(baseUrl);
  }

  setBaseUrl = (baseUrl: string) => {
    const url = baseUrl.replace(/\/$/, '').replace(/:\d+$/, '');
    CookieUtils.setCookie('epmBaseUrl', url);
    this.baseUrl = url;
    this.urls = {
      login: `${url}/api/Account/authenticate`,
      activities: `${url}/api/epm/projetos/profissional`,
      createActivity: `${url}/api/epmAtividadeProfissionalProjetoMarcacao`,
    };
  };

  login = async (url?: string, credentials?: Credentials, saveCredentials?: boolean): Promise<void | ErrorCode> => {
    if ((!this.baseUrl || !this.urls) && url) this.setBaseUrl(url);
    if (!this.baseUrl || !this.urls) {
      return {
        code: 'epm-url-not-found',
        message: 'epm url not found!',
      };
    }

    if (credentials && saveCredentials) {
      CookieUtils.setCookie('epmCredentials', JSON.stringify(credentials));
    }

    let userCredentials = credentials;
    if (!userCredentials) {
      const cookieCredentials = CookieUtils.getCookie('epmCredentials');
      if (cookieCredentials) userCredentials = JSON.parse(cookieCredentials) as Credentials;
    }
    if (!userCredentials?.username || !userCredentials?.password) {
      return {
        code: 'epm-credentials-not-found',
        message: 'epm credentials not found!',
      };
    }

    try {
      const resp = await fetch(this.urls.login, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          authorization: 'Bearer',
          'content-type': 'application/json',
          Referer: `${this.baseUrl}:8081/`,
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: `{"username":"${userCredentials.username}","password":"${userCredentials.password}","baseAuthentication":"epm"}`,
      });

      if (resp.status !== 200) {
        console.error('EPM login failed!');
        return {
          code: 'epm-login-failed',
          message: 'EPM login failed!',
        };
      }

      const data = (await resp.json()) as { access_token?: string } | null;
      if (!data?.access_token) {
        return {
          code: 'epm-login-failed',
          message: 'EPM login failed!',
        };
      }

      this.token = data.access_token;
      CookieUtils.setCookie('epmToken', this.token, 36);

      console.log('epm login successful!');
      return undefined;
    } catch (error) {
      console.error('epm login failed!', error);
      return {
        code: 'epm-login-failed',
        message: 'epm login failed!',
      };
    }
  };

  getActivities = async (year: string, month: string): Promise<EPMActivities | ErrorCode> => {
    if (!this.baseUrl || !this.urls) {
      return {
        code: 'epm-url-not-found',
        message: 'EPM url not found!',
      };
    }

    try {
      const urlWithParams = new URL(this.urls.activities);
      urlWithParams.search = new URLSearchParams({ year, month }).toString();

      const resp = await fetch(urlWithParams.toString(), {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          authorization: `Bearer ${this.token}`,
          Referer: `${this.baseUrl}:8081/`,
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: null,
        method: 'GET',
      });

      if (resp.status !== 200) {
        return {
          code: 'epm-get-data-failed',
          message: 'EPM get activities failed!',
        };
      }

      const data = (await resp.json()) as EPMActivities | string;
      if (typeof data !== 'object') {
        return {
          code: 'epm-get-data-failed',
          message: 'EPM get activities failed!',
        };
      }
      return data;
    } catch (error) {
      console.error('EPM get activities failed!', error);
      return {
        code: 'epm-get-data-failed',
        message: 'EPM get activities failed!',
      };
    }
  };

  createActivity = async (projectId: string, date: Date, minutes: number, idProfessional: string): Promise<void> => {
    console.log(`Creating activity for ${projectId} with ${minutes} minutes`);

    if (!this.baseUrl || !this.urls) return;

    const diaMesAnoFormatado = FormatUtils.formatDate(date);

    const bodyObj = {
      projetoId: projectId,
      diaMesAnoFormatado,
      atividades: [
        {
          key: v4(),
          nome: '',
          hora: FormatUtils.formatMinutes(minutes),
          statusAtividade: 1,
          diaMesAnoFormatado,
          epmAtividadeProjetoProfissionalId: idProfessional,
        },
      ],
    };
    // console.log(JSON.stringify(bodyObj, null, 2));

    const resp = await fetch(this.urls.createActivity, {
      method: 'PUT',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
        Referer: `${this.baseUrl}:8081/`,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body: JSON.stringify(bodyObj),
    });

    if (resp.status !== 200) {
      console.error('EPM createActivity failed!');
    }
  };
}
