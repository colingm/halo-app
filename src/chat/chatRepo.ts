/**
 * Halo agent chat repo — owner of `K.chat(workspaceId)`.
 *
 * Every read goes through `readWithSchema` so corrupt/tampered storage falls
 * through to `[]` rather than crashing the app, matching `tasksRepo.ts`.
 */

import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { ChatMessagesArraySchema } from './schemas'
import type { ChatMessage, ChatRole } from './types'

/** Return all persisted chat messages for `workspaceId`, oldest first. */
export function listMessages(workspaceId: string): ChatMessage[] {
  return readWithSchema(K.chat(workspaceId), ChatMessagesArraySchema, [] as ChatMessage[])
}

/** Append a new message and return it. The repo fills `id` and `createdAt`. */
export function appendMessage(
  workspaceId: string,
  input: { role: ChatRole; content: string; isError?: boolean },
): ChatMessage {
  const message: ChatMessage = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  const existing = listMessages(workspaceId)
  writeJSON(K.chat(workspaceId), [...existing, message])
  return message
}

/** Clear all chat history for `workspaceId` (used by the "New conversation" action). */
export function clearMessages(workspaceId: string): void {
  writeJSON(K.chat(workspaceId), [])
}
