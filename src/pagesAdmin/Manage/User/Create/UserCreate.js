import { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';

function UserCreate() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '0987654321',
    role: 'user',
    createdBy: 1, // thay bằng userID đang đăng nhập
    operationType: '',
    roleEditReport: false,
    actionHistoryWeigh: false,
    managerQRcode: false,
    managerUser: false,
    managerTrash: false,
    managerTeamMember: false,
    managerFeedback: false,
  });
  
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
    setFormData({
      ...formData,
      createdBy: tmp?.login?.currentUser?.userID,
    })
  }, [tmp]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [operationOptions, setOperationOptions] = useState({
    canrac: false,
    canmuc: false,
  });

  useEffect(() => {
    const { canrac, canmuc } = operationOptions;
    let type = '';
    if (canrac && canmuc) type = 'full';
    else if (canrac) type = 'canrac';
    else if (canmuc) type = 'canmuc';

    setFormData((prev) => ({
      ...prev,
      operationType: type,
    }));
  }, [operationOptions]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.operationType) {
      setMessage('❌ Vui lòng chọn loại tài khoản: Cân rác, Cân mực hoặc cả hai.');
      setLoading(false);
      return;
    }


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
        operationType: '',
        roleEditReport: false,
        actionHistoryWeigh: false,
        managerQRcode: false,
        managerUser: false,
        managerTrash: false,
        managerTeamMember: false,
        managerFeedback: false,
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
    maxWidth: '800px',
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

  const tableHeaderStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  fontWeight: '600',
  backgroundColor: '#f0f2f5',
};

const tableCellStyle = {
  padding: '12px',
  border: '1px solid #ccc',
};

const checkboxStyle = {
  transform: 'scale(1.4)',
  cursor: 'pointer',
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
          type="text"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
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

        <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <div style={{ marginTop: '20px' }}>
  <label style={{ display: 'block', marginBottom: '8px' }}>
    Nghiệp vụ
  </label>

  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
    <thead>
      <tr style={{ backgroundColor: '#f7f7f7' }}>
        <th style={tableHeaderStyle}>Cân mực</th>
        <th style={tableHeaderStyle}>Cân rác</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={tableCellStyle}>
          <input
            type="checkbox"
            checked={operationOptions.canmuc}
            onChange={() =>
              setOperationOptions((prev) => ({
                ...prev,
                canmuc: !prev.canmuc,
              }))
            }
            style={checkboxStyle}
          />
        </td>
        <td style={tableCellStyle}>
          <input
            type="checkbox"
            checked={operationOptions.canrac}
            onChange={() =>
              setOperationOptions((prev) => ({
                ...prev,
                canrac: !prev.canrac,
              }))
            }
            style={checkboxStyle}
          />
        </td>
      </tr>
    </tbody>
  </table>
</div>

{operationOptions.canrac && (
  <div style={{ marginTop: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px' }}>
      Phân quyền cho nghiệp vụ cân rác:
    </label>

<div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
      <thead>
        <tr style={{ backgroundColor: '#f7f7f7' }}>
          <th style={tableHeaderStyle}>Sửa báo cáo</th>
          <th style={tableHeaderStyle}>Thao tác lịch sử cân</th>
          <th style={tableHeaderStyle}>Quản lý QR</th>
          <th style={tableHeaderStyle}>Quản lý người dùng</th>
          <th style={tableHeaderStyle}>Quản lý loại rác</th>
          <th style={tableHeaderStyle}>Quản lý tổ/chuyền</th>
          <th style={tableHeaderStyle}>Quản lý ý kiến CNV</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.roleEditReport}
              onChange={() =>
                setFormData((prev) => ({ ...prev, roleEditReport: !prev.roleEditReport }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.actionHistoryWeigh}
              onChange={() =>
                setFormData((prev) => ({ ...prev, actionHistoryWeigh: !prev.actionHistoryWeigh }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.managerQRcode}
              onChange={() =>
                setFormData((prev) => ({ ...prev, managerQRcode: !prev.managerQRcode }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.managerUser}
              onChange={() =>
                setFormData((prev) => ({ ...prev, managerUser: !prev.managerUser }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.managerTrash}
              onChange={() =>
                setFormData((prev) => ({ ...prev, managerTrash: !prev.managerTrash }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.managerTeamMember}
              onChange={() =>
                setFormData((prev) => ({ ...prev, managerTeamMember: !prev.managerTeamMember }))
              }
              style={checkboxStyle}
            />
          </td>
          <td style={tableCellStyle}>
            <input
              type="checkbox"
              checked={formData.managerFeedback}
              onChange={() =>
                setFormData((prev) => ({ ...prev, managerFeedback: !prev.managerFeedback }))
              }
              style={checkboxStyle}
            />
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
)}



        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </form>
    </div>
  );
}

export default UserCreate;
