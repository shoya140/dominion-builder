import Head from 'next/head'
import { useRouter } from 'next/router'

const frontendURL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : 'http://localhost:3000'

export function Layout({ children, wide }) {
  const router = useRouter()

  return (
    <div>
      <Head>
        <title>Dominion Builder</title>
        <meta
          name="description"
          content="ドミニオンのサプライをプレイヤーの投票によって決めるWebサイトです。部屋ごとにリンクが発行されるので、他の人を簡単に招待することができます。"
        />
        <meta name="twitter:card" content="summary" />
        <meta property="og:url" content={`${frontendURL}${router.asPath}`} />
        <meta property="og:title" content="Dominion Builder" />
        <meta
          property="og:description"
          content="ドミニオンのサプライをプレイヤーの投票によって決めるWebサイトです。"
        />
        <meta property="og:image" content={`${frontendURL}/ogp.png`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <div className={wide ? 'content-wide' : 'content'}>{children}</div>
      </div>
    </div>
  )
}

export function FloatingTop({ children }) {
  return <div className="floating-top">{children}</div>
}
