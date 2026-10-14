
import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSlipEvent, formatSlipResult} from './slipok.js';
import {validateSignature} from '../routes/webhookRoutes.js';
import crypto from 'node:crypto';
test('signature uses exact bytes', () => {
  process.env.LINE_CHANNEL_SECRET = 'test-secret';
  const raw = Buffer.from('{ "events": [] }');
  const sig = crypto.createHmac('sha256', 'test-secret').update(raw).digest('base64');
  assert.equal(validateSignature(raw, sig), true);
  assert.equal(validateSignature(Buffer.from('{"events":[]}'), sig), false);
  assert.equal(validateSignature(raw, 'invalid'), false);
});
test('all customers can upload regardless of old allowlist; disabled and unsupported events are ignored', async () => {
  const env = {SLIPOK_ENABLED:'true',SLIPOK_TEST_USER_IDS:'Utest',SLIPOK_API_KEY:'test',SLIPOK_BRANCH_ID:'123',LINE_CHANNEL_ACCESS_TOKEN:'test'};
  const event = {type:'message',webhookEventId:'test-event',source:{type:'user',userId:'Ucustomer'},message:{type:'image',id:'1'},replyToken:'reply'};
  const calls = [];
  const request = async (url, options) => {
    calls.push({url,options});
    if (url.includes('api-data')) return new Response(new Uint8Array([1,2]), {headers:{'content-type':'image/png'}});
    if (url.includes('api.slipok')) {
      assert.equal(options.body.get('log'), 'true');
      assert.ok(options.body.get('files') instanceof Blob);
      return Response.json({success:true,data:{success:true,amount:100,transRef:'ref'}});
    }
    return Response.json({});
  };
  await handleSlipEvent(event,request,{...env,SLIPOK_ENABLED:'false'});
  await handleSlipEvent({...event,source:{type:'unknown'}},request,env);
  assert.equal(calls.length,0);
  await handleSlipEvent(event,request,env);
  await handleSlipEvent(event,request,env);
  assert.equal(calls.length,3);
  assert.match(JSON.parse(calls[2].options.body).messages[0].text,/100.00/);
  await handleSlipEvent({...event,webhookEventId:'no-allowlist'},request,{...env,SLIPOK_TEST_USER_IDS:''});
  assert.equal(calls.length,6);
});
test('invalid results cannot be treated as success', () => {
  assert.match(formatSlipResult({success:true,data:{success:false,amount:100,transRef:'ref'}}),/❌/);
  assert.match(formatSlipResult({code:1014}),/บัญชีรับเงิน/);
});
test('upstream timeout produces a failure reply', async () => {
  const env = {SLIPOK_ENABLED:'true',SLIPOK_TEST_USER_IDS:'Utest',SLIPOK_API_KEY:'test',SLIPOK_BRANCH_ID:'123',LINE_CHANNEL_ACCESS_TOKEN:'test'};
  let reply;
  await handleSlipEvent({type:'message',webhookEventId:'failure',source:{type:'user',userId:'Utest'},message:{type:'image',id:'2'},replyToken:'r'}, async (url,opts) => {
    if (url.includes('api-data')) throw new Error('timeout');
    reply = JSON.parse(opts.body);
    return Response.json({});
  },env);
  assert.match(reply.messages[0].text,/ยังตรวจสอบสลิปไม่สำเร็จ/);
});

test('non-slip images are silent while slip and configuration errors still reply', async () => {
  const env = {SLIPOK_ENABLED:'true',SLIPOK_API_KEY:'test',SLIPOK_BRANCH_ID:'123',LINE_CHANNEL_ACCESS_TOKEN:'test'};
  for (const code of [1007, '1008', 1002, 1006, 1011, 1012, 1014]) {
    let replies = 0;
    await handleSlipEvent({type:'message',webhookEventId:'image-code-' + code,source:{type:'user',userId:'customer'},message:{type:'image',id:'image'},replyToken:'reply'}, async (url) => {
      if (url.includes('api-data')) return new Response(new Uint8Array([1,2]), {headers:{'content-type':'image/png'}});
      if (url.includes('api.slipok')) return Response.json({success:false,code}, {status:400});
      replies++;
      return Response.json({});
    }, env);
    assert.equal(replies, [1007,1008].includes(Number(code)) ? 0 : 1);
  }
});
test('group and room images reply in the originating chat, and non-slip images stay silent', async () => {
  const env = {SLIPOK_ENABLED:'true',SLIPOK_API_KEY:'test',SLIPOK_BRANCH_ID:'123',LINE_CHANNEL_ACCESS_TOKEN:'test'};
  for (const source of [{type:'group',groupId:'group'}, {type:'room',roomId:'room'}]) {
    for (const code of [0,1007,1008]) {
      const replies = [];
      const replyToken = source.type + '-reply-' + code;
      await handleSlipEvent({type:'message',webhookEventId:replyToken,source,message:{type:'image',id:'group-image'},replyToken}, async (url, opts) => {
        if (url.includes('api-data')) return new Response(new Uint8Array([1,2]), {headers:{'content-type':'image/png'}});
        if (url.includes('api.slipok')) return code ? Response.json({success:false,code},{status:400}) : Response.json({success:true,data:{success:true,amount:250,transRef:'test-ref'}});
        assert.equal(url, 'https://api.line.me/v2/bot/message/reply');
        replies.push(JSON.parse(opts.body));
        return Response.json({});
      },env);
      assert.equal(replies.length,code ? 0 : 1);
      if (!code) {
        assert.equal(replies[0].replyToken,replyToken);
        assert.match(replies[0].messages[0].text,/250.00/);
      }
    }
  }
});