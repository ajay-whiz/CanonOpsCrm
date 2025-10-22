import { AppProps } from 'next/app';
import { useEffect } from 'react';
// @ts-ignore: allow side-effect CSS import without typings
import '../styles/globals.css';
import Layout from '../components/ui/Layout';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Any global setup can be done here
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;