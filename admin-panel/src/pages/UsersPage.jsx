import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers } from '../services/api';
import { Users, Search, Star, Phone, MapPin, Calendar } from 'lucide-react';

const UsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegistered, setFilterRegistered] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (user.display_name || '').toLowerCase().includes(searchLower) ||
      (user.first_name || '').toLowerCase().includes(searchLower) ||
      (user.last_name || '').toLowerCase().includes(searchLower) ||
      (user.phone_number || '').includes(search);

    const matchesFilter =
      filterRegistered === 'all' ||
      (filterRegistered === 'registered' && user.registered) ||
      (filterRegistered === 'unregistered' && !user.registered);

    return matchesSearch && matchesFilter;
  });

  const totalPoints = users.reduce((sum, u) => sum + parseInt(u.total_points || 0), 0);
  const totalRegistered = users.filter((u) => u.registered).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">ข้อมูลสมาชิก</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">สมาชิกทั้งหมด</p>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">ลงทะเบียนแล้ว</p>
          <p className="text-2xl font-bold text-green-600">{totalRegistered}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">ยังไม่ลงทะเบียน</p>
          <p className="text-2xl font-bold text-orange-600">{users.length - totalRegistered}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">แต้มรวมทั้งระบบ</p>
          <p className="text-2xl font-bold text-purple-600">{totalPoints.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRegistered}
            onChange={(e) => setFilterRegistered(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="registered">ลงทะเบียนแล้ว</option>
            <option value="unregistered">ยังไม่ลงทะเบียน</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">ชื่อ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">เบอร์โทร</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">ที่อยู่</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">แต้มคงเหลือ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">แต้มรวม</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">ใช้แล้ว</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">ยอดขาย</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">สถานะ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.user_id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.display_name || '-'}
                      </p>
                      {user.display_name && user.first_name && (
                        <p className="text-xs text-gray-500">LINE: {user.display_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-gray-700">
                      <Phone size={14} className="mr-1 text-gray-400" />
                      {user.phone_number || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start max-w-xs">
                      {user.address ? (
                        <>
                          <MapPin size={14} className="mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 text-xs truncate">{user.address}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-blue-600">
                      {parseInt(user.available_points).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {parseInt(user.total_points).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {parseInt(user.used_points).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {parseFloat(user.total_sales_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.registered
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {user.registered ? 'ลงทะเบียน' : 'ยังไม่ลงทะเบียน'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(user.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">ไม่พบข้อมูลสมาชิก</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 text-right">
        แสดง {filteredUsers.length} จาก {users.length} รายการ
      </div>
    </div>
  );
};

export default UsersPage;
