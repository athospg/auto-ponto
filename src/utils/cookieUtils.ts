import { Credentials } from '../types/credentials.types';

export class CookieUtils {
  static getCookie = (name: string): string | undefined => {
    const cookie = document.cookie;
    const cookieName = `${name}=`;
    const cookieStart = cookie.indexOf(cookieName);
    let cookieValue = '';
    if (cookieStart > -1) {
      cookieValue = cookie.substring(cookieStart + cookieName.length);
      const cookieEnd = cookieValue.indexOf(';');
      if (cookieEnd > -1) {
        cookieValue = cookieValue.substring(0, cookieEnd);
      }
    }

    return cookieValue;
  };

  static setCookie = (name: string, value: string, days?: number): void => {
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value};${expires};path=/`;
      return;
    }
    document.cookie = `${name}=${value};path=/`;
  };

  static removeCookie = (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  static getCredentials = (type: 'epm' | 'mrh'): Credentials | undefined => {
    const cookieValue = CookieUtils.getCookie(`${type}Credentials`);
    if (!cookieValue) return undefined;

    const credentials = JSON.parse(cookieValue) as Credentials;
    return credentials;
  };
}
