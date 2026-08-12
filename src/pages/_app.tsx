import '../styles/globals.css';
import '../styles/glassmorphic.css';
import { ThemeProvider } from '../context/ThemeContext';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
        <Head>
          <title>DiseaseX Healthcare Platform</title>
          <meta name="description" content="DiseaseX - Multi-Disease Prediction Platform" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default App;
