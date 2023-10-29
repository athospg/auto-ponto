export type LoadingState<T, TMessage = string> =
  | {
      status: 'loading';
      data?: T;
    }
  | {
      status: 'error';
      message?: TMessage;
      data?: T;
    }
  | {
      status: 'loaded';
      data?: T;
    }
  | {
      status: 'saving';
      data: T;
    };
