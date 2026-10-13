import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Paper,
  Stack,
  Group,
  Text,
  ScrollArea,
  ActionIcon,
  Loader,
  Alert,
} from '@mantine/core'
import { IconX, IconTrash, IconSend, IconAlertCircle } from '@tabler/icons-react'
import { Button, Textarea } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { useAuthStore } from '../auth'
import { listMessages, appendMessage, clearMessages } from './chatRepo'
import { streamChatReply, describeChatError } from './claudeClient'
import type { ChatMessage } from './types'

interface ChatPanelProps {
  onClose: () => void
}

/**
 * Agent chat panel — message history + input, wired to the real Claude API.
 * Rendered inside an Affix by ChatLauncher; persists across all /app/* routes
 * via ChatLauncher's own mount point in AppLayout.
 */
export function ChatPanel({ onClose }: ChatPanelProps): React.JSX.Element {
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    workspaceId ? listMessages(workspaceId) : [],
  )
  const [draft, setDraft] = useState('')
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  const canSend = draft.trim().length > 0 && !isSending && !!workspaceId

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  const history = useMemo(() => messages, [messages])

  async function handleSend() {
    if (!workspaceId || !canSend) return
    const text = draft.trim()
    setDraft('')
    setErrorText(null)

    const userMessage = appendMessage(workspaceId, { role: 'user', content: text })
    const nextHistory = [...history, userMessage]
    setMessages(nextHistory)

    if (typeof pendo !== 'undefined') {
      pendo.track('agent_chat_message_sent', { messageLength: text.length })
    }

    setIsSending(true)
    setStreamingText('')
    try {
      const fullReply = await streamChatReply(nextHistory, (chunk) =>
        setStreamingText((prev) => (prev ?? '') + chunk),
      )
      const assistantMessage = appendMessage(workspaceId, { role: 'assistant', content: fullReply })
      setMessages((prev) => [...prev, assistantMessage])
      if (typeof pendo !== 'undefined') {
        pendo.track('agent_chat_response_received', { messageLength: fullReply.length })
      }
    } catch (err) {
      const description = describeChatError(err)
      setErrorText(description)
      const errorMessage = appendMessage(workspaceId, {
        role: 'assistant',
        content: description,
        isError: true,
      })
      setMessages((prev) => [...prev, errorMessage])
      if (typeof pendo !== 'undefined') {
        pendo.track('agent_chat_error', { reason: description })
      }
    } finally {
      setStreamingText(null)
      setIsSending(false)
    }
  }

  function handleClear() {
    if (!workspaceId) return
    clearMessages(workspaceId)
    setMessages([])
    setErrorText(null)
    if (typeof pendo !== 'undefined') pendo.track('agent_chat_cleared', {})
  }

  function handleClose() {
    if (typeof pendo !== 'undefined') pendo.track('agent_chat_closed', {})
    onClose()
  }

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      w={380}
      h={520}
      data-pendo-id={PENDO_IDS.agentChat.panel.container}
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Text fw={600} size="sm">Halo Assistant</Text>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Start a new conversation"
            data-pendo-id={PENDO_IDS.agentChat.panel.clearButton}
            onClick={handleClear}
          >
            <IconTrash size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Close chat"
            data-pendo-id={PENDO_IDS.agentChat.panel.closeButton}
            onClick={handleClose}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <ScrollArea
        style={{ flex: 1 }}
        p="md"
        viewportRef={viewportRef}
        data-pendo-id={PENDO_IDS.agentChat.panel.messageList}
      >
        <Stack gap="sm">
          {messages.length === 0 && streamingText === null && (
            <Text size="sm" c="dimmed" ta="center" mt="xl">
              Ask Halo Assistant anything about your tasks and projects.
            </Text>
          )}
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {streamingText !== null && (
            <ChatBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingText,
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
        </Stack>
      </ScrollArea>

      {errorText && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          mx="md"
          mb="xs"
          py={6}
          data-pendo-id={PENDO_IDS.agentChat.panel.errorState}
        >
          <Text size="xs">{errorText}</Text>
        </Alert>
      )}

      <Group gap="xs" p="md" pt="xs" align="flex-end" wrap="nowrap">
        <Textarea
          pendoId={PENDO_IDS.agentChat.panel.input}
          placeholder="Message Halo Assistant..."
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          autosize
          minRows={1}
          maxRows={4}
          style={{ flex: 1 }}
        />
        <Button
          pendoId={PENDO_IDS.agentChat.panel.sendButton}
          onClick={() => void handleSend()}
          disabled={!canSend}
          px={10}
        >
          {isSending ? <Loader size={16} color="white" /> : <IconSend size={16} />}
        </Button>
      </Group>
    </Paper>
  )
}

function ChatBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage
  isStreaming?: boolean
}): React.JSX.Element {
  const isUser = message.role === 'user'
  return (
    <Group justify={isUser ? 'flex-end' : 'flex-start'} data-pendo-id={PENDO_IDS.agentChat.panel.messageRow} data-pendo-message-id={message.id}>
      <Paper
        p="xs"
        radius="md"
        maw="85%"
        bg={isUser ? 'indigo.6' : message.isError ? 'red.0' : 'gray.1'}
        c={isUser ? 'white' : undefined}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
          {isStreaming && message.content.length === 0 ? '…' : ''}
        </Text>
      </Paper>
    </Group>
  )
}
