import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(path,"utf8");
function files(path:string):string[]{return readdirSync(path).flatMap(name=>{const full=join(path,name);return statSync(full).isDirectory()?files(full):[full]})}
test("Workspace client imports only the serializable workspace model",()=>{const source=read("app/Workspace.tsx");assert.match(source,/from "\.\.\/lib\/workspace-model"/);assert.doesNotMatch(source,/workspace-data|supabase\/server|auth\/session|next\/headers|safe-db-log/)});
test("server modules are guarded by server-only",()=>{for(const path of ["lib/workspace-data.ts","lib/auth/session.ts","lib/supabase/server.ts","lib/supabase/admin.ts","lib/safe-db-log.ts","lib/persistence-container.ts","lib/intelligence/container.ts"])assert.match(read(path),/import "server-only"/)});
test("browser Supabase client contains no server cookies or private key",()=>{const source=read("lib/supabase/browser.ts");assert.doesNotMatch(source,/next\/headers|cookies\(|SUPABASE_SERVICE_ROLE_KEY|node:async_hooks|AsyncLocalStorage/);assert.match(source,/createBrowserClient/)});
test("client bundle excludes Node async context and server cookie parser",()=>{const assets=files("dist/client/assets").filter(path=>path.endsWith(".js"));const client=assets.map(read).join("\n");assert.doesNotMatch(client,/node:async_hooks|parse-cookie-header|AsyncLocalStorage is not a constructor|SUPABASE_SERVICE_ROLE_KEY/)});
test("auth remains server-side with logout and unauthenticated redirect",()=>{assert.match(read("app/auth/actions.ts"),/signOut\(\)/);const proxy=read("proxy.ts");assert.match(proxy,/getUser\(\)/);assert.match(proxy,/pathname="\/login"/)});
