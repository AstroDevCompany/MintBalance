import { fetch as tauriFetch, ResponseType } from "@tauri-apps/api/http";

const LICENSE_SOURCE_URL = "https://pastebin.com/raw/puea5vNm";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_IPC__" in window;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  // Fallback for environments without btoa
  const uint8Array = new TextEncoder().encode(binary);
  let result = "";
  uint8Array.forEach((byte) => {
    result += String.fromCharCode(byte);
  });
  return result.split("").map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
};

const fromBase64 = (b64: string) => {
  let binary = "";
  if (typeof atob !== "undefined") {
    binary = atob(b64);
  } else {
    // Fallback for environments without atob
    for (let i = 0; i < b64.length; i += 1) {
      binary += String.fromCharCode(b64.charCodeAt(i));
    }
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getFingerprint = () => {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const lang = nav?.language ?? "";
    const ua = nav?.userAgent ?? "";
    const platform = nav?.platform ?? "";
    const vendor = nav?.vendor ?? "";
    const screen =
      typeof window !== "undefined" && window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : "";
    const raw = `${platform}|${lang}|${tz}|${ua}|${vendor}|${screen}`;
    return textEncoder.encode(raw);
  } catch {
    return textEncoder.encode("mintbalance-default-fingerprint");
  }
};

const deriveDeviceKey = async () => {
  const fp = getFingerprint();
  const hash = await crypto.subtle.digest("SHA-256", fp);
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

const encryptForDevice = async (plain: string) => {
  const key = await deriveDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plain)
  );
  const payload = new Uint8Array(iv.length + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.length);
  return toBase64(payload);
};

const decryptForDevice = async (token: string): Promise<string | null> => {
  try {
    const payload = fromBase64(token);
    if (payload.length < 13) return null;
    const iv = payload.slice(0, 12);
    const data = payload.slice(12);
    const key = await deriveDeviceKey();
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return textDecoder.decode(plain);
  } catch {
    return null;
  }
};

const fetchLicenseCode = async (): Promise<string> => {
  if (isTauri()) {
    const res = await tauriFetch<string | ArrayBuffer>(LICENSE_SOURCE_URL, {
      method: "GET",
      responseType: ResponseType.Text,
    });
    if (res.status && res.status >= 400) {
      throw new Error(`License server returned ${res.status}.`);
    }
    return typeof res.data === "string" ? res.data : "";
  }

  const res = await fetch(LICENSE_SOURCE_URL);
  if (!res.ok) {
    throw new Error(`License server returned ${res.status}.`);
  }
  return res.text();
};

export const verifyLicenseKey = async (
  input: string
): Promise<{ token: string }> => {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a license key to continue.");

  const activeCode = (await fetchLicenseCode()).trim();
  if (!activeCode)
    throw new Error("License service unavailable. Try again soon.");
  if (trimmed !== activeCode) {
    throw new Error("Invalid license key.");
  }

  const token = await encryptForDevice(trimmed);
  return { token };
};

export const validateStoredLicense = async (
  token: string
): Promise<boolean> => {
  if (!token) return false;
  const decrypted = await decryptForDevice(token);
  if (!decrypted) return false;
  try {
    const activeCode = (await fetchLicenseCode()).trim();
    if (!activeCode) return false;
    return decrypted === activeCode;
  } catch {
    return false;
  }
};

export const clearLicenseToken = () => null;
