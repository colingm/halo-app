/// <reference types="vite/client" />

declare var pendo: any;

// Note: the Agent Chat feature's ANTHROPIC_API_KEY deliberately has NO VITE_
// prefix and is read server-side only, in vite.config.ts's dev proxy plugin
// (via `loadEnv`) — never through `import.meta.env` in client code. See
// src/chat/claudeClient.ts for why (CORS + key-exposure rationale).
