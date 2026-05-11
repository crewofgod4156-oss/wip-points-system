import { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { getRedemptions } from '../services/api';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RedemptionHistoryPage = () => {
  const { liff, isReady } = useLiff();
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && liff.isLoggedIn()) {
      fetchRedemptions();
    }
  }, [isReady, liff]);

  const fetchRedemptions = async () => {
    try {
      const accessToken = liff.getAccessToken();
      const data = await getRedemptions(accessToken);
      setRedemptions(data);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'รอดำเนินการ',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      completed: {
        icon: CheckCircle,
        text: 'สำเร็จ',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      },
      cancelled: {
        icon: XCircle,
        text: 'ยกเลิก',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor}`}>
        <Icon size={16} className={`mr-1 ${config.iconColor}`} />
        {config.text}
      </span>
    );
  };

  if (!isReady || loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
          <h1 className="text-2xl font-bold flex items-center">
            <Package className="mr-2" size={28} />
            ประวัติการแลกของรางวัล
          </h1>
          <p className="text-purple-100 mt-1">ตรวจสอบสถานะการแลกของรางวัล</p>
        </div>

        <div className="p-4 space-y-4">
          {redemptions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Package className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">ยังไม่มีประวัติการแลก</p>
              <p className="text-gray-400 text-sm mt-2">เมื่อคุณแลกของรางวัล จะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.redemption_id}
                  className="bg-white rounded-xl shadow-md p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {redemption.reward_name}
                      </h3>
                      {redemption.reward_description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {redemption.reward_description}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(redemption.status)}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">รหัสแลกของรางวัล:</span>
                      <span className="font-mono font-bold text-purple-600">
                        {redemption.redemption_code}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">แต้มที่ใช้:</span>
                      <span className="font-semibold text-gray-800">
                        {redemption.points_used} แต้ม
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">วันที่แลก:</span>
                      <span className="text-gray-800">
                        {new Date(redemption.redeemed_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {redemption.completed_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">วันที่เสร็จสิ้น:</span>
                        <span className="text-gray-800">
                          {new Date(redemption.completed_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {redemption.notes && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-start">
                          <AlertCircle size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{redemption.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RedemptionHistoryPage;
