import type { z } from 'zod'
import type { ChatMessageSchema, ChatRoleEnum } from './schemas'

export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatRole = z.infer<typeof ChatRoleEnum>
