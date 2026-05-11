import axios from 'axios';

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Admin LINE User ID - ต้องตั้งค่าใน environment variable
const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID;

export const notifyAdminRedemption = async (redemptionDetails) => {
  if (!ADMIN_LINE_USER_ID || !CHANNEL_ACCESS_TOKEN) {
    console.warn('LINE notification not configured: Missing ADMIN_LINE_USER_ID or CHANNEL_ACCESS_TOKEN');
    return;
  }

  try {
    const message = {
      type: 'flex',
      altText: '🎁 มีการแลกของรางวัลใหม่',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎁 การแลกของรางวัลใหม่',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            }
          ],
          backgroundColor: '#8B5CF6'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'ของรางวัล',
                  size: 'sm',
                  color: '#999999'
                },
                {
                  type: 'text',
                  text: redemptionDetails.reward_name,
                  size: 'lg',
                  weight: 'bold',
                  wrap: true
                }
              ],
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'ลูกค้า:',
                      size: 'sm',
                      color: '#999999',
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: redemptionDetails.display_name || 'ไม่ระบุ',
                      size: 'sm',
                      wrap: true,
                      margin: 'sm'
                    }
                  ],
                  margin: 'lg'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'รหัสแลก:',
                      size: 'sm',
                      color: '#999999',
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: redemptionDetails.redemption_code,
                      size: 'sm',
                      weight: 'bold',
                      margin: 'sm'
                    }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'แต้มที่ใช้:',
                      size: 'sm',
                      color: '#999999',
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: `${redemptionDetails.points_used} แต้ม`,
                      size: 'sm',
                      margin: 'sm'
                    }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'เวลา:',
                      size: 'sm',
                      color: '#999999',
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: new Date(redemptionDetails.redeemed_at).toLocaleString('th-TH'),
                      size: 'sm',
                      margin: 'sm',
                      wrap: true
                    }
                  ],
                  margin: 'md'
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'กรุณาตรวจสอบและดำเนินการในแอดมินแพนเนล',
              size: 'xs',
              color: '#999999',
              wrap: true,
              align: 'center'
            }
          ]
        }
      }
    };

    await axios.post(
      LINE_MESSAGING_API,
      {
        to: ADMIN_LINE_USER_ID,
        messages: [message]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    console.log('Admin notification sent successfully');
  } catch (error) {
    console.error('Error sending LINE notification:', error.response?.data || error.message);
  }
};

export const notifyUserRedemptionSuccess = async (lineUserId, redemptionDetails) => {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.warn('LINE notification not configured: Missing CHANNEL_ACCESS_TOKEN');
    return;
  }

  try {
    const message = {
      type: 'flex',
      altText: '✅ แลกของรางวัลสำเร็จ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '✅ แลกของรางวัลสำเร็จ',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            }
          ],
          backgroundColor: '#10B981'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: redemptionDetails.reward_name,
              size: 'xl',
              weight: 'bold',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'รหัสแลกของรางวัล',
                  size: 'sm',
                  color: '#999999'
                },
                {
                  type: 'text',
                  text: redemptionDetails.redemption_code,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#8B5CF6',
                  align: 'center',
                  margin: 'md'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                {
                  type: 'text',
                  text: 'แต้มที่ใช้:',
                  size: 'sm',
                  color: '#999999',
                  flex: 0
                },
                {
                  type: 'text',
                  text: `${redemptionDetails.points_used} แต้ม`,
                  size: 'sm',
                  margin: 'sm'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'text',
              text: 'กรุณานำรหัสนี้ไปแสดงเพื่อรับของรางวัล',
              size: 'xs',
              color: '#999999',
              wrap: true,
              margin: 'lg',
              align: 'center'
            }
          ]
        }
      }
    };

    await axios.post(
      LINE_MESSAGING_API,
      {
        to: lineUserId,
        messages: [message]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    console.log('User notification sent successfully');
  } catch (error) {
    console.error('Error sending user LINE notification:', error.response?.data || error.message);
  }
};
