/**
 * Shared Cloudflare bindings utility.
 *
 * Uses the top-level import from @cloudflare/next-on-pages so the build tool
 * can properly bundle it into the worker. The previous `require()` approach
 * caused "Cannot find module" errors at runtime.
 */
import { getRequestContext } from '@cloudflare/next-on-pages';

interface CloudflareEnv {
  DOPAMINE_KV?: KVNamespace;
  DOPAMINE_AUDIO?: R2Bucket;
}

export function getKV(): KVNamespace | null {
  try {
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_KV ?? null;
  } catch {
    return null;
  }
}

export function getR2(): R2Bucket | null {
  try {
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_AUDIO ?? null;
  } catch {
    return null;
  }
}
