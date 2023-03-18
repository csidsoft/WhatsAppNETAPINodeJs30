require("dotenv").config();const path=require("path"),fs=require("fs"),qrcodeTerminal=require("qrcode-terminal"),qr=require("qr-image"),qrcode=qr,P=require("pino"),{SESSION_ID:SESSION_ID,AGENT_NAME:AGENT_NAME,OS_NAME:OS_NAME}=process.env,SESSION_FILE_PATH=path.join(path.resolve("./session"),`${SESSION_ID}`),QRCODE_FILE_PATH=path.join(path.resolve("./session"),`qr_code_${SESSION_ID}.png`),{useMultiFileAuthState:useMultiFileAuthState,DisconnectReason:DisconnectReason,fetchLatestBaileysVersion:fetchLatestBaileysVersion}=require("@adiwajshing/baileys"),makeWASocket=require("@adiwajshing/baileys").default,{getContactById:getContactById}=require("./db.repository/contacts.repository"),{onSendMessageHandler:onSendMessageHandler,onBroadcastMessageHandler:onBroadcastMessageHandler,onGetUnreadMessageHandler:onGetUnreadMessageHandler,onGetAllMessageHandler:onGetAllMessageHandler}=require("./signalr.event.handler/messages.handler"),{onGrabGroupHandler:onGrabGroupHandler,onGrabGroupAndMemberHandler:onGrabGroupAndMemberHandler,onGrabContactHandler:onGrabContactHandler}=require("./signalr.event.handler/grab.handler"),{onArchiveChatHandler:onArchiveChatHandler,onMarkReadChatHandler:onMarkReadChatHandler,onDeleteMessageHandler:onDeleteMessageHandler,onDeleteChatHandler:onDeleteChatHandler}=require("./signalr.event.handler/chats.handler"),{onSetOnlineStatusHandler:onSetOnlineStatusHandler,onVerifyWANumberHandler:onVerifyWANumberHandler,onGetBusinessProfileHandler:onGetBusinessProfileHandler,onDisconnectHandler:onDisconnectHandler,onLogoutHandler:onLogoutHandler,onGetCurrentStateHandler:onGetCurrentStateHandler}=require("./signalr.event.handler/common.handler"),{onGroupCreatedHandler:onGroupCreatedHandler,onAddRemoveGroupMemberHandler:onAddRemoveGroupMemberHandler}=require("./signalr.event.handler/groups.handler"),{groupsUpsert:groupsUpsert,groupsParticipantsUpdate:groupsParticipantsUpdate}=require("./sock.event.handler/group.handler"),{chatsSet:chatsSet,chatsUpdate:chatsUpdate,chatsUpsert:chatsUpsert}=require("./sock.event.handler/chats.handler"),{contactsSet:contactsSet,contactsUpdate:contactsUpdate,contactsUpsert:contactsUpsert}=require("./sock.event.handler/contacts.handler"),messagesSet=require("./sock.event.handler/messages.set.handler"),messagesUpdate=require("./sock.event.handler/messages.update.handler"),{messagesUpsert:messagesUpsert,unreadMessagesUpsert:unreadMessagesUpsert}=require("./sock.event.handler/messages.upsert.handler"),incomingCall=require("./sock.event.handler/call.handler"),{waitFor:waitFor,findVal:findVal}=require("./common/common.util"),{signalRClient:signalRClient,serverHub:serverHub}=require("./signalr/signalr.util");let _sock=void 0,_currentWaNumber=void 0,_currentState="unknown";const connectedHandler=async()=>{try{console.log("SignalR client connected.");const e="- Initialize...";signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:e,sessionId:SESSION_ID})),console.log(e),(_sock=await connectToWhatsApp())&&registerCallBack(_sock)}catch(e){console.error(`initialize error: ${e}`),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:new String(e),sessionId:SESSION_ID}))}};signalRClient.start(),signalRClient.on("connected",connectedHandler),signalRClient.on("reconnecting",e=>{console.log(`SignalR client reconnecting: ${e}.`)}),signalRClient.on("disconnected",e=>{console.log(`SignalR client disconnected: ${e}.`)}),signalRClient.on("error",(e,n)=>{console.log(`SignalR client connect error: ${e}.`)}),signalRClient.connection.hub.on(serverHub,"OnGroupCreate",e=>{onGroupCreatedHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnAddRemoveGroupMember",e=>{onAddRemoveGroupMemberHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnSetOnlineStatus",e=>{onSetOnlineStatusHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnSendMessage",e=>{onSendMessageHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnBroadcastMessage",(e,n)=>{onBroadcastMessageHandler(e,n,_sock)}),signalRClient.connection.hub.on(serverHub,"OnVerifyWANumber",(e,n)=>{onVerifyWANumberHandler(e,n,_sock)}),signalRClient.connection.hub.on(serverHub,"OnGetBusinessProfile",(e,n)=>{onGetBusinessProfileHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnGrabContact",e=>{onGrabContactHandler(e,_currentWaNumber)}),signalRClient.connection.hub.on(serverHub,"OnGrabGroup",e=>{onGrabGroupHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnGrabGroupAndMember",e=>{onGrabGroupAndMemberHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnArchiveChat",e=>{onArchiveChatHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnMarkRead",e=>{onMarkReadChatHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnDeleteMessage",e=>{onDeleteMessageHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnDeleteChat",e=>{onDeleteChatHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnGetCurrentState",e=>{onGetCurrentStateHandler(e,_currentState)}),signalRClient.connection.hub.on(serverHub,"OnGetUnreadMessage",e=>{onGetUnreadMessageHandler(e,_currentWaNumber,_sock)}),signalRClient.connection.hub.on(serverHub,"OnGetAllMessage",e=>{onGetAllMessageHandler(e,_currentWaNumber)}),signalRClient.connection.hub.on(serverHub,"OnDisconnect",e=>{onDisconnectHandler(e,_sock)}),signalRClient.connection.hub.on(serverHub,"OnLogout",e=>{onLogoutHandler(e,_sock)});const connectToWhatsApp=async()=>{let e=void 0;try{const{version:n}=await fetchLatestBaileysVersion();e=n}catch(e){console.error("fetch wawebVersion error ...."),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:new String(e),sessionId:SESSION_ID}))}const{state:n,saveCreds:t}=await useMultiFileAuthState(SESSION_FILE_PATH),s=makeWASocket({version:e,logger:P({level:"fatal"}),auth:n,browser:[AGENT_NAME||"WhatsApp .NET Client",OS_NAME||"Android",""],patchMessageBeforeSending:e=>{return!!(e.buttonsMessage||e.listMessage||e.templateMessage)&&(e={viewOnceMessage:{message:{messageContextInfo:{deviceListMetadataVersion:2,deviceListMetadata:{}},...e}}}),e}});return s.ev.on("creds.update",async e=>{await t();const n="- Authenticated";console.log(n),fs.existsSync(QRCODE_FILE_PATH)&&fs.unlink(QRCODE_FILE_PATH,e=>{e&&console.log(e)}),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:n,sessionId:SESSION_ID}))}),s},registerCallBack=e=>{e.ev.on("chats.set",chatsSet),e.ev.on("chats.update",chatsUpdate),e.ev.on("chats.upsert",chatsUpsert),e.ev.on("contacts.set",contactsSet),e.ev.on("contacts.update",contactsUpdate),e.ev.on("contacts.upsert",contactsUpsert),e.ev.on("messages.set",messagesSet),e.ev.on("messages.update",e=>{messagesUpdate(e,_currentWaNumber)}),e.ev.on("messages.upsert",n=>{"append"===n.type?unreadMessagesUpsert(n,_currentWaNumber,e):messagesUpsert(n,_currentWaNumber,e)}),e.ev.on("connection.update",connectionUpdate),e.ev.on("groups.upsert",groupsUpsert),e.ev.on("group-participants.update",groupsParticipantsUpdate),e.ev.on("call",e=>{incomingCall(e,_currentWaNumber)})},reConnectToWhatsApp=async()=>{try{_sock&&(_sock.ws.close(),_sock.ev.removeAllListeners()),(_sock=await connectToWhatsApp())&&registerCallBack(_sock)}catch(e){console.log(`ex: ${e}`)}},connectionUpdate=async e=>{console.log("=========== connection.update ========="),console.log(`connectionState: ${JSON.stringify(e)}`),console.log("");const{connection:n,lastDisconnect:t,qr:s}=e;if(_currentState=n||"unknown","close"===n){_currentState=n,signalRClient.connection.hub.invoke(serverHub,"ChangeState",JSON.stringify({state:_currentState,sessionId:SESSION_ID}));let s=!1;if(t&&t.error&&t.error.output&&t.error.output.statusCode&&(s=t.error.output.statusCode!==DisconnectReason.loggedOut),console.log(`connection: ${n}`),console.log(`shouldReconnect: ${s}`),s)try{_currentState="connecting",signalRClient.connection.hub.invoke(serverHub,"ChangeState",JSON.stringify({state:_currentState,sessionId:SESSION_ID})),await reConnectToWhatsApp()}catch(e){console.error("initialize error ...."),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:new String(e),sessionId:SESSION_ID}))}finally{if(e){const n=findVal(e,"type"),t=findVal(e,"message");console.log("== finally on connectionUpdate =="),console.log(`connectionState: ${JSON.stringify(e)}`),n&&console.log(`type: ${n}`),t&&console.log(`payloadMessage: ${t}`)}}else{let n=void 0,t=void 0;e&&(n=findVal(e,"type"),t=findVal(e,"message")),"device_removed"!==n&&"Intentional Logout"!==t&&"Connection Failure"!==t||(console.log("remove session folder, re scan qrcode"),console.log(),removeSessionFile()),_currentState="close",signalRClient.connection.hub.invoke(serverHub,"ChangeState",JSON.stringify({state:_currentState,sessionId:SESSION_ID})),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:_currentState,sessionId:SESSION_ID}))}}else if("open"===n){const{id:e}=_sock.user,t=e.split("@"),s=t[0].split(":")[0];_currentWaNumber=`${s}@${t[1]}`;let o="- WhatsApp Client Library for .NET Developer";console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID})),o=`- Copyright (C) 2020-${(new Date).getFullYear()}. Kamarudin`,console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID})),o="- http://wa-net.coding4ever.net/",console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID}));let r=void 0;try{const{version:e}=await fetchLatestBaileysVersion();r=`${e[0]}.${e[1]}.${e[2]}`}catch(e){console.error("fetch wawebVersion error ...."),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:new String(e),sessionId:SESSION_ID}))}r&&(o=`- WhatsApp Web version ${r}`,console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID}))),o=`- Current Phone Number:${s}`,console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID}));try{await waitFor(4e3)}catch(e){console.log(`error: ${e}`)}o="- Ready",console.log(o),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:o,sessionId:SESSION_ID})),_currentState=n,signalRClient.connection.hub.invoke(serverHub,"ChangeState",JSON.stringify({state:_currentState,sessionId:SESSION_ID}))}if(s){qrcodeTerminal.generate(s,{small:!0});const e="- Scan QRCode...";console.log(e);const n=qrcode.imageSync(s,{type:"png"});fs.writeFileSync(QRCODE_FILE_PATH,n),signalRClient.connection.hub.invoke(serverHub,"Startup",JSON.stringify({message:e,sessionId:SESSION_ID})),signalRClient.connection.hub.invoke(serverHub,"ScanMe",JSON.stringify({qrcodePath:QRCODE_FILE_PATH,sessionId:SESSION_ID}))}},removeSessionFile=()=>{if(fs.existsSync(SESSION_FILE_PATH))try{try{fs.rmdirSync(SESSION_FILE_PATH,{recursive:!0}),console.log(`${SESSION_FILE_PATH} is deleted!`)}catch(e){console.error(`Error while deleting ${SESSION_FILE_PATH}.`)}}catch(e){console.log(`err: ${e}`)}},onSetStatusHandler=async(e,n)=>{const t=JSON.parse(e);console.log(`msgArgs: ${JSON.stringify(t)}`);const{sessionId:s,send_to:o,message:r,type:a,attachmentOrUrl:i}=t;if(s===SESSION_ID)try{const e=await n.sendMessage(o,{text:r});console.log(`result: ${JSON.stringify(e)}`)}catch(e){console.log(`onSetStatusHandler::ex: ${e}`)}};