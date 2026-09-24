// Run with Node 22+: node --test lib/calendar/urlGuard.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkFetchUrl } from "./urlGuard.ts";

const blocked = (value) => {
  const result = checkFetchUrl(value);
  assert.equal(result.ok, false, `${value} hätte abgelehnt werden müssen`);
};
const allowed = (value) => {
  const result = checkFetchUrl(value);
  assert.equal(result.ok, true, `${value} hätte erlaubt sein müssen`);
  return result.url;
};

test("erlaubt gewöhnliche öffentliche Kalenderadressen", () => {
  allowed("https://calendar.google.com/calendar/ical/abc/basic.ics");
  allowed("http://example.org/plan.ics");
  allowed("https://p01-calendars.icloud.com/published/2/MTIz");
});

test("schreibt webcal auf https um", () => {
  const url = allowed("webcal://example.org/plan.ics");
  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "example.org");
});

test("lehnt fremde Protokolle ab", () => {
  blocked("file:///etc/passwd");
  blocked("ftp://example.org/plan.ics");
  blocked("gopher://example.org/");
  blocked("data:text/calendar,BEGIN:VCALENDAR");
});

test("lehnt Loopback in allen Schreibweisen ab", () => {
  blocked("http://localhost:3000/plan.ics");
  blocked("http://LOCALHOST/plan.ics");
  blocked("http://127.0.0.1/plan.ics");
  blocked("http://127.1.2.3/plan.ics");
  blocked("http://[::1]/plan.ics");
  blocked("http://0.0.0.0/plan.ics");
});

test("lehnt private Netzbereiche ab", () => {
  blocked("http://10.0.0.5/plan.ics");
  blocked("http://192.168.188.91:3000/plan.ics");
  blocked("http://172.16.0.1/plan.ics");
  blocked("http://172.31.255.254/plan.ics");
  blocked("http://100.64.0.1/plan.ics");
});

test("lehnt Cloud-Metadaten und Link-local ab", () => {
  // Der klassische Weg, an Zugangsdaten einer Cloud-Instanz zu kommen.
  blocked("http://169.254.169.254/latest/meta-data/");
  blocked("http://[fe80::1]/plan.ics");
  blocked("http://[fd00::1]/plan.ics");
});

test("erlaubt öffentliche Adressen, die privaten nur ähneln", () => {
  // 172.32. liegt bereits außerhalb von 172.16.0.0/12.
  allowed("http://172.32.0.1/plan.ics");
  allowed("http://11.0.0.1/plan.ics");
  allowed("http://100.63.255.255/plan.ics");
  allowed("https://not-localhost.example.org/plan.ics");
});

test("lehnt interne Namensräume ab", () => {
  blocked("http://db.internal/plan.ics");
  blocked("http://nas.local/plan.ics");
  blocked("http://router.home.arpa/plan.ics");
  blocked("http://foo.localhost/plan.ics");
});

test("lehnt eingebettete Zugangsdaten ab", () => {
  // Klassische Verschleierung: alles vor dem @ ist kein Rechnername.
  blocked("https://example.org@127.0.0.1/plan.ics");
  blocked("https://user:pass@example.org/plan.ics");
});

test("lehnt Leeres und Unsinn ab", () => {
  blocked("");
  blocked("   ");
  blocked("kein-schema");
});
