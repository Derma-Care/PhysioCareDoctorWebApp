function toDataUrl(input) {
  // Accepts: binary string, base64 string, ArrayBuffer, Uint8Array
  let bytes;

  if (input instanceof Uint8Array) {
    bytes = input;
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else if (typeof input === 'string') {
    const s = input.trim().replace(/^'+|'+$/g, ''); // strip stray quotes if present

    // try base64
    try {
      const decoded = atob(s);
      // if decode works and re-encode matches (ignoring padding), treat as base64
      if (btoa(decoded).replace(/=+$/, '') === s.replace(/=+$/, '')) {
        bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
      } else {
        // fall through to binary-string path
      }
    } catch {
      // not base64; treat as binary string
    }

    if (!bytes) {
      // binary string -> bytes
      bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    }
  } else {
    throw new Error('Unsupported input type for toDataUrl');
  }

  // detect mime by magic number
  let mime = 'image/*';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) mime = 'image/png';
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = 'image/jpeg';
  else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) mime = 'image/gif';
  else if (bytes[0] === 0x42 && bytes[1] === 0x4d) mime = 'image/bmp';
  else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
           bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) mime = 'image/webp';

  // bytes -> base64
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);

  return `data:${mime};base64,${b64}`;
}
