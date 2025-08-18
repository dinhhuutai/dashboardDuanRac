import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash, FaEdit } from 'react-icons/fa';
import http from '~/api/http';

function UserList() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await http.get(`${BASE_URL}/users/get`);
      setUsers(res.data);
    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user) => {
    if (loading) return;
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({ ...user, password: '' });
    setEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await http.delete(`${BASE_URL}/users/delete/${selectedUser.userID}`);
      await fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi khi xóa:', error);
    } finally {
      setLoading(false);
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    try {
      await http.put(`${BASE_URL}/users/update/${editFormData.userID}`, editFormData);
      await fetchUsers();
      setEditModalOpen(false);
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCheck = (val) => (val ? '✅' : '❌');

  return (
    <div style={{ padding: 20 }} className="relative">
      <div className="bg-white p-4 rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📋 Danh sách người dùng</h1>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-[1300px] w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Username</th>
                <th className="p-3 border">Họ tên</th>
                <th className="p-3 border">SĐT</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border text-center">Cân rác</th>
                <th className="p-3 border text-center">Cân mực</th>
                <th className="p-3 border text-center">Sửa báo cáo</th>
                <th className="p-3 border text-center">Lịch sử cân</th>
                <th className="p-3 border text-center">QL QR</th>
                <th className="p-3 border text-center">QL User</th>
                <th className="p-3 border text-center">QL Rác</th>
                <th className="p-3 border text-center">QL Tổ</th>
                <th className="p-3 border text-center">QL Góp ý</th>
                <th className="p-3 border text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userID} className="hover:bg-gray-50">
                  <td className="p-3 border">{user.userID}</td>
                  <td className="p-3 border">{user.username}</td>
                  <td className="p-3 border">{user.fullName}</td>
                  <td className="p-3 border">{user.phone}</td>
                  <td className="p-3 border">{user.role}</td>
                  <td className="p-3 border text-center">{renderCheck(user.operationType === 'canrac' || user.operationType === 'full')}</td>
                  <td className="p-3 border text-center">{renderCheck(user.operationType === 'canmuc' || user.operationType === 'full')}</td>
                  <td className="p-3 border text-center">{renderCheck(user.roleEditReport)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.actionHistoryWeigh)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.managerQRcode)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.managerUser)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.managerTrash)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.managerTeamMember)}</td>
                  <td className="p-3 border text-center">{renderCheck(user.managerFeedback)}</td>
                  <td className="p-3 border text-center space-x-6">
                    <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:text-blue-800">
                      <FaEdit className="inline" />
                    </button>
                    {user.role === 'user' && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash className="inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal xác nhận xoá */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-xl">
              <p className="mb-4 text-lg font-semibold">❓ Xoá người dùng <span className="text-red-600">{selectedUser?.fullName}</span>?</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Huỷ</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-500 text-white rounded">
                  {loading ? 'Đang xoá...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal chỉnh sửa */}
        {editModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-xl w-full max-w-3xl shadow-xl">
      <h2 className="text-xl font-semibold mb-4">✏️ Cập nhật người dùng</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          name="fullName"
          placeholder="Họ tên"
          className="border p-2 rounded"
          value={editFormData.fullName}
          onChange={handleEditChange}
        />
        <input
          name="phone"
          placeholder="SĐT"
          className="border p-2 rounded"
          value={editFormData.phone}
          onChange={handleEditChange}
        />
        <input
          name="password"
          placeholder="Mật khẩu mới (nếu có)"
          className="border p-2 rounded"
          value={editFormData.password}
          onChange={handleEditChange}
        />
        <select
          name="operationType"
          value={editFormData.operationType}
          onChange={handleEditChange}
          className="border p-2 rounded"
        >
          <option value="">-- Quyền nghiệp vụ --</option>
          <option value="canrac">Cân rác</option>
          <option value="canmuc">Cân mực</option>
          <option value="full">Cả 2</option>
        </select>
      </div>

      <h3 className="text-md font-semibold mb-2">🔐 Quyền quản lý:</h3>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {[
          ['roleEditReport', 'Sửa báo cáo'],
          ['actionHistoryWeigh', 'Lịch sử cân'],
          ['managerQRcode', 'Quản lý QR'],
          ['managerUser', 'Quản lý người dùng'],
          ['managerTrash', 'Quản lý thùng rác'],
          ['managerTeamMember', 'Quản lý tổ / chuyền'],
          ['managerFeedback', 'Quản lý góp ý'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={editFormData[key] || false}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  [key]: e.target.checked,
                }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button
          onClick={() => setEditModalOpen(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Huỷ
        </button>
        <button
          onClick={handleEditSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật'
          )}
        </button>

      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default UserList;
