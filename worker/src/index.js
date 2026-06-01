const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Festival dates in BST (UTC+1)
const DATE_MAP = { fri: '2026-06-19', sat: '2026-06-20', sun: '2026-06-21' };

// Convert a festival day + BST time string to a UTC ICS timestamp.
// Times with hour < 6 belong to the next calendar day (same "night").
function toUTC(day, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  let date = DATE_MAP[day];

  // Advance calendar date for post-midnight acts
  if (h < 6) {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    date = d.toISOString().split('T')[0];
  }

  // BST = UTC+1 — subtract 1 hour; handle midnight rollback
  let utcDate = date;
  if (h - 1 < 0) {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    utcDate = d.toISOString().split('T')[0];
  }
  const utcH = ((h - 1) + 24) % 24;

  return `${utcDate.replace(/-/g, '')}T${String(utcH).padStart(2, '0')}${String(m).padStart(2, '0')}00Z`;
}

// ICS lines must be at most 75 octets; fold longer lines with CRLF + space
function foldLine(line) {
  if (line.length <= 75) return line;
  let out = '';
  while (line.length > 75) {
    out += line.slice(0, 75) + '\r\n ';
    line = line.slice(75);
  }
  return out + line;
}

function esc(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function generateICS(acts) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unearthed Festival 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Unearthed 2026 – My Programme',
    'X-WR-TIMEZONE:Europe/London',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const act of acts) {
    const dtstart = toUTC(act.day, act.time);
    const dtend   = toUTC(act.day, act.endTime);

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:unearthed-2026-${act.id}@unearthedfestival.co.uk`));
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(foldLine(`SUMMARY:${esc(act.name)}`));
    lines.push(foldLine(`LOCATION:${esc(act.stage)}`));
    if (act.desc) lines.push(foldLine(`DESCRIPTION:${esc(act.desc)}`));
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(foldLine(`DESCRIPTION:Starting soon: ${esc(act.name)} at ${esc(act.stage)}`));
    lines.push('TRIGGER:-PT15M');
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

const UUID_RE = /^\/(?:acts|calendar)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const match = url.pathname.match(UUID_RE);
    if (!match) return new Response('Not found', { status: 404 });
    const uuid = match[1];

    // PUT /acts/:uuid — store saved acts list
    if (method === 'PUT' && url.pathname.startsWith('/acts/')) {
      const body = await request.text();
      if (body.length > 65536) return new Response('Too large', { status: 413, headers: CORS_HEADERS });
      await env.SAVED_ACTS.put(uuid, body, { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days
      return new Response('OK', { headers: CORS_HEADERS });
    }

    // GET /calendar/:uuid — return .ics feed
    if (method === 'GET' && url.pathname.startsWith('/calendar/')) {
      const raw = await env.SAVED_ACTS.get(uuid);
      if (!raw) return new Response('Not found', { status: 404 });

      let acts;
      try { acts = JSON.parse(raw); } catch { return new Response('Bad data', { status: 500 }); }

      return new Response(generateICS(acts), {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="unearthed-2026.ics"',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
