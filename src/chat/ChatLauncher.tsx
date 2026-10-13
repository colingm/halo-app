import React, { useState } from 'react'
import { Affix, ActionIcon } from '@mantine/core'
import { IconMessageChatbot, IconX } from '@tabler/icons-react'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { ChatPanel } from './ChatPanel'

/**
 * Floating agent-chat launcher, mounted once in AppLayout alongside <Outlet/>
 * so it persists across every authenticated route (first floating-UI pattern
 * in the codebase — see v1.1 research; Help has no analogous launcher).
 */
export function ChatLauncher(): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }} zIndex={200}>
        <ActionIcon
          size={52}
          radius="xl"
          variant="filled"
          color="indigo"
          aria-label={open ? 'Close Halo Assistant' : 'Open Halo Assistant'}
          data-pendo-id={PENDO_IDS.agentChat.launcher}
          onClick={() => {
            const next = !open
            setOpen(next)
            if (next && typeof pendo !== 'undefined') {
              pendo.track('agent_chat_opened', {})
            }
          }}
        >
          {open ? <IconX size={24} /> : <IconMessageChatbot size={26} />}
        </ActionIcon>
      </Affix>

      {open && (
        <Affix position={{ bottom: 84, right: 20 }} zIndex={200}>
          <ChatPanel onClose={() => setOpen(false)} />
        </Affix>
      )}
    </>
  )
}
