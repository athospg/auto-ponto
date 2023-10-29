import './login-form.scss';

import React, { memo } from 'react';

import { Credentials } from '../../../../types/credentials.types';
import { LoadingState } from '../../../../types/utils.types';
import { LoadingOverlay } from '../../../../components/loading-overlay';
import { CredentialsData } from '../../../../hooks/useLogin';

export interface LoginFormProps {
  /**
   * Defines custom className
   */
  className?: string;
  /**
   * Defines component's custom style
   */
  style?: React.CSSProperties;
  // add new properties here...
  kind: 'mrh' | 'epm';
  loginState: LoadingState<void>;
  credentialsData: CredentialsData;
  onURLChange: (url: string) => void;
  onCredentialsChange: (credentials: Partial<Credentials>) => void;
}

type Props = LoginFormProps;

function LoginFormComponent(props: Props) {
  const { className, style, kind, loginState, credentialsData, onURLChange, onCredentialsChange } = props;

  return (
    <div className={`login-form ${className ?? ''}`.trim()} style={style}>
      {!loginState?.status || loginState.status === 'loading' ? (
        <LoadingOverlay loading />
      ) : loginState.status === 'error' ? (
        <span>{loginState.message ?? 'unknown error'}</span>
      ) : (
        <>
          <input
            title={`${kind} URL`}
            placeholder={`${kind} URL`}
            style={{ marginBlock: '0.5rem' }}
            defaultValue={credentialsData.mrhUrl}
            onChange={(e) => {
              onURLChange(e.target.value);
            }}
          />

          <form>
            <label htmlFor={`${kind}-username`}>username</label>
            <input
              type="text"
              name="username"
              id={`${kind}-username`}
              value={credentialsData[`${kind}Credentials`]?.username ?? ''}
              autoComplete={`${kind}-username`}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                onCredentialsChange({
                  ...credentialsData[`${kind}Credentials`],
                  [target.name]: target.value,
                });
              }}
            />
            <label htmlFor={`${kind}-password`}>password</label>
            <input
              type="password"
              name="password"
              id={`${kind}-password`}
              value={credentialsData[`${kind}Credentials`]?.password ?? ''}
              autoComplete={`${kind}-password`}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                onCredentialsChange({
                  ...credentialsData[`${kind}Credentials`],
                  [target.name]: target.value,
                });
              }}
            />
          </form>
        </>
      )}
    </div>
  );
}

export const LoginForm = memo(LoginFormComponent) as unknown as typeof LoginFormComponent;
