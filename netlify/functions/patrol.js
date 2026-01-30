exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return { statusCode: 500, body: "Missing webhook" };
  }

  let b={}; try{b=JSON.parse(event.body||"{}")}catch{}

  const f=[];
  if(b.username) f.push({name:"Officer",value:`**${b.username}**`,inline:true});
  if(b.rank) f.push({name:"Rank",value:`**${b.rank}**`,inline:true});
  if(b.rank==="Arbiter"&&b.mentor)
    f.push({name:"Supervised by",value:`**Quaestor ${b.mentor}**`,inline:false});

  if(b.startISO) f.push({name:"Start",value:`\`${b.startISO}\``,inline:false});
  if(b.endISO) f.push({name:"End",value:`\`${b.endISO}\``,inline:false});
  if(b.durationText) f.push({name:"Duration",value:`**${b.durationText}**`,inline:true});
  if(b.arrests!==undefined) f.push({name:"Arrests",value:`**${b.arrests}**`,inline:true});
  if(Array.isArray(b.attendees)&&b.attendees.length)
    f.push({name:"Attendees",value:b.attendees.join(", "),inline:false});

  const embed={
    title:b.action==="Start Patrol"?"🟢 Patrol Started":"🔴 Patrol Ended",
    color:b.action==="Start Patrol"?0x2ecc71:0xe74c3c,
    fields:f,
    timestamp:b.time||new Date().toISOString(),
    footer:{text:"DCoJ Patrol Logger"}
  };

  const r=await fetch(WEBHOOK_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({embeds:[embed]})
  });

  if(!r.ok) return {statusCode:500,body:"Discord webhook failed"};
  return {statusCode:200,body:"OK"};
};
