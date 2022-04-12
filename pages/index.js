import { useState } from 'react'
import { Button, Heading, HStack, Text, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'

import Layout from '../components/layout'

const backendURL = process.env.BACKEND_URL
  ? process.env.BACKEND_URL
  : 'ws://localhost:8000'

export default function Home() {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const router = useRouter()
  const toast = useToast()

  const createNewRoom = () => {
    const timeout = setTimeout(() => {
      setIsCreatingRoom(false)
      toast({
        title: 'エラー',
        description: 'サーバーが応答しませんでした。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }, 5000)

    setIsCreatingRoom(true)
    fetch(backendURL.replace('ws', 'http'))
      .then((res) => {
        setTimeout(() => {
          clearTimeout(timeout)
          router.push(`/${uuidv4().substring(0, 8)}/`)
        }, 1000)
      })
      .catch((error) => {})
  }

  return (
    <Layout>
      <Heading size="xl" mb={4}>
        Dominion Builder
      </Heading>
      <Text fontSize="md" mb={4}>
        ドミニオンのサプライをプレイヤーの投票によって決めるWebサイトです。部屋ごとにリンクが発行されるので、他の人を簡単に招待することができます。
      </Text>
      <HStack>
        <Button
          size="md"
          onClick={createNewRoom}
          isLoading={isCreatingRoom}
          loadingText="サーバーを起動中"
          width="180px"
        >
          新しく部屋を作る
        </Button>
        <Button
          size="md"
          onClick={() => {
            toast({
              title: '他の人が作った部屋に入るには',
              description:
                '部屋のリンクをブラウザのアドレスバーに入力してください。',
              status: 'info',
              duration: 5000,
              isClosable: true,
            })
          }}
        >
          他の人が作った部屋に入る
        </Button>
      </HStack>
    </Layout>
  )
}
