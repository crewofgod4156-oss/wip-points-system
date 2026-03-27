import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { updatePhoneNumber } from '../services/api';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { Phone, CheckCircle, AlertCircle } from 'lucide-react';

const LinkPhonePage = () => {
  const { isReady, accessToken } = useLiff();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleaned = phone.replace(/[^0-9]/g, '');
    if (!/^0\d{8,9}$/.test(cleaned)) {
      setError('กรุณากรอกเบอร์โทรให้ถูกต้อง เช่น 0812345678');
      setLoading(false);
      return;
    }

    try {
      await updatePhoneNumber(accessToken, cleaned);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'ไม่สามารถบันทึกเบอร์โทรได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return <Loading />;

  if (success) {
    return (
      <Layout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">ผูกเบอร์โทรสำเร็จ!</h2>
            <p className="text-green-600">{phone}</p>
            <p className="text-sm text-gray-500 mt-2">กำลังกลับหน้าหลัก...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center mb-3">
            <Phone size={28} className="mr-3" />
            <h2 className="text-xl font-bold">ผูกเบอร์โทรศัพท์</h2>
          </div>
          <p className="text-sm opacity-90">
            กรุณาผูกเบอร์โทรเพื่อรับแต้มสะสมจากการซื้อสินค้า
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow mb-4">
          <div className="flex items-center mb-3">
            <Phone size={20} className="text-blue-600 mr-2" />
            <h3 className="font-bold text-gray-800">กรอกเบอร์โทรศัพท์</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            กรุณากรอกเบอร์โทรที่ใช้ซื้อสินค้ากับทางร้าน
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678"
              maxLength={10}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-center tracking-widest focus:border-blue-500 focus:outline-none mb-4"
            />
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'ยืนยันเบอร์โทร'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-xl p-4 flex items-start mb-4">
            <AlertCircle size={20} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            * เบอร์โทรจะใช้สำหรับผูกข้อมูลยอดซื้อกับบัญชี LINE ของคุณเท่านั้น
            <br />
            * เบอร์โทร 1 เบอร์ ผูกได้กับ LINE 1 บัญชีเท่านั้น
            <br />
            * หากต้องการเปลี่ยนเบอร์ กรุณาติดต่อร้านค้า
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LinkPhonePage;
