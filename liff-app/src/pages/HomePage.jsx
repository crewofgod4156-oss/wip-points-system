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

        <div className="bg-white rounded-xl p-6 shadow mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">เงื่อนไขการสะสมแต้ม</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-800 mb-1">1. อายุการใช้งานแต้ม</p>
              <p className="text-sm text-gray-600 leading-relaxed">แต้มมีอายุ 1 ปี นับจากวันที่ได้รับ</p>
              <p className="text-sm text-gray-600 leading-relaxed">แต้มที่หมดอายุจะถูกตัดออกโดยอัตโนมัติ โดยไม่สามารถเรียกคืนได้</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">2. สิทธิ์การเข้าร่วมรายการ</p>
              <p className="text-sm text-gray-600 leading-relaxed">สำหรับ ลูกค้ารายย่อยเท่านั้น</p>
              <p className="text-sm text-gray-600 leading-relaxed">ไม่รวมลูกค้า ราคาส่ง ตัวแทนจำหน่าย หรือคู่ค้าทางธุรกิจ</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">3. การใช้แต้ม / การแลกรางวัล</p>
              <p className="text-sm text-gray-600 leading-relaxed">สามารถใช้แต้มแลกรับของรางวัลหรือสิทธิพิเศษตามที่บริษัทกำหนด แต้มไม่สามารถโอนรวม หรือใช้ข้ามบัญชีได้</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">4. ข้อจำกัดของแต้ม</p>
              <p className="text-sm text-gray-600 leading-relaxed">แต้มสะสมไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสด</p>
              <p className="text-sm text-gray-600 leading-relaxed">ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่นได้ (ตามเงื่อนไขที่กำหนด)</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">5. ของรางวัลและสิทธิประโยชน์</p>
              <p className="text-sm text-gray-600 leading-relaxed">ของรางวัลมีจำนวนจำกัด และเป็นไปตามที่บริษัทกำหนด</p>
              <p className="text-sm text-gray-600 leading-relaxed">บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงของรางวัลเป็นรายการอื่นที่มีมูลค่าใกล้เคียงกัน</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">6. การเปลี่ยนแปลงเงื่อนไข</p>
              <p className="text-sm text-gray-600 leading-relaxed">บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงรายละเอียด เงื่อนไข อัตราการสะสมแต้มหรือของรางวัลได้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">7. การรับประกันสินค้า</p>
              <p className="text-sm text-gray-600 leading-relaxed">สินค้าของรางวัลรับประกันตามมาตรฐานของบริษัท และเงื่อนไขของสินค้าแต่ละประเภท</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
