export function buildPostText(surface) {
  const space = Array.from(String(surface ?? '').replace(/\s+/g, ' ').trim()).slice(0, 28).join('') || 'space';
  return `Selling my forehead.\n\nLol. Actually selling ad space on my ${space}. DM me.\n\n@adforehead soon.`;
}

function browserPlatform() {
  return {
    navigator: globalThis.navigator,
    ClipboardItem: globalThis.ClipboardItem,
    open: (...args) => globalThis.window.open(...args),
  };
}

/** Call directly from a click handler with a PNG File prepared before the click. */
export async function shareAd({ file, surface, onStatus, download, platform = browserPlatform() }) {
  if (!file || file.type !== 'image/png') {
    onStatus('Your image is not ready. Please try again.');
    return 'unavailable';
  }
  const text = buildPostText(surface);
  const payload = { files: [file], text };
  const navigator = platform.navigator;
  let nativeShare = false;
  try {
    nativeShare = navigator?.maxTouchPoints > 0 &&
      typeof navigator.share === 'function' &&
      navigator.canShare?.(payload) === true;
  } catch {
    // Unsupported file sharing still allows the X composer and PNG fallback.
  }
  if (nativeShare) {
    try {
      await navigator.share(payload);
      onStatus('');
      return 'native';
    } catch (error) {
      if (error.name === 'AbortError') {
        onStatus('');
        return 'cancelled';
      }
      onStatus('Could not open sharing. Download your image and try again.');
      return 'failed';
    }
  }

  const intent = new URL('https://x.com/intent/tweet');
  intent.searchParams.set('text', text);
  let copied = false;
  // Start the clipboard request in the click handler, while this page is focused.
  // Opening X first can remove focus and prevent the PNG write from completing.
  // X web intents accept text but cannot attach an image automatically.
  try {
    if (navigator?.clipboard?.write && platform.ClipboardItem) {
      await navigator.clipboard.write([new platform.ClipboardItem({ 'image/png': file })]);
      copied = true;
    }
  } catch {
    // Saving the PNG remains available when clipboard access is denied.
  }
  let openFailed = false;
  try {
    platform.open(intent.toString(), '_blank', 'noopener,noreferrer');
    // A null result is normal with noopener and does not prove a blocked popup.
  } catch {
    openFailed = true;
  }
  if (copied) {
    onStatus(openFailed
      ? 'Image copied. Open X and paste it into your post.'
      : 'Image copied. Paste it into your X post.');
    return 'copied';
  }
  try {
    if (download() !== false) {
      onStatus(openFailed
        ? 'PNG saved. Open X and attach it to your post.'
        : 'PNG saved. Attach it to your X post.');
      return 'downloaded';
    }
  } catch {
    // Keep the explicit Download action available if an automatic save fails.
  }
  onStatus('Could not save your image. Use Download and attach it to your X post.');
  return 'failed';
}
