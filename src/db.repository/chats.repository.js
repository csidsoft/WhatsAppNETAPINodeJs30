const{executeNonQuery:executeNonQuery,executeReader:executeReader}=require("../db/db.util"),{validateJid:validateJid}=require("../common/common.util"),addChat=async e=>{try{const t=[validateJid(e.id),JSON.stringify(e)],a="INSERT INTO chats (jid, chat)\n                     VALUES (?, ?)";await executeNonQuery(a,t)}catch(e){console.log(`addChat::ex: ${e}`)}};module.exports={addChat:addChat};