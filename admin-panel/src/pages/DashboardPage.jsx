import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSalesRecords, processPoints, getPendingSalesPreview, deleteSalesBatch } from '../services/api';
import { TrendingUp, Users, DollarSign, Calendar, Play, Trash2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const DashboardPage = () => {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);
  const [pendingBatches, setPendingBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesData, previewData] = await Promise.all([
        getSalesRecords(token),
        getPendingSalesPreview(token)
      ]);
      setSales(salesData);
      setPendingBatches(previewData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPoints = async () => {
    const totalUnmatched = pendingBatches.reduce((sum, b) => sum + b.unmatched_count, 0);
    const totalMatched = pendingBatches.reduce((sum, b) => sum + b.matched_count, 0);
    
    let msg = `ต้องการประมวลผลแต้มใช่หรือไม่?\n\n`;
    msg += `✅ จับคู่สำเร็จ: ${totalMatched} รายการ (จะได้รับแต้ม)\n`;
    msg += `⚠️ จับคู่ไม่สำเร็จ: ${totalUnmatched} รายการ (จะถูกข้าม)\n\n`;
    msg += `หมายเหตุ: รายการที่จับคู่ไม่สำเร็จจะถูกข้ามไป ไม่ได้รับแต้ม`;

    if (!confirm(msg)) return;

    setProcessing(true);
    try {
      const result = await processPoints(token);
      alert(`ประมวลผลสำเร็จ!\n✅ ประมวลผล: ${result.processed} รายการ\n⚠️ ข้าม: ${result.skipped} รายการ`);
      fetchData();
    } catch (error) {
      console.error('Error processing points:', error);
      alert('เกิดข้อผิดพลาดในการประมวลผล');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBatch = async (batchId, recordCount) => {
    if (!confirm(`ต้องการลบชุดข้อมูลนี้ (${recordCount} รายการ) ใช่หรือไม่?\n\nข้อมูลจะถูกลบถาวร ไม่มีแต้มถูกคำนวณ`)) {
      return;
    }
    try {
      await deleteSalesBatch(token, batchId);
      fetchData();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const stats = {
    totalSales: sales.reduce((sum, s) => sum + parseFloat(s.amount), 0),
    processedSales: sales.filter(s => s.processed).length,
    pendingSales: sales.filter(s => !s.processed).length,
    totalRecords: sales.length
  };

  const totalPendingMatched = pendingBatches.reduce((sum, b) => sum + b.matched_count, 0);
  const totalPendingUnmatched = pendingBatches.reduce((sum, b) => sum + b.unmatched_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ยอดขายทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">
                ฿{stats.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign size={40} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalRecords.toLocaleString()}
              </p>
            </div>
            <Calendar size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ประมวลผลแล้ว</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.processedSales.toLocaleString()}
              </p>
            </div>
            <TrendingUp size={40} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">รอดำเนินการ</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.pendingSales.toLocaleString()}
              </p>
            </div>
            <Users size={40} className="text-orange-500" />
          </div>
        </div>
      </div>

      {pendingBatches.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">📋 ตรวจสอบข้อมูลก่อนประมวลผล</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ตรวจสอบข้อมูลด้านล่างให้ถูกต้อง แล้วกด "ประมวลผลแต้ม" เพื่อคำนวณแต้ม หรือ "ลบ" เพื่อยกเลิกชุดข้อมูลที่ผิด
                </p>
              </div>
              <button
                onClick={handleProcessPoints}
                disabled={processing || totalPendingMatched === 0}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Play size={20} className="mr-2" />
                {processing ? 'กำลังประมวลผล...' : 'ประมวลผลแต้ม'}
              </button>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle size={16} className="text-green-600 mr-2" />
                <span className="text-sm font-semibold text-green-800">จับคู่สำเร็จ: {totalPendingMatched} รายการ</span>
              </div>
              <div className="flex items-center bg-orange-50 px-3 py-2 rounded-lg">
                <AlertTriangle size={16} className="text-orange-600 mr-2" />
                <span className="text-sm font-semibold text-orange-800">จับคู่ไม่สำเร็จ: {totalPendingUnmatched} รายการ (จะถูกข้าม)</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingBatches.map((batch) => (
              <div key={batch.batch_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setExpandedBatch(expandedBatch === batch.batch_id ? null : batch.batch_id)}
                      className="flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      {expandedBatch === batch.batch_id ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                      {expandedBatch === batch.batch_id ? 'ซ่อน' : 'ดูรายละเอียด'}
                    </button>
                    <span className="text-sm text-gray-500">
                      อัพโหลดเมื่อ: {new Date(batch.uploaded_at).toLocaleString('th-TH')}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {batch.records.length} รายการ | ยอดรวม ฿{batch.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                      ✅ {batch.matched_count}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold">
                      ⚠️ {batch.unmatched_count}
                    </span>
                    <button
                      onClick={() => handleDeleteBatch(batch.batch_id, batch.records.length)}
                      className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 size={14} className="mr-1" />
                      ลบชุดนี้
                    </button>
                  </div>
                </div>

                {expandedBatch === batch.batch_id && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">เบอร์โทร</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">ชื่อ (จากไฟล์)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">ที่อยู่</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">วันที่ขาย</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600">ยอดขาย</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600">แต้มที่จะได้</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">สถานะจับคู่</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">ชื่อสมาชิก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {batch.records.map((record) => (
                          <tr key={record.record_id} className={record.is_matched ? 'bg-white' : 'bg-orange-50'}>
                            <td className="px-3 py-2 font-mono">{record.phone_number || '-'}</td>
                            <td className="px-3 py-2">{record.customer_name || '-'}</td>
                            <td className="px-3 py-2 text-xs max-w-[150px] truncate">{record.customer_address || '-'}</td>
                            <td className="px-3 py-2">{new Date(record.sale_date).toLocaleDateString('th-TH')}</td>
                            <td className="px-3 py-2 text-right font-semibold">฿{parseFloat(record.amount).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold text-blue-600">
                              {record.is_matched ? Math.floor(parseFloat(record.amount) / 100) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {record.is_matched ? (
                                <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
                                  ✅ จับคู่สำเร็จ
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 font-semibold">
                                  ⚠️ ไม่พบสมาชิก
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {record.is_matched
                                ? (record.matched_first_name && record.matched_last_name
                                    ? `${record.matched_first_name} ${record.matched_last_name}`
                                    : record.matched_display_name || '-')
                                : <span className="text-orange-600 text-xs">เบอร์นี้ยังไม่ลงทะเบียน</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingBatches.length === 0 && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
          <p className="text-green-800 font-semibold">ไม่มีข้อมูลรอดำเนินการ</p>
          <p className="text-green-600 text-sm mt-1">ยอดขายทั้งหมดถูกประมวลผลแล้ว</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">ยอดขายล่าสุด (ประมวลผลแล้ว)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อลูกค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เบอร์โทร</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดขาย</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">แต้มที่ได้</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.filter(s => s.processed).slice(0, 20).map((sale) => (
                <tr key={sale.record_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(sale.sale_date).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {sale.customer_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {sale.phone_number || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-semibold">
                    ฿{parseFloat(sale.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 text-right font-semibold">
                    {sale.points_earned || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ประมวลผลแล้ว
                    </span>
                  </td>
                </tr>
              ))}
              {sales.filter(s => s.processed).length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    ยังไม่มีข้อมูลที่ประมวลผลแล้ว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
