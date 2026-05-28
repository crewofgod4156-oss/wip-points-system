import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadSalesFile } from '../services/api';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';

const UploadSalesPage = () => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError('กรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv เท่านั้น');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('กรุณาเลือกไฟล์');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await uploadSalesFile(token, file);
      setResult(response);
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'mobilephone_number,name,address,sale_date,sale_amount\n0812345678,สมชาย ใจดี,123 ถ.สุขุมวิท กรุงเทพฯ,2024-03-26,1000\n0898765432,สมหญิง รักดี,456 ถ.พหลโยธิน กรุงเทพฯ,2024-03-26,500';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sales_template.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">อัพโหลดยอดขาย</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">คำแนะนำ</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>รองรับไฟล์ .xlsx, .xls และ .csv</li>
          <li>ไฟล์ต้องมีคอลัมน์: mobilephone_number, name, address, sale_date, sale_amount</li>
          <li>วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD (เช่น 2024-03-26)</li>
          <li>ยอดขายต้องเป็นตัวเลข (เช่น 1000, 500.50)</li>
          <li>แต้มจะถูกคำนวณอัตรา 100 บาท = 1 แต้ม</li>
          <li>แต้มจะอัพเดทในวันถัดไป (T+1) โดยอัตโนมัติ</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-3 flex items-center text-blue-600 hover:text-blue-700 font-semibold"
        >
          <Download size={16} className="mr-1" />
          ดาวน์โหลดไฟล์ตัวอย่าง
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <FileSpreadsheet size={64} className="mx-auto text-gray-400 mb-4" />
          
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <label
            htmlFor="fileInput"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
          >
            <Upload size={20} className="inline mr-2" />
            เลือกไฟล์
          </label>
          
          {file && (
            <div className="mt-4">
              <p className="text-gray-700 font-semibold">{file.name}</p>
              <p className="text-sm text-gray-500">
                ขนาด: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดและประมวลผล'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">เกิดข้อผิดพลาด</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">อัพโหลดสำเร็จ!</h4>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-600">รายการที่ประมวลผล</p>
                  <p className="text-lg font-bold text-green-600">{result.recordsProcessed}</p>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="bg-white rounded p-3">
                    <p className="text-xs text-gray-600">ข้อผิดพลาด</p>
                    <p className="text-lg font-bold text-orange-600">{result.errors.length}</p>
                  </div>
                )}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 bg-white rounded p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">รายละเอียดข้อผิดพลาด:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600">
                        แถว {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSalesPage;
