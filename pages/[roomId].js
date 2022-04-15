import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'
import Mikan from 'mikanjs'
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  HStack,
  Input,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Tooltip,
  VStack,
  useClipboard,
  useToast,
  SimpleGrid,
  Center,
  Spacer,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'

import { Layout, FloatingTop } from '../components/layout'
import cards from '../lib/cards.json'

const frontendURL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : 'http://localhost:3000'

const backendURL = process.env.BACKEND_URL
  ? process.env.BACKEND_URL
  : 'ws://localhost:8000'

const defaultUserName = process.env.NODE_ENV === 'development' ? 'dev' : ''

const groupedCards = cards.reduce((result, card) => {
  result[card.expansion] = [...(result[card.expansion] || []), card]
  return result
}, {})

let ws

export default function Room() {
  const [userName, setUserName] = useState(defaultUserName)
  const [userNameValue, setUserNameValue] = useState('')
  const [selections, setSelections] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [users, setUsers] = useState([])
  const [inviteLink, setInviteLink] = useState('')
  const [nUsers, setNUsers] = useState(0)
  const [nSelections, setNSelections] = useState(0)
  const [result, setResult] = useState(null)

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
      description: '他の人の投票完了をお待ち下さい。',
      status: 'success',
      duration: 6000,
      isClosable: true,
    })
  }

  const selectCard = (name) => {
    if (
      submitted ||
      (selections.length === nSelections && !selections.includes(name))
    ) {
      return
    }
    if (selections.includes(name)) {
      setSelections([...selections].filter((n) => n !== name))
    } else {
      setSelections([...selections, name])
    }
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

    const encodedRoomParameter = parseInt(router.query.roomId.charAt(0))
    setNUsers(Math.floor(encodedRoomParameter / 3) + 2)
    setNSelections((encodedRoomParameter % 3) + 1)

    const userId = uuidv4().substring(0, 8)
    setInviteLink(`${frontendURL}/${router.query.roomId}`)
    ws = new WebSocket(`${backendURL}/${router.query.roomId}/${userId}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.eventType === 'users updated') {
        setUsers(data.users)
      }
      if (data.eventType === 'voting completed') {
        console.log(data)
        const c = cards
          .filter(({ name }) => data.cards.includes(name))
          .reduce((result, card) => {
            result[card.expansion] = [...(result[card.expansion] || []), card]
            return result
          }, {})
        setResult({ cards: c, logs: data.logs })
      }
    }
    ws.onopen = () => {}
  }, [router.isReady])

  return (
    <>
      {userName && (
        <>
          {!submitted && selections.length === nSelections && (
            <FloatingTop>
              <Button colorScheme="blue" onClick={submitSelections} size="lg">
                投票する
              </Button>
            </FloatingTop>
          )}
          <Layout wide>
            <Text fontSize="xl" fontWeight="600" textAlign="center">
              Room ID: {router.query.roomId} ({nUsers}人, {nSelections}枚)
            </Text>
            <HStack mt={10} mb={6} overflowX="scroll">
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
              {users.length < nUsers && (
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
            <VStack spacing={2} mb={6} align="left">
              {Object.keys(groupedCards).map((expansion) => (
                <div key={`expansion-${expansion}`}>
                  <Text
                    mb={2}
                    fontSize="xl"
                    fontWeight="600"
                    opacity={selections.length === nSelections ? 0.4 : 1}
                    className="no-selectable"
                  >
                    {expansion}
                  </Text>
                  <SimpleGrid mb={3} minChildWidth="90px" spacing={2}>
                    {groupedCards[expansion].map(
                      ({ name, type, cost, description }) => (
                        <Tooltip
                          key={`card-${name}`}
                          hasArrow
                          label={
                            <>
                              <Text>
                                [{cost}] {type}
                              </Text>
                              <Text>{description}</Text>
                            </>
                          }
                          placement="top"
                          bg="gray.100"
                          color="black"
                          shadow={false}
                        >
                          <Center
                            height="50px"
                            border="1px"
                            color={
                              selections.includes(name) ? 'white' : 'black'
                            }
                            bgColor={
                              selections.includes(name)
                                ? submitted
                                  ? 'green.400'
                                  : 'blue.400'
                                : 'transparent'
                            }
                            borderColor={
                              selections.includes(name)
                                ? 'transparant'
                                : 'gray.200'
                            }
                            borderRadius={4}
                            textAlign="center"
                            cursor={
                              submitted ||
                              (selections.length === nSelections &&
                                !selections.includes(name))
                                ? 'auto'
                                : 'pointer'
                            }
                            onClick={(e) => {
                              selectCard(name)
                            }}
                            opacity={
                              selections.length === nSelections &&
                              !selections.includes(name)
                                ? 0.4
                                : 1
                            }
                          >
                            <Text fontSize="sm" className="no-selectable">
                              {Mikan.split(name).map((text, index) => (
                                <span
                                  key={`card-${name}-${index}`}
                                  className="no-break"
                                >
                                  {text}
                                </span>
                              ))}
                            </Text>
                          </Center>
                        </Tooltip>
                      )
                    )}
                  </SimpleGrid>
                </div>
              ))}
            </VStack>
            <HStack spacing={4}>
              <Link href={`/`}>トップページに戻る</Link>
              <Link onClick={clearUserName}>ユーザー名を変更する</Link>
              <Spacer />
            </HStack>
          </Layout>
        </>
      )}
      {!userName && (
        <Layout>
          <Text mb={2} fontSize="xl" fontWeight="600" textAlign="center">
            Room ID: {router.query.roomId} ({nUsers}人, {nSelections}枚)
          </Text>
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
        </Layout>
      )}
      {result && (
        <Modal
          isOpen={result}
          size="xl"
          closeOnEsc={false}
          closeOnOverlayClick={false}
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>集計結果</ModalHeader>
            <ModalBody>
              <UnorderedList>
                {result.logs.map((log, index) => (
                  <ListItem key={`result-log-${index}`}>{log}</ListItem>
                ))}
              </UnorderedList>
              <Box mt={4} mb={8} p={4} bgColor="gray.50">
                <UnorderedList>
                  {Object.keys(result.cards).map((expansion, index) => (
                    <ListItem key={`result-extension-${index}`}>
                      <span>{expansion}から</span>
                      {result.cards[expansion].map(({ name }) => (
                        <span key={`result-card-${name}`}>「{name}」</span>
                      ))}
                    </ListItem>
                  ))}
                </UnorderedList>
                <Text>を選択してゲームを開始してください。</Text>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}
