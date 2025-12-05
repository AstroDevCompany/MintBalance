import { useCallback, useEffect } from "react";
import { useUpdateStore } from "../store/useUpdateStore";

const VERSION_URL =
  "https://raw.githubusercontent.com/AstroDevCompany/mint-update-links/refs/heads/main/mintbalance.ini";

const isNewerVersion = (current: string, latest: string) => {
  const curParts = current.split(".").map((p) => Number(p) || 0);
  const latestParts = latest.split(".").map((p) => Number(p) || 0);
  const len = Math.max(curParts.length, latestParts.length);
  for (let i = 0; i < len; i += 1) {
    const c = curParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const useUpdateCheck = (currentVersion: string) => {
  const {
    latestVersion,
    available,
    checking,
    checked,
    error,
    startCheck,
    finishCheck,
    failCheck,
  } = useUpdateStore();

  const checkForUpdates = useCallback(async () => {
    startCheck();
    try {
      const res = await fetch(VERSION_URL, { cache: "no-store" });
      if (!res.ok)
        throw new Error(`Failed to fetch latest version (${res.status})`);
      const text = (await res.text()).trim();
      const newer = text ? isNewerVersion(currentVersion, text) : false;
      finishCheck(text || currentVersion, newer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to check for updates";
      failCheck(message);
    }
  }, [currentVersion, failCheck, finishCheck, startCheck]);

  useEffect(() => {
    if (!checked && !checking) {
      checkForUpdates();
    }
  }, [checkForUpdates, checked, checking]);

  return {
    latestVersion,
    available,
    checking,
    checked,
    error,
    checkForUpdates,
  };
};
