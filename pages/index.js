import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'

import { Layout } from '../components/layout'

const backendURL = (
  process.env.BACKEND_URL ? process.env.BACKEND_URL : 'ws://localhost:8000'
).replace('ws', 'http')

export default function Home() {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [nUsers, setNUsers] = useState(null)
  const [nSelections, setNSelections] = useState(null)

  const router = useRouter()
  const toast = useToast()

  const createRoom = () => {
    if (!nUsers || !nSelections) {
      toast({
        title: '新しく部屋を作るには',
        description: '参加人数とプレイヤーが指定する枚数を決めてください。',
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (nUsers * nSelections > 10) {
      toast({
        title: '指定するカードが多すぎます',
        description: '人数 ✕ 枚数を10以下にしてください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    let trial = 0
    setIsCreatingRoom(true)

    const timer = setInterval(() => {
      fetch(backendURL)
        .then((res) => {
          clearInterval(timer)
          const encodedRoomParameter = (nUsers - 2) * 3 + (nSelections - 1)
          router.push(
            `/${'' + encodedRoomParameter + uuidv4().substring(0, 3)}/`
          )
        })
        .catch((error) => {
          trial += 1
          if (trial > 9) {
            clearInterval(timer)
            setIsCreatingRoom(false)
            toast({
              title: '部屋の作成に失敗しました',
              description: 'もう一度試してみてください。',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          }
        })
    }, 1000)
  }

  useEffect(() => {
    fetch(backendURL)
      .then((res) => {})
      .catch((error) => {})
  }, [])

  return (
    <Layout>
      <Heading size="xl" mb={2}>
        Dominion Builder
      </Heading>
      <Text fontSize="md" mb={6}>
        ドミニオンのサプライをプレイヤーの投票によって決めるWebサイトです。部屋ごとにリンクが発行されるので、他の人を簡単に招待することができます。
      </Text>
      <Box p={4} mb={6} bgColor="gray.50" borderRadius={6}>
        <Text fontSize="md" mb={3}>
          参加人数とプレイヤーが指定するカード枚数を決めて部屋を作りましょう。
        </Text>
        <HStack>
          <Select
            placeholder="人数"
            flex="1"
            onChange={(e) => {
              setNUsers(e.target.value)
            }}
          >
            {[2, 3, 4].map((n) => (
              <option key={`n-players-${n}`} value={n}>
                {n}人
              </option>
            ))}
          </Select>
          <Select
            placeholder="枚数"
            flex="1"
            onChange={(e) => {
              setNSelections(e.target.value)
            }}
          >
            {[1, 2, 3].map((n) => (
              <option key={`n-selections-${n}`} value={n}>
                {n}枚
              </option>
            ))}
          </Select>
          <Button
            onClick={createRoom}
            isLoading={isCreatingRoom}
            loadingText="部屋を作成中"
            colorScheme="blue"
            width="160px"
          >
            新しく部屋を作る
          </Button>
        </HStack>
      </Box>
      <HStack spacing={4}>
        <Link
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
          部屋に入る
        </Link>
      </HStack>
    </Layout>
  )
}
