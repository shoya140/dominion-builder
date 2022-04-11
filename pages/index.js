import { Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'

import Layout from '../components/layout'

export default function Home() {
  const router = useRouter()

  const createNewRoom = () => {
    router.push(`/${uuidv4().substring(0, 8)}/`)
  }

  return (
    <Layout>
      <Button onClick={createNewRoom}>Create New Room</Button>
    </Layout>
  )
}
