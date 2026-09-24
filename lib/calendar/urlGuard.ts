/**
 * Gate for URLs that the server will fetch on a caller's behalf. Such a fetch
 * is a server-side request forgery risk by construction: the caller chooses the
 * address, the request leaves from inside our network. This is the check that
 * stands between the two, so it lives on its own and is tested on its own.
 *
 * Known limit: the decision is made on the host NAME, not on the address it
 * resolves to. A public name pointing at 127.0.0.1 passes here. Closing that
 * requires resolving the name and connecting to the checked address, so that
 * the name cannot change meaning between check and request.
 */

const BLOCKED_HOSTS = new Set(["localhost", "ip6-localhost", "ip6-loopback", "0.0.0.0", "::", "::1"]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

const BLOCKED_IPV4 = [
  /^127\./,                        // Loopback
  /^10\./,                         // Privat, Klasse A
  /^192\.168\./,                   // Privat, Klasse C
  /^172\.(1[6-9]|2\d|3[01])\./,    // Privat, Klasse B
  /^169\.254\./,                   // Link-local, deckt auch Cloud-Metadaten 169.254.169.254
  /^0\./,                          // "Dieses Netz"
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-Grade NAT
];

/** fc00::/7 (unique local), fe80::/10 (link-local) und ::ffff:0:0/96 (IPv4-gemappt). */
const BLOCKED_IPV6 = /^(fc|fd|fe8|fe9|fea|feb)|^::ffff:/i;

export type GuardResult = { ok: true; url: URL } | { ok: false; message: string };

export function checkFetchUrl(raw: string): GuardResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, message: "Es wurde keine Adresse angegeben." };

  // webcal:// is how calendar apps hand out subscription links; it is plain
  // https underneath and browsers rewrite it the same way.
  const normalised = trimmed.replace(/^webcal:\/\//i, "https://");

  let url: URL;
  try {
    url = new URL(normalised);
  } catch {
    return { ok: false, message: "Das ist keine gültige Adresse." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: "Nur http- und https-Adressen sind erlaubt." };
  }
  if (url.username || url.password) {
    return { ok: false, message: "Adressen mit Benutzername oder Passwort sind nicht erlaubt." };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, message: "Die Adresse hat keinen Rechnernamen." };
  if (BLOCKED_HOSTS.has(host)) return { ok: false, message: "Adressen im lokalen Netz sind nicht erlaubt." };
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: false, message: "Adressen im lokalen Netz sind nicht erlaubt." };
  }
  if (BLOCKED_IPV4.some((pattern) => pattern.test(host))) {
    return { ok: false, message: "Adressen im lokalen Netz sind nicht erlaubt." };
  }
  if (BLOCKED_IPV6.test(host)) {
    return { ok: false, message: "Adressen im lokalen Netz sind nicht erlaubt." };
  }

  return { ok: true, url };
}
