import { fetch as tauriFetch, ResponseType } from "@tauri-apps/api/http";

const MINTAI_MODEL = "mistralai/devstral-2512:free";
const KEY_SOURCE_URL = "https://pastebin.com/raw/ry1bnts8";

let cachedKey: string | null = null;
let inflightKey: Promise<string> | null = null;

export const getMintAiKeySource = () => KEY_SOURCE_URL;

const isTauri = () => typeof window !== "undefined" && "__TAURI_IPC__" in window;

const fetchKey = async () => {
  if (isTauri()) {
    const res = await tauriFetch<string | ArrayBuffer>(KEY_SOURCE_URL, {
      method: "GET",
      responseType: ResponseType.Text,
    });
    if (res.status && res.status >= 400) {
      throw new Error(`MintAI key source returned ${res.status}.`);
    }
    return typeof res.data === "string" ? res.data : "";
  }

  const res = await fetch(KEY_SOURCE_URL);
  if (!res.ok) {
    throw new Error(`MintAI key source returned ${res.status}.`);
  }
  return res.text();
};

export const fetchMintAiKey = async (forceRefresh = false): Promise<string> => {
  if (cachedKey && !forceRefresh) return cachedKey;
  if (inflightKey) return inflightKey;

  inflightKey = (async () => {
    try {
      const text = (await fetchKey()).trim();
      if (!text) {
        throw new Error("MintAI key source returned an empty value.");
      }
      cachedKey = text;
      return text;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to load the MintAI key.";
      throw new Error(message);
    }
  })();

  try {
    return await inflightKey;
  } finally {
    inflightKey = null;
  }
};

export const clearMintAiKeyCache = () => {
  cachedKey = null;
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const callMintAiChat = async (
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string> => {
  const apiKey = await fetchMintAiKey();

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mintflow.dev/mintbalance",
        "X-Title": "MintBalance",
      },
      body: JSON.stringify({
        model: MINTAI_MODEL,
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 400,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "request failed";
    throw new Error(`MintAI request could not be sent (${message}).`);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const errMessage =
      payload?.error?.message ||
      payload?.message ||
      `MintAI request failed with status ${res.status}`;
    throw new Error(errMessage);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text || !text.trim()) {
    throw new Error("MintAI returned an empty response.");
  }

  return text.trim();
};
