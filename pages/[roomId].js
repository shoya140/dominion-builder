import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  HStack,
  Input,
  Link,
  Select,
  Text,
  Tooltip,
  VStack,
  useClipboard,
  useToast,
} from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'

import Layout from '../components/layout'
import cards from '../lib/cards.json'

const N_USERS = 4
const N_SELECTIONS = 2

const frontendURL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : 'http://localhost:3000'

const backendURL = process.env.BACKEND_URL
  ? process.env.BACKEND_URL
  : 'ws://localhost:8000'

const defaultUserName = process.env.NODE_ENV === 'development' ? 'dev' : ''

let ws

export default function Room() {
  const [userName, setUserName] = useState(defaultUserName)
  const [userNameValue, setUserNameValue] = useState('')
  const [selections, setSelections] = useState(['おまかせ', 'おまかせ'])
  const [submitted, setSubmitted] = useState(false)
  const [users, setUsers] = useState([])
  const [inviteLink, setInviteLink] = useState('')

  const router = useRouter()
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard(inviteLink)

  const submitSelections = () => {
    setSubmitted(true)
    ws.send(
      JSON.stringify({
        event_type: 'submit selections',
        selections: selections,
      })
    )
    toast({
      title: '投票を受け付けました',
      description: '他の人が投票を完了するまでお待ち下さい。',
      status: 'success',
      duration: 6000,
      isClosable: true,
    })
  }

  const updateSelection = (selectionIndex, newValue) => {
    setSelections(
      [...selections].map((value, index) => {
        return index === selectionIndex ? newValue : value
      })
    )
  }

  const handleUserNameValueChange = (e) => {
    setUserNameValue(e.target.value)
  }

  const updateUserName = () => {
    setUserName(userNameValue)
    ws.send(
      JSON.stringify({
        event_type: 'update user name',
        user_name: userNameValue,
      })
    )
  }

  const clearUserName = () => {
    setUserName('')
    setUserNameValue('')
  }

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const userId = uuidv4().substring(0, 8)
    setInviteLink(`${frontendURL}/${router.query.roomId}`)
    ws = new WebSocket(`${backendURL}/${router.query.roomId}/${userId}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.eventType === 'users updated') {
        setUsers(data.users)
      }
    }
    ws.onopen = () => {}
  }, [router.isReady])

  return (
    <Layout>
      {userName && (
        <>
          <HStack mb={6} overflowX="scroll">
            {users.map(({ userName, submitted }, index) => (
              <Tooltip
                key={`user-${index}`}
                hasArrow
                label={submitted ? '投票完了' : '投票中'}
                placement="top"
                bg={submitted ? 'green.400' : 'blue.400'}
                shadow={false}
              >
                <Box p={2} borderRadius={4} textAlign="center" width="90px">
                  <Avatar>
                    <AvatarBadge
                      boxSize="1.25em"
                      bg={submitted ? 'green.400' : 'blue.400'}
                    />
                  </Avatar>
                  <Text fontSize="sm" mt={2} isTruncated>
                    {userName}
                  </Text>
                </Box>
              </Tooltip>
            ))}
            {users.length < N_USERS && (
              <Box
                p={5}
                borderRadius={4}
                textAlign="center"
                onClick={onCopy}
                bgColor="gray.50"
                cursor="pointer"
              >
                <LinkIcon w={6} h={6} />
                <Text fontSize="xs" mt={2}>
                  {hasCopied ? 'コピーしました' : 'リンクをコピー'}
                </Text>
              </Box>
            )}
          </HStack>
          <VStack spacing={2} mb={12}>
            {[...Array(N_SELECTIONS).keys()].map((selectionIndex) => (
              <Select
                key={`selection-${selectionIndex}`}
                placeholder="カードを選択してください"
                onChange={(e) => {
                  updateSelection(selectionIndex, e.target.value)
                }}
                disabled={submitted}
              >
                {cards.map(({ name, expansion }) => (
                  <option key={`card-${selectionIndex}-${name}`} value={name}>
                    {expansion} - {name}
                  </option>
                ))}
              </Select>
            ))}
            <Button
              colorScheme="blue"
              onClick={submitSelections}
              isFullWidth={true}
              disabled={submitted}
            >
              投票する
            </Button>
          </VStack>
          <HStack spacing={4}>
            <Link href={`/`}>トップページに戻る</Link>
            <Link onClick={clearUserName}>ユーザー名を変更する</Link>
          </HStack>
        </>
      )}
      {!userName && (
        <>
          <HStack mb={12}>
            <Input
              value={userNameValue}
              onChange={handleUserNameValueChange}
              placeholder="あなたのユーザー名を決めてください"
            />
            <Button
              onClick={updateUserName}
              px={10}
              colorScheme="blue"
              disabled={userNameValue === ''}
            >
              決定
            </Button>
          </HStack>
        </>
      )}
    </Layout>
  )
}
