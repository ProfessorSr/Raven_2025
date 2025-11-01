import type { AppProps } from 'next/app';
import React from 'react';
import { startSessionKeepAlive } from '@/lib/api';

let __keepAliveStarted = false;

export default function RavenApp({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return; // run only on client
    if (__keepAliveStarted) return;            // avoid duplicates on HMR
    try {
      startSessionKeepAlive();
      __keepAliveStarted = true;
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[app] session keep-alive started');
      }
    } catch (e: any) {
      console.warn('[app] session keep-alive failed to start', e?.message || e);
    }
  }, []);

  return <Component {...pageProps} />;
}
