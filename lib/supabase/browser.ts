"use client";
import {createBrowserClient} from "@supabase/ssr";
import {publicSupabaseConfig} from "./config";
let client:ReturnType<typeof createBrowserClient>|undefined;
export function createSupabaseBrowserClient(){const {url,key}=publicSupabaseConfig();return client??=createBrowserClient(url,key)}
