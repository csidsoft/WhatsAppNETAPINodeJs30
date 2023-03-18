require("dotenv").config();const{SESSION_ID:SESSION_ID,IMAGE_AND_DOCUMENT_PATH:IMAGE_AND_DOCUMENT_PATH}=process.env,{downloadContentFromMessage:downloadContentFromMessage}=require("@adiwajshing/baileys"),mime=require("mime-types"),fs=require("fs"),{addEditContact:addEditContact,getContactById:getContactById}=require("../db.repository/contacts.repository"),{addMessage:addMessage,getMessageForDeleteInGroupByJid:getMessageForDeleteInGroupByJid}=require("../db.repository/messages.repository"),{LegacyMessageTypes:LegacyMessageTypes,getLegacyMessageType:getLegacyMessageType}=require("../common/message.type"),{vcardToJSON:vcardToJSON,findVal:findVal,msgContent:msgContent,keyExist:keyExist}=require("../common/common.util"),{saveMediaToFile:saveMediaToFile,saveStream:saveStream,saveStringBase64:saveStringBase64}=require("./messages.upsert.extention"),{signalRClient:signalRClient,serverHub:serverHub}=require("../signalr/signalr.util"),messagesUpsert=async(e,s,a)=>{const t=e.messages[0];if(!t.message)return;if(t.key&&"status@broadcast"==t.key.remoteJid)return;console.log(),console.log(`incomingMsg: ${JSON.stringify(t)}`);const n=t.key.fromMe;let i=getLegacyMessageType(t);console.log(`legacyMessageType: ${i}`),console.log();try{await addMessage(t)}catch(e){console.log(`addMessage::ex: ${e}`)}const o=t.key.remoteJid.endsWith("@g.us");if(n){const e="true",s=t.key.remoteJid;if(t.key&&t.key.id){const a=t.key.id;let n=void 0;if(i===LegacyMessageTypes.CONVERSATION&&!(n=findVal(t,"conversation"))){const e=findVal(t,"extendedTextMessage");e&&(n=e.text)}return void signalRClient.connection.hub.invoke(serverHub,"SendMessageStatus",JSON.stringify({messageStatus:{status:e,send_to:s,message:n,messageId:a},sessionId:SESSION_ID}))}}if(!o){const e=createContactFromMsg(t);if(e)try{await addEditContact(e)}catch(e){console.log(`call addEditContact::ex: ${e}`)}}const g=findVal(t,"messageTimestamp"),d=msgContent(i,t);let c="";if(msgHasMedia(i)&&IMAGE_AND_DOCUMENT_PATH){const e=findVal(t,"mimetype");c=`${g}.${mime.extension(e)}`,saveMedia(t,i,c)}const r=t.key.remoteJid;let m=void 0;try{m=await getContactById(r)}catch(e){console.log(`getContactById::ex: ${e}`)}m||(m={id:t.key&&t.key.remoteJid?t.key.remoteJid:"",name:t.pushName?t.pushName:"",pushname:"",verifiedname:""});let M=void 0;if(o){try{const e=n?t.participant:t.key.participant;M=await getContactById(e)}catch(e){console.log(`getContactById::ex: ${e}`)}if(!M){M={id:n?t.participant:t.key.participant,name:t.pushName?t.pushName:"",pushname:"",verifiedname:""}}}let y=void 0;if(i===LegacyMessageTypes.LOCATION_MESSAGE){const{locationMessage:e}=t.message;y={liveLocation:!1,thumbnail:`${g}.png`,latitude:e.degreesLatitude,longitude:e.degreesLongitude,description:e.name},IMAGE_AND_DOCUMENT_PATH&&saveStringBase64(IMAGE_AND_DOCUMENT_PATH,y.thumbnail,e.jpegThumbnail)}if(i===LegacyMessageTypes.LIVE_LOCATION_MESSAGE){const{liveLocationMessage:e}=t.message;y={liveLocation:!0,thumbnail:`${g}.png`,latitude:e.degreesLatitude?e.degreesLatitude:0,longitude:e.degreesLongitude?e.degreesLongitude:0,description:e.caption?e.caption:""},IMAGE_AND_DOCUMENT_PATH&&saveStringBase64(IMAGE_AND_DOCUMENT_PATH,y.thumbnail,e.jpegThumbnail),i=LegacyMessageTypes.LOCATION_MESSAGE}let l=void 0,T=void 0;i===LegacyMessageTypes.BUTTONS_RESPONSE_MESSAGE?(l=findVal(t,"selectedButtonId"))||(l=findVal(t,"selectedId")):i===LegacyMessageTypes.LIST_RESPONSE_MESSAGE&&(T=findVal(t,"selectedRowId"));let S=s,E=r;n||(S=r,E=s);const p={id:t.key&&t.key.id?t.key.id:"",sessionId:SESSION_ID,content:d||"",type:i||"",from:S||"",to:E||"",sender:o?void 0:{id:m.id?m.id:"",name:m.name?m.name:"",shortName:"",pushname:m.pushName?m.pushName:""},group:o?{id:m.id?m.id:"",name:m.name?m.name:"",sender:{id:M.id?M.id:"",name:M.name?M.name:"",shortName:"",pushname:M.pushName?M.pushName:""}}:void 0,unixTimestamp:g||0,filename:c,location:y,vcards:i===LegacyMessageTypes.CONTACT_MESSAGE||i===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE?[]:void 0,vcardFilenames:i===LegacyMessageTypes.CONTACT_MESSAGE||i===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE?[]:void 0,selectedButtonId:l,selectedRowId:T};if(i!==LegacyMessageTypes.CONTACT_MESSAGE&&i!==LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE&&i!==LegacyMessageTypes.LOCATION_MESSAGE&&i!==LegacyMessageTypes.LIVE_LOCATION_MESSAGE||(p.content=""),i===LegacyMessageTypes.CONTACT_MESSAGE){const{vcard:e}=t.message.contactMessage;saveContactMessage(e,p)}if(i===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE){const{contacts:e}=t.message.contactsArrayMessage;saveContactMessages(e,p)}signalRClient.connection.hub.invoke(serverHub,"ReceiveMessage",JSON.stringify({message:p,sessionId:SESSION_ID}))},unreadMessagesUpsert=async(e,s,a)=>{for(const a of e.messages){if(!a.message)continue;if(a.key&&"status@broadcast"==a.key.remoteJid)continue;console.log(),console.log(`incomingMsg: ${JSON.stringify(a)}`);const e=a.key.fromMe;let t=getLegacyMessageType(a);console.log(`legacyMessageType: ${t}`),console.log();try{await addMessage(a)}catch(e){console.log(`addMessage::ex: ${e}`)}const n=a.key.remoteJid.endsWith("@g.us");if(e){const e="true",s=a.key.remoteJid;if(a.key&&a.key.id){const n=a.key.id;let i=void 0;if(t===LegacyMessageTypes.CONVERSATION&&!(i=findVal(a,"conversation"))){const e=findVal(a,"extendedTextMessage");e&&(i=e.text)}signalRClient.connection.hub.invoke(serverHub,"SendMessageStatus",JSON.stringify({messageStatus:{status:e,send_to:s,message:i,messageId:n},sessionId:SESSION_ID}));continue}}if(!n){const e=createContactFromMsg(a);if(e)try{await addEditContact(e)}catch(e){console.log(`call addEditContact::ex: ${e}`)}}const i=findVal(a,"messageTimestamp"),o=msgContent(t,a);let g="";if(msgHasMedia(t)&&IMAGE_AND_DOCUMENT_PATH){const e=findVal(a,"mimetype");g=`${i}.${mime.extension(e)}`,saveMedia(a,t,g)}const d=a.key.remoteJid;let c=void 0;try{c=await getContactById(d)}catch(e){console.log(`getContactById::ex: ${e}`)}c||(c={id:a.key&&a.key.remoteJid?a.key.remoteJid:"",name:a.pushName?a.pushName:"",pushname:"",verifiedname:""});let r=void 0;if(n){try{const s=e?a.participant:a.key.participant;r=await getContactById(s)}catch(e){console.log(`getContactById::ex: ${e}`)}if(!r){r={id:e?a.participant:a.key.participant,name:a.pushName?a.pushName:"",pushname:"",verifiedname:""}}}let m=void 0;if(t===LegacyMessageTypes.LOCATION_MESSAGE){const{locationMessage:e}=a.message;m={liveLocation:!1,thumbnail:`${i}.png`,latitude:e.degreesLatitude,longitude:e.degreesLongitude,description:e.name},IMAGE_AND_DOCUMENT_PATH&&saveStringBase64(IMAGE_AND_DOCUMENT_PATH,m.thumbnail,e.jpegThumbnail)}if(t===LegacyMessageTypes.LIVE_LOCATION_MESSAGE){const{liveLocationMessage:e}=a.message;m={liveLocation:!0,thumbnail:`${i}.png`,latitude:e.degreesLatitude?e.degreesLatitude:0,longitude:e.degreesLongitude?e.degreesLongitude:0,description:e.caption?e.caption:""},IMAGE_AND_DOCUMENT_PATH&&saveStringBase64(IMAGE_AND_DOCUMENT_PATH,m.thumbnail,e.jpegThumbnail),t=LegacyMessageTypes.LOCATION_MESSAGE}let M=void 0,y=void 0;t===LegacyMessageTypes.BUTTONS_RESPONSE_MESSAGE?(M=findVal(a,"selectedButtonId"))||(M=findVal(a,"selectedId")):t===LegacyMessageTypes.LIST_RESPONSE_MESSAGE&&(y=findVal(a,"selectedRowId"));let l=s,T=d;e||(l=d,T=s);const S={id:a.key&&a.key.id?a.key.id:"",sessionId:SESSION_ID,content:o||"",type:t||"",from:l||"",to:T||"",sender:n?void 0:{id:c.id?c.id:"",name:c.name?c.name:"",shortName:"",pushname:c.pushName?c.pushName:""},group:n?{id:c.id?c.id:"",name:c.name?c.name:"",sender:{id:r.id?r.id:"",name:r.name?r.name:"",shortName:"",pushname:r.pushName?r.pushName:""}}:void 0,unixTimestamp:i||0,filename:g,location:m,vcards:t===LegacyMessageTypes.CONTACT_MESSAGE||t===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE?[]:void 0,vcardFilenames:t===LegacyMessageTypes.CONTACT_MESSAGE||t===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE?[]:void 0,selectedButtonId:M,selectedRowId:y};if(t!==LegacyMessageTypes.CONTACT_MESSAGE&&t!==LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE&&t!==LegacyMessageTypes.LOCATION_MESSAGE&&t!==LegacyMessageTypes.LIVE_LOCATION_MESSAGE||(S.content=""),t===LegacyMessageTypes.CONTACT_MESSAGE){const{vcard:e}=a.message.contactMessage;saveContactMessage(e,S)}if(t===LegacyMessageTypes.CONTACTS_ARRAY_MESSAGE){const{contacts:e}=a.message.contactsArrayMessage;saveContactMessages(e,S)}signalRClient.connection.hub.invoke(serverHub,"UnreadMessage",JSON.stringify({message:S,sessionId:SESSION_ID}))}},createContactFromMsg=e=>{const s=e.key.remoteJid,a={id:s||"",name:e.pushName?e.pushName:"",pushname:"",verifiedname:"",isgroup:s.endsWith("@g.us")?1:0};return!a.name&&a.pushname&&(a.name=a.pushname?a.pushname:"",a.pushname=""),a},msgHasMedia=e=>{try{return e===LegacyMessageTypes.IMAGE_MESSAGE||e===LegacyMessageTypes.DOCUMENT_MESSAGE||e===LegacyMessageTypes.AUDIO_MESSAGE||e===LegacyMessageTypes.VIDEO_MESSAGE}catch(e){}return!1},saveMedia=async(e,s,a)=>{let t=void 0;switch(s){case LegacyMessageTypes.IMAGE_MESSAGE:try{t=await downloadContentFromMessage(e.message.imageMessage,"image")}catch(e){console.log(`downloadImage::ex: ${e}`)}break;case LegacyMessageTypes.DOCUMENT_MESSAGE:try{t=await downloadContentFromMessage(e.message.documentMessage,"document")}catch(e){console.log(`downloadDocument::ex: ${e}`)}break;case LegacyMessageTypes.AUDIO_MESSAGE:try{t=await downloadContentFromMessage(e.message.audioMessage,"audio")}catch(e){console.log(`downloadAudio::ex: ${e}`)}break;case LegacyMessageTypes.VIDEO_MESSAGE:try{t=await downloadContentFromMessage(e.message.videoMessage,"video")}catch(e){console.log(`downloadVideo::ex: ${e}`)}}t&&await saveStream(IMAGE_AND_DOCUMENT_PATH,a,t)},saveContactMessage=(e,s)=>{if(e&&(s.vcards.push(vcardToJSON(e)),IMAGE_AND_DOCUMENT_PATH)){const{fn:a}=s.vcards[0],t=`${s.unixTimestamp}_${a}.vcf`;s.vcardFilenames.push(t),saveMediaToFile(IMAGE_AND_DOCUMENT_PATH,t,e)}},saveContactMessages=(e,s)=>{let a=0;for(const t of e){if(s.vcards.push(vcardToJSON(t.vcard)),IMAGE_AND_DOCUMENT_PATH){const{fn:e}=s.vcards[a],n=`${s.unixTimestamp}_${e}.vcf`;s.vcardFilenames.push(n),saveMediaToFile(IMAGE_AND_DOCUMENT_PATH,n,t.vcard)}a++}};module.exports={messagesUpsert:messagesUpsert,unreadMessagesUpsert:unreadMessagesUpsert};