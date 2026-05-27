import { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { getRewards, redeemReward, getPoints } from '../services/api';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { Gift, Star, Package, AlertCircle, CheckCircle } from 'lucide-react';

const RedeemPage = () => {
  const { liff, isReady } = useLiff();
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isReady && liff.isLoggedIn()) {
      fetchData();
    }
  }, [isReady, liff]);

  const fetchData = async () => {
    try {
      const accessToken = liff.getAccessToken();
      const [rewardsData, pointsData] = await Promise.all([
        getRewards(accessToken),
        getPoints(accessToken)
      ]);
      console.log('Rewards data:', rewardsData);
      console.log('First reward image_url:', rewardsData[0]?.image_url);
      setRewards(rewardsData);
      setPoints(pointsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (points.available_points < reward.points_required) {
      setError('แต้มของคุณไม่เพียงพอ');
      return;
    }

    if (reward.stock <= 0) {
      setError('ของรางวัลหมดแล้ว');
      return;
    }

    if (!confirm(`ต้องการแลก "${reward.name}" ใช้ ${reward.points_required} แต้ม?`)) {
      return;
    }

    setRedeeming(reward.reward_id);
    setError('');
    setSuccess('');

    try {
      const accessToken = liff.getAccessToken();
      const result = await redeemReward(accessToken, reward.reward_id);
      
      setSuccess(`แลกสำเร็จ! รหัสแลกของรางวัล: ${result.redemption_code}`);
      
      await fetchData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Redeem error:', error);
      setError(error.response?.data?.error || 'ไม่สามารถแลกของรางวัลได้');
    } finally {
      setRedeeming(null);
    }
  };

  if (!isReady || loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Gift className="mr-2" size={28} />
                แลกของรางวัล
              </h1>
              <p className="text-purple-100 mt-1">เลือกของรางวัลที่คุณต้องการ</p>
            </div>
            <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-xs text-purple-100">แต้มคงเหลือ</p>
              <p className="text-2xl font-bold flex items-center">
                <Star className="mr-1" size={20} fill="currentColor" />
                {points?.available_points || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
              <div>
                <p className="text-red-800 font-semibold">เกิดข้อผิดพลาด</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start">
              <CheckCircle className="text-green-500 mr-3 flex-shrink-0" size={24} />
              <div>
                <p className="text-green-800 font-semibold">สำเร็จ!</p>
                <p className="text-green-600 text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {rewards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Package className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">ยังไม่มีของรางวัล</p>
              <p className="text-gray-400 text-sm mt-2">กรุณารอของรางวัลใหม่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward) => {
                const canAfford = points?.available_points >= reward.points_required;
                const inStock = reward.stock > 0;
                const canRedeem = canAfford && inStock;

                return (
                  <div
                    key={reward.reward_id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden ${
                      !canRedeem ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', reward.image_url);
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', reward.image_url);
                            console.error('Error event:', e);
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon flex items-center justify-center w-full h-full';
                              fallback.innerHTML = '<svg class="w-24 h-24 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <>
                          {console.log('No image_url for reward:', reward.name)}
                          <Gift size={64} className="text-purple-300" />
                        </>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{reward.name}</h3>
                        <div className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <Star size={14} fill="currentColor" className="mr-1" />
                          {reward.points_required}
                        </div>
                      </div>
                      
                      {reward.description && (
                        <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {inStock ? (
                            <span className="text-green-600 font-medium">
                              คงเหลือ: {reward.stock} ชิ้น
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">หมดแล้ว</span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canRedeem || redeeming === reward.reward_id}
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                            canRedeem
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {redeeming === reward.reward_id ? (
                            'กำลังแลก...'
                          ) : !inStock ? (
                            'หมดแล้ว'
                          ) : !canAfford ? (
                            'แต้มไม่พอ'
                          ) : (
                            'แลกเลย'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RedeemPage;
