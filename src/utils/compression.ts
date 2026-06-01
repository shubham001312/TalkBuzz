/**
 * TalkBuzz Secure Transit Compression Utilities
 * Compresses data at the sender side and decompresses at the receiver side
 * for chat messages, audio recordings, images, and other payloads.
 */

export async function compressData(plainText: string): Promise<string> {
  if (typeof window === 'undefined' || !('CompressionStream' in window)) {
    return "FALLBACK:" + plainText;
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      }
    });
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    
    const reader = compressedStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return "COMPRESSED_GZIP:" + window.btoa(binary);
  } catch (error) {
    console.error("Compression error:", error);
    return "FALLBACK:" + plainText;
  }
}

export async function decompressData(payload: string): Promise<string> {
  if (!payload) return '';
  
  if (payload.startsWith("FALLBACK:")) {
    return payload.substring(9);
  }
  
  if (!payload.startsWith("COMPRESSED_GZIP:")) {
    return payload;
  }
  
  const base64Data = payload.substring(16);
  if (typeof window === 'undefined' || !('DecompressionStream' in window)) {
    console.warn("DecompressionStream is unsupported in this environment.");
    return base64Data;
  }
  
  try {
    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    
    const reader = decompressedStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(combined);
  } catch (error) {
    console.error("Decompression error, fallback to raw base64:", error);
    return base64Data;
  }
}
