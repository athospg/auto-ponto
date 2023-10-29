import React from 'react';

import { EPMClient } from '../services/epm.client';
import { MeuRHClient } from '../services/mrh.client';
import { Credentials } from '../types/credentials.types';
import { LoadingState } from '../types/utils.types';
import { CookieUtils } from '../utils/cookieUtils';

export interface CredentialsData {
  mrhUrl?: string;
  epmUrl?: string;

  mrhCredentials?: Credentials;
  epmCredentials?: Credentials;

  saveMRHCredentials?: boolean;
  saveEPMCredentials?: boolean;

  mrhFailed?: boolean;
  epmFailed?: boolean;
}

export const useLoginHook = () => {
  const [meuRHLoginState, setMeuRHLoginState] = React.useState<LoadingState<void>>({ status: 'loaded' });
  const [epmLoginState, setEpmLoginState] = React.useState<LoadingState<void>>({ status: 'loaded' });

  const [credentialsData, setCredentialsData] = React.useState<CredentialsData | undefined>(() => {
    const mrhUrl = CookieUtils.getCookie('meuRHBaseUrl') ?? undefined;
    const epmUrl = CookieUtils.getCookie('epmBaseUrl') ?? undefined;
    const mrhCredentials = CookieUtils.getCookie('meuRHCredentials');
    const epmCredentials = CookieUtils.getCookie('epmCredentials');

    return {
      mrhUrl,
      epmUrl,
      mrhCredentials: mrhCredentials ? (JSON.parse(mrhCredentials) as Credentials) : undefined,
      epmCredentials: epmCredentials ? (JSON.parse(epmCredentials) as Credentials) : undefined,
    };
  });

  const meuRHClient = React.useMemo(() => new MeuRHClient(), []);
  const epmClient = React.useMemo(() => new EPMClient(), []);

  const meuRHLogin = async () => {
    setMeuRHLoginState({ status: 'loading' });
    await meuRHClient.login(
      credentialsData?.mrhUrl,
      credentialsData?.mrhCredentials,
      credentialsData?.saveMRHCredentials,
    );
    setCredentialsData((c) => ({ ...(c ?? {}), mrhFailed: !meuRHClient.token }));
    setMeuRHLoginState({ status: 'loaded' });
  };
  const epmLogin = async () => {
    setEpmLoginState({ status: 'loading' });
    await epmClient.login(
      credentialsData?.epmUrl,
      credentialsData?.epmCredentials,
      credentialsData?.saveEPMCredentials,
    );
    setCredentialsData((c) => ({ ...(c ?? {}), epmFailed: !epmClient.token }));
    setEpmLoginState({ status: 'loaded' });
  };

  return {
    meuRHLoginState,
    epmLoginState,
    credentialsData,
    meuRHClient,
    epmClient,
    meuRHLogin,
    epmLogin,
    setCredentialsData,
  };
};
