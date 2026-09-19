/**
 * Image helper utility for UniMarket
 * Provides guaranteed, non-failing local SVG fallbacks and dynamic backend URL resolution.
 */

// Self-contained, zero-network SVG fallback for product images
export const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#bg)"/>
  <g transform="translate(240, 140)" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="0" y="0" width="120" height="95" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
    <circle cx="40" cy="35" r="9" fill="#94a3b8"/>
    <path d="M12 80 L45 45 L75 70 L92 52 L108 80" stroke="#94a3b8" fill="#e2e8f0"/>
  </g>
  <text x="300" y="285" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#475569">
    UniMarket
  </text>
  <text x="300" y="310" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">
    Ảnh sản phẩm
  </text>
</svg>
`);

// Self-contained avatar fallback
export const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="28" fill="#059669"/>
  <circle cx="50" cy="38" r="18" fill="#ffffff"/>
  <path d="M22 84 C22 66, 38 62, 50 62 C62 62, 78 66, 78 84 Z" fill="#ffffff"/>
</svg>
`);

/**
 * Resolves the backend base URL dynamically
 */
export function getBackendBaseURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // In production on Render without VITE_API_URL, try relative or origin
    return window.location.origin;
  }
  return '';
}

/**
 * Resolves a full, safe image URL
 * @param {string|object|null} url
 * @param {string} fallback
 * @returns {string}
 */
export function getImageUrl(url, fallback = DEFAULT_PRODUCT_IMAGE) {
  if (!url) return fallback;

  // Handle object { url: '...' }
  const raw = typeof url === 'object' ? (url.url || '') : String(url);
  if (!raw || typeof raw !== 'string' || raw.trim() === '') {
    return fallback;
  }

  const trimmed = raw.trim();

  // If already absolute URL, Data URI or blob
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.toLowerCase().startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If relative path
  let normalizedPath = trimmed;
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  const backendBase = getBackendBaseURL();
  return `${backendBase}${normalizedPath}`;
}

/**
 * Image onError handler to replace broken images with safe SVG fallback
 * @param {Event} event 
 * @param {string} fallback 
 */
export function handleImageError(event, fallback = DEFAULT_PRODUCT_IMAGE) {
  const target = event?.currentTarget;
  if (!target) return;

  // Prevent infinite error loops
  if (target.getAttribute('data-error-handled') === 'true') {
    return;
  }

  target.setAttribute('data-error-handled', 'true');
  target.src = fallback;
}
