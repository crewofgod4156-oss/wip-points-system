import {formatSlipResult} from './slipok.js';
const seen = new Map();
export async function handleMessengerSlip(event, pageId, request = fetch, env = process.env) {
  if (env.MESSENGER_ENABLED !== 'true' || env.SLIPOK_ENABLED !== 'true') return;
  if (pageId !== env.MESSENGER_PAGE_ID || event.recipient?.id !== pageId || event.message?.is_echo || !event.sender?.id || !event.message?.mid) return;
  const images = (event.message.attachments || []).filter(a => a.type === 'image' && a.payload?.url);
  if (!images.length) return;
  const required = ['MESSENGER_PAGE_ACCESS_TOKEN','MESSENGER_GRAPH_VERSION','SLIPOK_API_KEY','SLIPOK_BRANCH_ID'];
  if (required.some(key => !env[key]) || !/^v\d+\.\d+$/.test(env.MESSENGER_GRAPH_VERSION)) {
    console.warn('[Messenger] missing or invalid configuration'); return;
  }
  const now = Date.now();
  for (const [key,expiry] of seen) if (expiry <= now) seen.delete(key);
  const id = pageId + ':' + event.message.mid;
  if (seen.has(id)) return;
  // Per-process deduplication; restart clears this cache.
  seen.set(id,now + 86400000);
  for (const image of images) {
    let text;
    try {
      const url = new URL(image.payload.url);
      if (url.protocol !== 'https:') continue;
      const response = await request('https://api.slipok.com/api/line/apikey/' + encodeURIComponent(env.SLIPOK_BRANCH_ID), {
        method:'POST',headers:{'Content-Type':'application/json','x-authorization':env.SLIPOK_API_KEY},
        body:JSON.stringify({url:url.href,log:true}),signal:AbortSignal.timeout(20000)
      });
      const result = await response.json();
      console.log('[Messenger SlipOK] status:',response.status,'code:',Number(result.code)||0);
      if ([1007,1008].includes(Number(result.code))) continue;
      text = formatSlipResult(response.ok ? result : {code:result.code});
    } catch {
      console.error('[Messenger SlipOK] verification failed');
      text = 'ยังตรวจสอบสลิปไม่สำเร็จในขณะนี้ กรุณาติดต่อร้านก่อนยืนยันการชำระเงิน';
    }
    const reply = await request('https://graph.facebook.com/' + env.MESSENGER_GRAPH_VERSION + '/' + encodeURIComponent(pageId) + '/messages', {
      method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer ' + env.MESSENGER_PAGE_ACCESS_TOKEN},
      body:JSON.stringify({recipient:{id:event.sender.id},messaging_type:'RESPONSE',message:{text}}),signal:AbortSignal.timeout(10000)
    });
    console.log('[Messenger] reply HTTP status:',reply.status);
    if (!reply.ok) throw new Error('Messenger reply failed');
  }
}