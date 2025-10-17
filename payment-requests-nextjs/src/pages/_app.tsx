import { AppProps } from 'next/app';
import { useEffect } from 'react';
// @ts-ignore: allow side-effect CSS import without typings
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Any global setup can be done here
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;