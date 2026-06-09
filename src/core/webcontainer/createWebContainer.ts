export type WebContainerUnavailable = {
  ok: false;
  reason: string;
};

export type WebContainerReady = {
  ok: true;
  instance: import("@webcontainer/api").WebContainer;
};

export type WebContainerResult = WebContainerReady | WebContainerUnavailable;

export function isWebContainerLikelySupported(): boolean {
  return typeof window !== "undefined" && "SharedArrayBuffer" in window && window.crossOriginIsolated;
}

export async function createWebContainer(): Promise<WebContainerResult> {
  if (!isWebContainerLikelySupported()) {
    return {
      ok: false,
      reason:
        "This browser context is not cross-origin isolated, so WebContainer measurement is unavailable."
    };
  }

  try {
    const { WebContainer } = await import("@webcontainer/api");
    return {
      ok: true,
      instance: await WebContainer.boot()
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "WebContainer failed to boot."
    };
  }
}
