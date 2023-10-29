type ErrorTypes =
  | 'url-not-found'
  | 'credentials-not-found'
  | 'login-failed'
  | 'token-not-found'
  | 'year-month-not-set'
  | 'get-data-failed';

export interface ErrorCode {
  code: 'app' | `${'mrh' | 'epm'}-${ErrorTypes}`;
  message: string;
}
