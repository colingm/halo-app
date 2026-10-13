/**
 * Halo agent chat — Zod schemas.
 *
 * Persistence schema for `K.chat(workspaceId)`. Unlike tasks/teammates, chat
 * messages are never seeded — history starts empty and grows only from real
 * Claude API turns, so there is no ChatFormSchema counterpart.
 */

import { z } from 'zod'

export const ChatRoleEnum = z.enum(['user', 'assistant'])

/** A single chat turn persisted at `K.chat(workspaceId)`. */
export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatRoleEnum,
  content: z.string(),
  createdAt: z.iso.datetime(),
  /** Set when an assistant turn failed (network/API error) instead of completing normally. */
  isError: z.boolean().optional(),
})

/** Array shape of `K.chat(workspaceId)` localStorage value. */
export const ChatMessagesArraySchema = z.array(ChatMessageSchema)
