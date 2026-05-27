import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const validateSignature = (body, signature) => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(JSON.stringify(body))
    .digest('base64');
  return hash === signature;
};

router.post('/webhook', (req, res) => {
  const signature = req.headers['x-line-signature'];
  
  if (!signature || !validateSignature(req.body, signature)) {
    console.error('Invalid LINE signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const events = req.body.events || [];
  
  events.forEach(event => {
    console.log('Received LINE event:', JSON.stringify(event, null, 2));
    
    if (event.type === 'message' && event.message.type === 'text') {
      console.log(`Message from ${event.source.userId}: ${event.message.text}`);
    }
  });

  res.status(200).json({ success: true });
});

export default router;
