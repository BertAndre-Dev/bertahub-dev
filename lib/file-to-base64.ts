const IMAGE_EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const FILE_EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
};

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

/** Infer MIME when the browser reports empty or generic types (e.g. WebP as octet-stream). */
export function inferFileMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const ext = extensionOf(file);
  return IMAGE_EXT_MIME[ext] ?? FILE_EXT_MIME[ext] ?? (file.type || "application/octet-stream");
}

function withMimeType(dataUrl: string, mimeType: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl;
  const payload = dataUrl.slice(comma + 1);
  return `data:${mimeType};base64,${payload}`;
}

/** Read a file as a full data URL, e.g. `data:image/png;base64,...`. */
export function fileToBase64(file: File): Promise<string> {
  const mimeType = inferFileMimeType(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result) {
        reject(new Error("Failed to read file."));
        return;
      }
      resolve(withMimeType(result, mimeType));
    };
    reader.readAsDataURL(file);
  });
}

/** Read a file as raw base64 payload (no `data:*;base64,` prefix). */
export function fileToBase64Payload(file: File): Promise<string> {
  return fileToBase64(file).then((dataUrl) => {
    const i = dataUrl.indexOf("base64,");
    return i >= 0 ? dataUrl.slice(i + "base64,".length) : dataUrl;
  });
}
