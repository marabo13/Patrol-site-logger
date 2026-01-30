exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing DISCORD_WEBHOOK_URL env var" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  const action = String(body.action || "Patrol");
  const startISO = body.startISO ? String(body.startISO) : "";
  const endISO = body.endISO ? String(body.endISO) : "";
  const durationText = body.durationText ? String(body.durationText) : "";

  let content = `🛡️ **PATROL LOG**\n`;

  if (action === "Start Patrol") {
    content += `🟢 **START PATROL**\n`;
    if (startISO) content += `🕒 **Start:** ${startISO}\n`;
  } else if (action === "End Patrol") {
    content += `🔴 **END PATROL**\n`;
    if (startISO) content += `🕒 **Start:** ${startISO}\n`;
    if (endISO) content += `🕒 **End:** ${endISO}\n`;
    if (durationText) content += `⏱️ **Duration:** ${durationText}\n`;
  } else {
    content += `**Action:** ${action}\n`;
  }

  const resp = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  if (!resp.ok) {
    const details = await resp.text().catch(() => "");
    return { statusCode: 500, body: JSON.stringify({ error: "Discord webhook failed", details }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
