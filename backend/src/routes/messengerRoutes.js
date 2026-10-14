import express from 'express';
import crypto from 'node:crypto';
import {handleMessengerSlip} from '../services/messengerSlipok.js';
export function validateMessengerSignature(body, signature, secret = process.env.MESSENGER_APP_SECRET) {
  if (!secret || !Buffer.isBuffer(body) || typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = crypto.createHmac('sha256',secret).update(body).digest();
  return crypto.timingSafeEqual(expected,Buffer.from(signature.slice(7),'hex'));
}
export function createMessengerRouter(env = process.env, handler = handleMessengerSlip) {
  const router = express.Router();
  router.get('/messenger/webhook',(req,res) => {
    if (env.MESSENGER_VERIFY_TOKEN && req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === env.MESSENGER_VERIFY_TOKEN && typeof req.query['hub.challenge'] === 'string') {
      return res.status(200).type('text/plain').send(req.query['hub.challenge']);
    }
    res.sendStatus(403);
  });
  router.post('/messenger/webhook',(req,res) => {
    if (!validateMessengerSignature(req.rawBody,req.headers['x-hub-signature-256'],env.MESSENGER_APP_SECRET)) return res.sendStatus(401);
    if (req.body?.object !== 'page') return res.sendStatus(404);
    res.sendStatus(200);
    for (const entry of Array.isArray(req.body.entry) ? req.body.entry : []) {
      if (entry.id !== env.MESSENGER_PAGE_ID) continue;
      for (const event of Array.isArray(entry.messaging) ? entry.messaging : []) {
        Promise.resolve().then(() => handler(event,entry.id,fetch,env)).catch(() => console.error('[Messenger] processing or reply failed'));
      }
    }
  });
  return router;
}
export default createMessengerRouter();