import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import '../styles/glassmorphic.css';
import { ThemeProvider } from '../context/ThemeContext';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Route protection - website opens login page first; disease sections require auth
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('diseaseX_auth') === 'true';
    if (!isAuth && router.pathname !== '/login') {
      router.replace('/login');
    }
  }, [router.pathname]);

  // Prevent Google Translate from shifting the body down with top: 40px
  useEffect(() => {
    const suppressGoogleBanner = () => {
      if (document.body && document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement | null;
      if (banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        banner.style.height = '0px';
      }
    };

    suppressGoogleBanner();
    const observer = new MutationObserver(suppressGoogleBanner);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      const savedLang = localStorage.getItem('dx-language');
      if (savedLang && savedLang !== 'en') {
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
          if (select) {
            for (let i = 0; i < select.options.length; i++) {
              if (select.options[i].value.toLowerCase() === savedLang.toLowerCase()) {
                select.selectedIndex = i;
                select.value = select.options[i].value;
                break;
              }
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 300);
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  return (
    <ThemeProvider>
        <Head>
          <title>ProctoAi</title>
          <meta name="description" content="ProctoAi - Smart Exam Inviligator" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default App;
