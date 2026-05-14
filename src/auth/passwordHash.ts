// Module exports: hashPassword, verifyPassword
/**
 * Halo password hashing.
 *
 * Uses the Web Crypto API (SHA-256 via the subtle digest method) — no
 * third-party hash library, no salt (this is a demo app per CLAUDE.md). Output
 * is a 64-character lowercase hex string suitable for storing in the
 * `Visitor.passwordHash` field validated by `VisitorSchema`. NOT
 * cryptographically appropriate for real auth — Halo is a Pendo demo surface,
 * not a production product (per REQUIREMENTS.md "Out of Scope: Real
 * authentication").
 *
 * Available natively in browsers and in Node ≥ 16 via `globalThis.crypto`.
 */

/** Compiled once — `verifyPassword` short-circuits on any non-64-lowercase-hex input. */
const HEX_64_RE = /^[0-9a-f]{64}$/

/**
 * Hash a plaintext password with SHA-256 and return the lowercase-hex digest.
 *
 * The output is always 64 characters and matches `/^[0-9a-f]{64}$/`. Same
 * input → same output (determinism is a tested invariant).
 *
 * @example
 *   await hashPassword('hunter2')
 *   // → 'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7'
 */
export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password)
  const buf = await globalThis.crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify a plaintext password against a stored hex SHA-256 hash.
 *
 * Returns `false` (never throws) if `expectedHash` is not a 64-character
 * lowercase-hex string — defense against tampered or corrupted stored hashes.
 *
 * The equality check is length-prefixed and does NOT early-exit on the first
 * mismatching byte: the loop XORs each character-code pair into an accumulator
 * and only inspects the result after walking both strings to their declared
 * length. True constant-time comparison is impossible in JS without WASM (the
 * JIT can still reorder), but this explicit loop discourages timing-attack
 * accidents introduced by `===` short-circuiting.
 */
export async function verifyPassword(
  password: string,
  expectedHash: string,
): Promise<boolean> {
  // Short-circuit: any non-hex / wrong-length stored value fails verification.
  if (typeof expectedHash !== 'string' || !HEX_64_RE.test(expectedHash)) {
    return false
  }

  const actualHash = await hashPassword(password)

  if (actualHash.length !== expectedHash.length) {
    return false
  }

  let acc = 0
  for (let i = 0; i < actualHash.length; i++) {
    acc |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  return acc === 0 && actualHash.length === expectedHash.length
}
