exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return { statusCode: 500, body: "Missing webhook" };
  }

  let b = {};
  try { b = JSON.parse(event.body || "{}"); } catch {}

  const fields = [];

  if (b.username) fields.push({ name: "Officer", value: `**${b.username}**`, inline: true });
  if (b.rank) fields.push({ name: "Rank", value: `**${b.rank}**`, inline: true });

  if (b.rank === "Arbiter") {
    const mentorName = (b.mentor || "").toString().trim();
    fields.push({
      name: "Supervised by",
      value: mentorName ? `**Quaestor ${mentorName}**` : "**None provided**",
      inline: false
    });
  }

  if (b.startISO) fields.push({ name: "Start", value: `\`${b.startISO}\``, inline: false });
  if (b.endISO) fields.push({ name: "End", value: `\`${b.endISO}\``, inline: false });

  if (b.durationText) fields.push({ name: "Duration", value: `**${b.durationText}**`, inline: true });

  if (b.action === "End Patrol") {
    // arrests
    if (b.arrests !== undefined && b.arrests !== null) {
      fields.push({ name: "Arrests", value: `**${String(b.arrests)}**`, inline: true });
    }

    // attendees ALWAYS show (None if empty) + safe trimming
    let attendeesArr = Array.isArray(b.attendees) ? b.attendees.map(x => String(x).trim()).filter(Boolean) : [];
    let attendeesText = attendeesArr.length ? attendeesArr.map(x => `• ${x}`).join("\n") : "None";

    // Discord embed field value limit: 1024 chars.
    // Trim safely so Discord never drops the field.
    if (attendeesText.length > 1000) attendeesText = attendeesText.slice(0, 1000) + "\n…";

    fields.push({
      name: "Attendees",
      value: attendeesText,
      inline: false
    });
  }

  const embed = {
    title: b.action === "Start Patrol" ? "🟢 Patrol Started" : "🔴 Patrol Ended",
    color: b.action === "Start Patrol" ? 0x2ecc71 : 0xe74c3c,
    fields,
    timestamp: b.time || new Date().toISOString(),
    footer: { text: "DCoJ Patrol Logger" }
  };

  const r = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  if (!r.ok) return { statusCode: 500, body: "Discord webhook failed" };
  return { statusCode: 200, body: "OK" };
};
