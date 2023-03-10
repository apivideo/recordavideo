import type { AppProps } from 'next/app'
import Script from 'next/script'
import '../../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <>
  
	<Script async src="https://www.googletagmanager.com/gtag/js?id=G-N9E9YP1HGF"></Script>
	<Script id="ga" dangerouslySetInnerHTML={{
    __html: `
  		window.dataLayer = window.dataLayer || [];
  		function gtag(){dataLayer.push(arguments);}
  		gtag('js', new Date());
  		gtag('config', 'G-N9E9YP1HGF');`}}/>
	
  <Component {...pageProps} />
  </>
}

export default MyApp
