import { toPng } from "html-to-image";

async function renderNodeToDataUrl(node: HTMLElement): Promise<string> {
  return toPng(node, { pixelRatio: 2 });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

// navigator.share existing is NOT a reliable "is this mobile" signal —
// confirmed by real testing that desktop Chrome on Windows also exposes
// navigator.share/canShare (OS-level share integration) and canShare()
// returns true for files there too. Calling share() on that desktop path
// resolves "successfully" without producing any file the seller can find,
// which was the actual cause of "Invoice download works on phone but not
// desktop Chrome" — canShare() alone can't tell the two apart, so we also
// gate on an actual mobile signal.
function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
    .userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// Renders the node and downloads it directly from the data: URL html-to-image
// produces — deliberately skips the extra fetch()/blob()/ObjectURL detour a
// File-based download needs. Every additional await between the click and
// the actual browser download call widens the window in which strict
// browsers (desktop Chrome especially) drop the "recent user gesture" a
// programmatic download relies on; this keeps that window as small as it
// can be when we don't also need a File (i.e. no Web Share involved).
export async function renderAndDownload(
  node: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await renderNodeToDataUrl(node);
  downloadDataUrl(dataUrl, filename);
}

// Renders the node and hands it to the user via Web Share where the
// platform actually supports file sharing (checked with a cheap synchronous
// capability check before paying for the extra File conversion) — falls
// back to a direct download otherwise, or if share() fails for any reason
// other than an explicit user cancel (AbortError).
export async function renderAndShare(
  node: HTMLElement,
  filename: string,
  title: string
): Promise<void> {
  const dataUrl = await renderNodeToDataUrl(node);

  const canShareAtAll =
    isLikelyMobile() && typeof navigator !== "undefined" && typeof navigator.share === "function";
  if (!canShareAtAll) {
    downloadDataUrl(dataUrl, filename);
    return;
  }

  const file = await dataUrlToFile(dataUrl, filename);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      // Anything else (lost activation, permission failure, etc.) falls
      // through to a direct download rather than doing nothing.
    }
  }

  downloadDataUrl(dataUrl, filename);
}
