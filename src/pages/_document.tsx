import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#000000" />
      </Head>
      <body className="antialiased">
        <Main />
        {/* Google Translate Mount Point */}
        <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,te,hi,ta,kn,mr,bn,ur,ml,gu',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          async
        />
        <NextScript />
      </body>
    </Html>
  );
}
