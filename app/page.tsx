import { Chat } from '@/components/chat'
import { getModels } from '@/lib/config/models'
import { generateId } from 'ai'

export default async function Page() {
  const id = generateId()
  const models = await getModels()
  
  console.log('🏠 Home page rendering with ID:', id)
  
  return <Chat id={id} models={models} />
}
