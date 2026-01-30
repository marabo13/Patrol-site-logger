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
  const nowISO = String(body.time || new Date().toISOString());

  // ✅ OPTIONAL: set these to whatever you want
  const EMBED_AUTHOR_NAME = "Patrol System";
  const EMBED_FOOTER_TEXT = "Auto patrol logger";

  // Discord embed colors (decimal)
  const GREEN = 0x2ecc71;
  const RED = 0xe74c3c;
  const PURPLE = 0xa66bff;

  const isStart = action === "Start Patrol";
  const isEnd = action === "End Patrol";

  const title = isStart ? "🟢 Patrol Started" : isEnd ? "🔴 Patrol Ended" : "🛡️ Patrol Update";
  const color = isStart ? GREEN : isEnd ? RED : PURPLE;

  const fields = [];

  if (startISO) fields.push({ name: "Start", value: `\`${startISO}\``, inline: false });
  if (endISO) fields.push({ name: "End", value: `\`${endISO}\``, inline: false });
  if (durationText) fields.push({ name: "Duration", value: `**${durationText}**`, inline: false });

  // If you want the raw action shown even for start/end:
  fields.push({ name: "Action", value: `**${action}**`, inline: true });

  const embed = {
    author: { name: EMBED_AUTHOR_NAME },
    title,
    color,
    fields,
    timestamp: nowISO,
    footer: { text: EMBED_FOOTER_TEXT },
  };

  const payload = {
    // You can also set webhook username/icon here if you want:
    // username: "Patrol Logger",
    // avatar_url: "https://.../image.png",
    embeds: [embed],
  };

  const resp = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const details = await resp.text().catch(() => "");
    return { statusCode: 500, body: JSON.stringify({ error: "Discord webhook failed", details }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
