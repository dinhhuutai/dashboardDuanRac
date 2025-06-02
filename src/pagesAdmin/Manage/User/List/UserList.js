import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash } from 'react-icons/fa';

function UserList() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/get`);
      setUsers(res.data);
    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user) => {
    if (loading) return; // Chặn khi đang xoá
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/users/delete/${selectedUser.userID}`);
      await fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi khi xóa:', error);
    } finally {
      setLoading(false);
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📋 Danh sách người dùng</h1>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Họ tên</th>
              <th className="p-3 border">SĐT</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userID} className="hover:bg-gray-50 transition duration-150 text-gray-700 text-sm">
                <td className="p-3 border">{user.userID}</td>
                <td className="p-3 border">{user.username}</td>
                <td className="p-3 border">{user.fullName}</td>
                <td className="p-3 border">{user.phone}</td>
                <td className="p-3 border">{user.role}</td>
                <td className="p-3 border text-center">
                  {user.role === 'user' && (
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={loading}
                      className={`inline-flex items-center justify-center text-red-600 hover:text-red-800 transition duration-200 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Xóa người dùng"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal xác nhận xóa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-xl animate-fade-in">
            <p className="mb-4 text-lg font-semibold text-gray-800">
              ❓Bạn có chắc chắn muốn xoá người dùng <br />
              <span className="text-red-600">{selectedUser?.fullName}</span>?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={loading}
              >
                {loading ? 'Đang xóa...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;
