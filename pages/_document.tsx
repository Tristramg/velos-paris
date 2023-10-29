import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="fr">
            <Head>
                <link rel="icon" href="/favicon.png" />
                <link
                    href="//fonts.googleapis.com/css?family=Lato:100,200,300,400,500,600,700,800,900,300italic,400italic,700italic&subset=latin,latin-ext"
                    rel="stylesheet"
                    type="text/css"
                />
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css"
                    rel="stylesheet"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
