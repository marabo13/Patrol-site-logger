exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return { statusCode: 500, body: "Missing webhook" };
  }

  let body={}; try{body=JSON.parse(event.body||"{}")}catch{}

  const {
    action, username, rank, mentor,
    startISO, endISO, time
  } = body;

  const fields = [
    { name:"Officer", value:`**${username}**`, inline:true },
    { name:"Rank", value:`**${rank}**`, inline:true }
  ];

  if(rank === "Arbiter" && mentor){
    fields.push({
      name:"Supervised by",
      value:`**Quaestor ${mentor}**`,
      inline:false
    });
  }

  if(startISO) fields.push({ name:"Start", value:`\`${startISO}\``, inline:false });
  if(endISO) fields.push({ name:"End", value:`\`${endISO}\``, inline:false });

  const embed = {
    title: action === "Start Patrol" ? "🟢 Patrol Started" : "🔴 Patrol Ended",
    color: action === "Start Patrol" ? 0x2ecc71 : 0xe74c3c,
    fields,
    timestamp: time || new Date().toISOString(),
    footer:{ text:"DCoJ Patrol Logger" }
  };

  const resp = await fetch(WEBHOOK_URL,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({embeds:[embed]})
  });

  if(!resp.ok){
    return { statusCode:500, body:"Discord webhook failed" };
  }

  return { statusCode:200, body:"OK" };
};
