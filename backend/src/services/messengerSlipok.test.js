import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import {createMessengerRouter,validateMessengerSignature} from '../routes/messengerRoutes.js';
import {handleMessengerSlip} from './messengerSlipok.js';
const env = {MESSENGER_ENABLED:'true',SLIPOK_ENABLED:'true',MESSENGER_PAGE_ID:'page',MESSENGER_PAGE_ACCESS_TOKEN:'token',MESSENGER_GRAPH_VERSION:'v23.0',SLIPOK_API_KEY:'key',SLIPOK_BRANCH_ID:'branch',MESSENGER_APP_SECRET:'secret',MESSENGER_VERIFY_TOKEN:'verify'};
function sign(body) { return 'sha256=' + crypto.createHmac('sha256',env.MESSENGER_APP_SECRET).update(body).digest('hex'); }
const event = {sender:{id:'customer'},recipient:{id:'page'},message:{mid:'m',attachments:[{type:'image',payload:{url:'https://example.com/slip.png'}}]}};
test('signature rejects changed body and malformed signatures',() => {
  const raw = Buffer.from('{ "object": "page" }');
  assert.equal(validateMessengerSignature(raw,sign(raw),'secret'),true);
  assert.equal(validateMessengerSignature(Buffer.from('{}'),sign(raw),'secret'),false);
  assert.equal(validateMessengerSignature(raw,'sha256=bad','secret'),false);
  assert.equal(validateMessengerSignature(raw,sign(raw),''),false);
});
test('webhook handshake, signed events, wrong pages and authentication',async () => {
  const events = [];
  const app = express();
  app.use(express.json({verify:(req,res,body) => {req.rawBody = body;}}));
  app.use('/api',createMessengerRouter(env,async (message,page) => events.push({message,page})));
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  try {
    const endpoint = 'http://127.0.0.1:' + server.address().port + '/api/messenger/webhook';
    const valid = await fetch(endpoint + '?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=123');
    assert.equal(valid.status,200); assert.equal(await valid.text(),'123');
    assert.equal((await fetch(endpoint + '?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=123')).status,403);
    const body = JSON.stringify({object:'page',entry:[{id:'page',messaging:[event]},{id:'other',messaging:[event]}]});
    assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,401);
    assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-hub-signature-256':sign(body)},body})).status,200);
    assert.equal(events.length,1); assert.equal(events[0].page,'page');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('image check sends correct recipient, ignores echoes, disabled and redelivered messages',async () => {
  const calls = [];
  const request = async (url,options) => {
    calls.push({url,options});
    if (url.includes('slipok')) {
      assert.deepEqual(JSON.parse(options.body),{url:'https://example.com/slip.png',log:true});
      return Response.json({success:true,data:{success:true,amount:99,transRef:'ref'}});
    }
    return Response.json({message_id:'sent'});
  };
  await handleMessengerSlip(event,'page',request,{...env,MESSENGER_ENABLED:'false'});
  await handleMessengerSlip({...event,message:{...event.message,is_echo:true}},'page',request,env);
  await handleMessengerSlip(event,'other',request,env);
  await handleMessengerSlip({...event,message:{mid:'text',text:'hello'}},'page',request,env);
  assert.equal(calls.length,0);
  await handleMessengerSlip(event,'page',request,env);
  await handleMessengerSlip(event,'page',request,env);
  assert.equal(calls.length,2);
  const reply = JSON.parse(calls[1].options.body);
  assert.deepEqual(reply.recipient,{id:'customer'});
  assert.equal(reply.messaging_type,'RESPONSE');
  assert.match(reply.message.text,/99.00/);
  assert.equal(calls[1].options.headers.Authorization,'Bearer token');
});
test('non-slip images stay silent; duplicates and upstream errors reply',async () => {
  for (const code of [1007,1008,1012,'timeout']) {
    let replies = 0;
    await handleMessengerSlip({...event,message:{...event.message,mid:'code-' + code}},'page',async url => {
      if (url.includes('slipok')) {
        if (code === 'timeout') throw new Error('timeout');
        return Response.json({success:false,code},{status:400});
      }
      replies++;
      return Response.json({});
    },env);
    assert.equal(replies,[1007,1008].includes(code) ? 0 : 1);
  }
});