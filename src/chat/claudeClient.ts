/**
 * Halo agent chat — Claude API client.
 *
 * Talks to the same-origin dev-server proxy at `/api/chat/stream` (see
 * vite.config.ts) rather than calling Anthropic directly from the browser.
 * The original v1.1 approach used `dangerouslyAllowBrowser` for a direct
 * browser-to-Anthropic call, but the target Anthropic organization has CORS
 * disabled — every browser-origin request is rejected with a CORS
 * `authentication_error` regardless of key validity. Routing through the Vite
 * dev server (a server-to-server call to Anthropic) sidesteps CORS entirely
 * and is also strictly more secure: `ANTHROPIC_API_KEY` never reaches the
 * browser or the bundle (see PROJECT.md "Key Decisions").
 *
 * This module owns no localStorage — chatRepo persists history, this module
 * only talks to the proxy.
 */

import type { ChatMessage } from './types'

type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string }
  | { type: 'error'; errorType: string; message: string }

/** Thrown when the dev server has no ANTHROPIC_API_KEY configured. */
export class ChatNotConfiguredError extends Error {
  constructor() {
    super('Agent chat has no Anthropic API key configured. Copy .env.example to .env and set ANTHROPIC_API_KEY, then restart the dev server.')
    this.name = 'ChatNotConfiguredError'
  }
}

/** Wraps a classified error surfaced by the chat proxy (see vite.config.ts). */
export class ChatProxyError extends Error {
  constructor(
    public readonly errorType: string,
    message: string,
  ) {
    super(message)
    this.name = 'ChatProxyError'
  }
}

/**
 * Send the conversation history to the chat proxy and stream the assistant's reply.
 *
 * @param history - prior turns, oldest first, including the in-flight user turn
 * @param onDelta - called with each incremental text chunk as it streams in
 * @returns the full assistant reply text once the stream completes
 * @throws ChatNotConfiguredError if the dev server has no API key set,
 *   ChatProxyError for a classified Anthropic API failure, or a generic Error
 *   for a network/parse failure talking to the proxy itself.
 */
export async function streamChatReply(
  history: ChatMessage[],
  onDelta: (chunk: string) => void,
): Promise<string> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (response.status === 500) {
    throw new ChatNotConfiguredError()
  }
  if (!response.ok || !response.body) {
    throw new Error(`Chat proxy responded with HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const line of events) {
      if (!line.startsWith('data: ')) continue
      const payload = JSON.parse(line.slice('data: '.length)) as ChatStreamEvent
      if (payload.type === 'delta') {
        fullText += payload.text
        onDelta(payload.text)
      } else if (payload.type === 'done') {
        fullText = payload.text
      } else if (payload.type === 'error') {
        throw new ChatProxyError(payload.errorType, payload.message)
      }
    }
  }

  return fullText
}

/** Human-readable message for a caught error, for display in the chat panel. */
export function describeChatError(err: unknown): string {
  if (err instanceof ChatNotConfiguredError) return err.message
  if (err instanceof ChatProxyError) return err.message
  return 'Something went wrong sending that message. Please try again.'
}
