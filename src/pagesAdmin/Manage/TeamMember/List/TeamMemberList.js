import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash, FaSpinner } from 'react-icons/fa';

function TeamMemberList() {
  const [users, setUsers] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingDeleteID, setLoadingDeleteID] = useState(null);
  const [confirmingDeleteID, setConfirmingDeleteID] = useState(null); // mở modal xoá

  useEffect(() => {
    axios.get(`${BASE_URL}/api/teammember/users?role=user`).then((res) => {
      setUsers(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedUserID) {
      axios.get(`${BASE_URL}/api/team-members?userID=${selectedUserID}`).then((res) => {
        setTeamMembers(res.data);
      });
    } else {
      setTeamMembers([]);
    }
  }, [selectedUserID]);

  const handleConfirmDelete = async () => {
    if (!confirmingDeleteID) return;
    setLoadingDeleteID(confirmingDeleteID);
    try {
      await axios.delete(`${BASE_URL}/api/team-members/${confirmingDeleteID}`);
      setTeamMembers((prev) => prev.filter((m) => m.teamMemberID !== confirmingDeleteID));
    } catch (error) {
      console.error('Lỗi xoá team member:', error);
      alert('❌ Không thể xoá thành viên');
    } finally {
      setLoadingDeleteID(null);
      setConfirmingDeleteID(null);
    }
  };

  return (
    <div className="pt-[50px]">
      <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Danh sách thành viên tổ</h1>

        <label className="block mb-2 text-gray-600">Chọn nhân viên:</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          value={selectedUserID || ''}
          onChange={(e) => setSelectedUserID(e.target.value)}
        >
          <option value="">-- Chọn --</option>
          {users.map((user) => (
            <option key={user.userID} value={user.userID}>
              {user.fullName}
            </option>
          ))}
        </select>

        <ul className="space-y-2">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <li
                key={member.teamMemberID}
                className="p-3 border rounded-lg shadow-sm flex justify-between items-center hover:bg-gray-50"
              >
                <span>{member.name}</span>
                <button
                  onClick={() => setConfirmingDeleteID(member.teamMemberID)}
                  className="text-red-500 hover:text-red-600"
                  disabled={loadingDeleteID === member.teamMemberID}
                >
                  {loadingDeleteID === member.teamMemberID ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                </button>
              </li>
            ))
          ) : (
            <p className="text-gray-500 italic">
              {selectedUserID ? 'Không có thành viên nào.' : 'Vui lòng chọn nhân viên.'}
            </p>
          )}
        </ul>
      </div>

      {/* Modal xác nhận xoá */}
      {confirmingDeleteID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-lg text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Xác nhận xoá</h2>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xoá thành viên này không?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmingDeleteID(null)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                disabled={loadingDeleteID === confirmingDeleteID}
              >
                {loadingDeleteID === confirmingDeleteID && <FaSpinner className="animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamMemberList;
