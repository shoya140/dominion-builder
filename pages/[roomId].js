import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { Button, Select, VStack } from '@chakra-ui/react'

import Layout from '../components/layout'
import cards from '../lib/cards.json'

const backendURL = process.env.BACKEND_URL
  ? process.env.BACKEND_URL
  : 'ws://localhost:8000'

const userId = uuidv4().substring(0, 8)
let ws

export default function Room() {
  const [selections, setSelections] = useState(['おまかせ', 'おまかせ'])
  const [submitted, setSubmitted] = useState(false)
  const [users, setUsers] = useState([])

  const router = useRouter()

  const submitSelections = () => {
    setSubmitted(true)
    ws.send(
      JSON.stringify({
        event_type: 'submit selections',
        selections: selections,
      })
    )
  }

  const updateSelection = (selectionIndex, newValue) => {
    setSelections(
      [...selections].map((value, index) => {
        return index === selectionIndex ? newValue : value
      })
    )
  }

  useEffect(() => {
    if (!router.isReady) {
      return
    }

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
      <ul>
        {users.map(({ userName, submitted }, index) => (
          <li key={`user-${index}`}>
            {userName} - {submitted ? '選択完了' : '選択中'}
          </li>
        ))}
      </ul>
      <VStack>
        {[0, 1].map((selectionIndex) => (
          <Select
            key={`selection-${selectionIndex}`}
            placeholder="カードを選択してください"
            onChange={(e) => {
              updateSelection(selectionIndex, e.target.value)
            }}
            disabled={submitted}
          >
            {cards.map(({ name, extension }) => (
              <option key={`card-${selectionIndex}-${name}`} value={name}>
                {extension} - {name}
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
      <Link href={`/`}>
        <a>Home</a>
      </Link>
    </Layout>
  )
}
