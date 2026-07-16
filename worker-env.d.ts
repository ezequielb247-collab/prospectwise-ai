interface Fetcher { fetch(input: Request): Promise<Response> }
interface D1Database { prepare(query: string): unknown; batch(statements: unknown[]): Promise<unknown> }
declare module "cloudflare:workers" { export const env: { DB: D1Database } }
