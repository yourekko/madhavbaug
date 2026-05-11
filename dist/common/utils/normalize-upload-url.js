"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublicUploadPhotoUrl = normalizePublicUploadPhotoUrl;
function normalizePublicUploadPhotoUrl(stored) {
    if (stored == null)
        return null;
    const s = String(stored).trim();
    if (!s)
        return null;
    try {
        const parsed = /^https?:\/\//i.test(s)
            ? new URL(s)
            : s.startsWith('//')
                ? new URL(`https:${s}`)
                : new URL(s.startsWith('/') ? s : `/${s}`, 'https://placeholder.invalid');
        if (parsed.pathname.startsWith('/uploads/')) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
    }
    catch {
        return s;
    }
    return s;
}
//# sourceMappingURL=normalize-upload-url.js.map