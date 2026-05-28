import { useEffect, useState } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { getRewards, getPoints, redeemReward } from '../services/api';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { Gift, Star, AlertCircle, CheckCircle } from 'lucide-react';

const RewardsPage = () => {
  const { isReady, accessToken, liff } = useLiff();
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isReady && accessToken) {
        try {
          const [rewardsData, pointsData] = await Promise.all([
            getRewards(accessToken),
            getPoints(accessToken)
          ]);
          setRewards(rewardsData);
          setPoints(pointsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isReady, accessToken]);

  const handleRedeem = async (reward) => {
    if (points.available_points < reward.points_required) {
      liff.openWindow({
        url: 'https://line.me',
        external: false
      });
      return;
    }

    const confirmed = window.confirm(
      `ต้องการแลก "${reward.name}" ใช้ ${reward.points_required} แต้มใช่หรือไม่?`
    );

    if (!confirmed) return;

    setRedeeming(true);
    try {
      const result = await redeemReward(accessToken, reward.reward_id);
      
      liff.openWindow({
        url: 'https://line.me',
        external: false
      });

      const updatedPoints = await getPoints(accessToken);
      setPoints(updatedPoints);
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('เกิดข้อผิดพลาดในการแลกของรางวัล: ' + error.message);
    } finally {
      setRedeeming(false);
    }
  };

  if (!isReady || loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">แต้มคงเหลือ</p>
              <p className="text-3xl font-bold text-primary">
                {points?.available_points?.toLocaleString() || 0}
              </p>
            </div>
            <Star size={48} className="text-yellow-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">ของรางวัล</h2>

        {rewards.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            <Gift size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">ยังไม่มีของรางวัล</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rewards.map((reward) => {
              const canRedeem = points?.available_points >= reward.points_required && reward.stock > 0;
              
              return (
                <div
                  key={reward.reward_id}
                  className="bg-white rounded-xl shadow overflow-hidden"
                >
                  {reward.image_url && (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={reward.image_url}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-4">
                  <div className="flex items-start">
                    {!reward.image_url && (
                      <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-3 mr-4">
                        <Gift size={32} className="text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {reward.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {reward.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-primary">
                          <Star size={16} className="mr-1" />
                          <span className="font-bold">{reward.points_required.toLocaleString()}</span>
                          <span className="text-sm ml-1">แต้ม</span>
                        </div>
                        
                        <span className="text-sm text-gray-500">
                          คงเหลือ: {reward.stock}
                        </span>
                      </div>

                      {reward.stock === 0 ? (
                        <div className="mt-3 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-center text-sm">
                          <AlertCircle size={16} className="inline mr-1" />
                          สินค้าหมด
                        </div>
                      ) : canRedeem ? (
                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={redeeming}
                          className="mt-3 w-full bg-primary hover:bg-secondary text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {redeeming ? 'กำลังแลก...' : 'แลกเลย'}
                        </button>
                      ) : (
                        <div className="mt-3 bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-center text-sm">
                          <AlertCircle size={16} className="inline mr-1" />
                          แต้มไม่เพียงพอ (ต้องการอีก {(reward.points_required - points?.available_points).toLocaleString()} แต้ม)
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RewardsPage;
