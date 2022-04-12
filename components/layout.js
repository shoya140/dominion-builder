import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Dominion Builder</title>
        <meta
          name="description"
          content="ドミニオンのサプライをプレイヤーの投票によって決めるWebサイトです。部屋ごとにリンクが発行されるので、他の人を簡単に招待することができます。"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
