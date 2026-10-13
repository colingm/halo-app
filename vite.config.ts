import { defineConfig, loadEnv, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import Anthropic from '@anthropic-ai/sdk'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CHAT_MODEL = 'claude-opus-4-8'
const CHAT_SYSTEM_PROMPT =
  'You are Halo Assistant, a friendly in-app AI assistant embedded in Halo, a project/task ' +
  'management SaaS demo. Help the user with questions about tasks, projects, and general ' +
  'productivity topics. Keep responses conversational and reasonably concise.'

/**
 * Dev-only server-side proxy for the Agent Chat feature (src/chat/).
 *
 * The target Anthropic organization has CORS disabled, so a direct
 * browser-to-Anthropic call (the original v1.1 approach) is rejected with a
 * CORS authentication_error regardless of key validity. This plugin makes the
 * Anthropic call from the Vite dev server process instead — a server-to-server
 * request, so CORS never applies — and streams the response back to the
 * browser over same-origin SSE. This is also strictly more secure than the
 * browser-direct approach: ANTHROPIC_API_KEY (no VITE_ prefix, so Vite never
 * exposes it to client code or the bundle) never leaves this Node process.
 *
 * Dev-server-only by design, matching the project's "local dev server is
 * sufficient for demos" constraint (CLAUDE.md) — there is no production
 * server to run this in `vite preview` / a built bundle.
 */
function chatProxyPlugin(apiKey: string | undefined) {
  return {
    name: 'halo-chat-proxy',
    configureServer(server: import('vite').ViteDevServer) {
      const handler: Connect.NextHandleFunction = (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set in .env' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          void (async () => {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')

            try {
              const { messages } = JSON.parse(body) as {
                messages: { role: 'user' | 'assistant'; content: string }[]
              }
              const client = new Anthropic({ apiKey })
              const stream = client.messages.stream({
                model: CHAT_MODEL,
                max_tokens: 1024,
                system: CHAT_SYSTEM_PROMPT,
                messages,
              })
              stream.on('text', (delta) => {
                res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`)
              })
              const finalMessage = await stream.finalMessage()
              const textBlock = finalMessage.content.find((b) => b.type === 'text')
              res.write(`data: ${JSON.stringify({ type: 'done', text: textBlock?.text ?? '' })}\n\n`)
            } catch (err) {
              let errorType = 'unknown'
              let message = 'Something went wrong talking to Claude.'
              if (err instanceof Anthropic.AuthenticationError) {
                errorType = 'authentication_error'
                message = 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.'
              } else if (err instanceof Anthropic.RateLimitError) {
                errorType = 'rate_limit_error'
                message = 'Rate limited by the Claude API. Wait a moment and try again.'
              } else if (err instanceof Anthropic.APIConnectionError) {
                errorType = 'connection_error'
                message = 'The dev server could not reach the Claude API. Check your network connection.'
              } else if (err instanceof Anthropic.APIError) {
                errorType = 'api_error'
                message = `Claude API error (${err.status}): ${err.message}`
              }
              res.write(`data: ${JSON.stringify({ type: 'error', errorType, message })}\n\n`)
            } finally {
              res.end()
            }
          })()
        })
      }

      server.middlewares.use('/api/chat/stream', handler)
    },
  }
}

/**
 * GitHub Pages has no rewrite/redirect mechanism — a hard refresh on a deep
 * link (e.g. `/halo-app/app/reports`) is served whatever file Pages
 * finds at that path, and Pages falls back to `404.html` for any unmatched
 * path. Copying the built `index.html` to `404.html` makes that fallback
 * boot the SPA instead of showing a bare error page.
 */
function pagesFallbackPlugin() {
  let outDir = ''
  return {
    name: 'halo-pages-404-fallback',
    apply: 'build' as const,
    configResolved(config: import('vite').ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: process.env.GITHUB_ACTIONS ? '/halo-app/' : '/',
    plugins: [react(), chatProxyPlugin(env.ANTHROPIC_API_KEY), pagesFallbackPlugin()],
    server: {
      port: 3030,
    },
  }
})
