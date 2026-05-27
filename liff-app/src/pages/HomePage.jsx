import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { getProfile } from '../services/api';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { Star, TrendingUp, Gift, Phone } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { isReady, profile, accessToken } = useLiff();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (isReady && accessToken) {
        try {
          const data = await getProfile(accessToken);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isReady, accessToken]);

  useEffect(() => {
    if (!loading && userData && !userData.user?.registered) {
      navigate('/register');
    }
  }, [loading, userData, navigate]);

  if (!isReady || loading) {
    return <Loading />;
  }

  if (!userData?.user?.registered) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center mb-4">
            {profile?.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full border-4 border-white mr-4"
              />
            )}
            <div>
              <h2 className="text-xl font-bold">สวัสดี, {userData?.user?.firstName || userData?.user?.displayName || 'คุณลูกค้า'}</h2>
              <p className="text-sm opacity-90">ยินดีต้อนรับสู่ระบบสะสมแต้ม</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">แต้มสะสมของคุณ</p>
                <p className="text-4xl font-bold mt-1">
                  {userData?.points?.available_points?.toLocaleString() || 0}
                </p>
                <p className="text-xs opacity-75 mt-1">แต้ม</p>
              </div>
              <Star size={48} className="opacity-50" />
            </div>
          </div>
        </div>

        {!userData?.user?.phoneNumber && (
          <button
            onClick={() => navigate('/link-phone')}
            className="w-full bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6 flex items-center shadow-sm hover:bg-amber-100 transition-colors"
          >
            <div className="bg-amber-400 rounded-full p-2 mr-3 flex-shrink-0">
              <Phone size={20} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-amber-800 text-sm">ยังไม่ได้ผูกเบอร์โทร</p>
              <p className="text-xs text-amber-600">กดที่นี่เพื่อผูกเบอร์และรับแต้มสะสม</p>
            </div>
            <span className="text-amber-400 text-xl">›</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center text-blue-600 mb-2">
              <TrendingUp size={20} className="mr-2" />
              <span className="text-sm font-semibold">แต้มทั้งหมด</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {userData?.points?.total_points?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center text-orange-600 mb-2">
              <Gift size={20} className="mr-2" />
              <span className="text-sm font-semibold">แต้มที่ใช้ไป</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {userData?.points?.used_points?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">วิธีการสะสมแต้ม</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">ซื้อสินค้า</p>
                <p className="text-sm text-gray-600">ทุกๆ 100 บาท = 1 แต้ม</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">รับแต้มอัตโนมัติ</p>
                <p className="text-sm text-gray-600">แต้มจะเข้าวันถัดไป (T+1)</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 rounded-full p-2 mr-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">แลกของรางวัล</p>
                <p className="text-sm text-gray-600">นำแต้มไปแลกของรางวัลได้ทันที</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
