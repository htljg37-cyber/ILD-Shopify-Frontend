// Reads the visitor's Google Analytics IDs from the GA cookies so they can be
// carried into the Shopify checkout (as hidden cart attributes). The checkout
// pixel then records the purchase under the same visitor and session, which
// keeps the sale credited to the channel that brought the visitor in.

const GA_MEASUREMENT_ID = 'G-PZM0NJ987N';

export const GA_CLIENT_ID_ATTRIBUTE = '_ga_client_id';
export const GA_SESSION_ID_ATTRIBUTE = '_ga_session_id';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

// _ga = "GA1.1.123456789.1698765432" -> "123456789.1698765432"
function getClientId(): string | null {
  const value = readCookie('_ga');
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

// _ga_<ID> = "GS1.1.1698765432.5.1..."      -> "1698765432"
//          = "GS2.1.s1698765432$o5$g1$t..." -> "1698765432"
function getSessionId(): string | null {
  const value = readCookie(`_ga_${GA_MEASUREMENT_ID.replace(/^G-/, '')}`);
  if (!value) return null;
  const parts = value.split('.');
  const segment = parts[2] || '';
  if (segment.startsWith('s')) {
    const id = segment.slice(1).split('$')[0];
    return /^\d+$/.test(id) ? id : null;
  }
  return /^\d+$/.test(segment) ? segment : null;
}

export function getGaCheckoutAttributes(): {key: string; value: string}[] {
  const attributes: {key: string; value: string}[] = [];
  const clientId = getClientId();
  const sessionId = getSessionId();
  if (clientId) attributes.push({key: GA_CLIENT_ID_ATTRIBUTE, value: clientId});
  if (sessionId) attributes.push({key: GA_SESSION_ID_ATTRIBUTE, value: sessionId});
  return attributes;
}

// For cart permalinks (/cart/<variant>:<qty>,...), which accept attributes as
// query parameters.
export function appendGaAttributesToUrl(url: string): string {
  const attributes = getGaCheckoutAttributes();
  if (attributes.length === 0) return url;
  const query = attributes
    .map(({key, value}) => `attributes[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`)
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}
