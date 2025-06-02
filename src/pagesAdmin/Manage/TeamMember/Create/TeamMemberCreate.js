import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaCheckCircle } from 'react-icons/fa';

const TeamMemberCreate = () => {
  const [name, setName] = useState('');
  const [userID, setUserID] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/teammember/users?role=user`)
      .then((response) => setUsers(response.data))
      .catch((error) => console.error('Error fetching users:', error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/team-members`, {
        name,
        userID: parseInt(userID),
      });
      setName('');
      setUserID('');
      setShowModal(true);
    } catch (error) {
      console.error('Error creating team member:', error);
      alert('❌ Failed to create team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[50px]">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create New Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team member name"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">User</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.userID} value={user.userID}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {loading ? 'Creating...' : 'Create Team Member'}
          </button>
        </form>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <FaCheckCircle className="mx-auto text-green-500" size={48} />
            <h3 className="text-xl font-bold mt-4">Success!</h3>
            <p className="text-gray-600 mt-2">Team member created successfully.</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberCreate;
