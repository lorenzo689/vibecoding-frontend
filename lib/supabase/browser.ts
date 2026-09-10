import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, publicKey } = getSupabaseConfig();
    browserClient = createBrowserClient(url, publicKey);
  }
  return browserClient;
}
