import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';

function UserCreate() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '1',
    phone: '0987654321',
    role: 'user',
    createdBy: 1, // thay bằng userID đang đăng nhập
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${BASE_URL}/user`, formData);
      setMessage('✅ Tạo tài khoản thành công!');
      setFormData({
        fullName: '',
        username: '',
        password: '1',
        phone: '0987654321',
        role: 'user',
        createdBy: 1,
      });
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage('❌ ' + error.response.data);
      } else {
        setMessage('❌ Có lỗi xảy ra khi kết nối máy chủ');
      }
    }

    setLoading(false);
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: '8px',
    position: 'relative',
  };

  const formStyle = {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    marginTop: '40px',
    backgroundColor: loading ? '#7aa7d9' : '#007bff',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '20px',
  };

  const messageStyle = {
    marginTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
  };

  const spinnerOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  };

  const spinnerStyle = {
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #007bff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div className="" style={containerStyle}>
      {/* Spinner animation keyframes */}
      <style>
        {`@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }`}
      </style>

      {loading && (
        <div style={spinnerOverlayStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}

      <form className="mb-[50px] mt-[10px]" onSubmit={handleSubmit} style={formStyle}>
        <h2 className="text-[18px] font-[600] uppercase" style={titleStyle}>
          Tạo tài khoản
        </h2>

        <input
          style={inputStyle}
          type="text"
          name="fullName"
          placeholder="Họ và tên"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          type="text"
          name="username"
          placeholder="Tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
          readOnly
        />

        <input
          style={inputStyle}
          type="text"
          name="phone"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={handleChange}
          readOnly
        />

        <select name="role" value={formData.role} onChange={handleChange} style={inputStyle} disabled>
          <option value="user">Người dùng</option>
          <option value="admin">Quản trị</option>
        </select>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </form>
    </div>
  );
}

export default UserCreate;
