// src/pages/Login/Login.js
import React, { useState } from 'react';
import bgLogin from '~/assets/imgs/bg-login.png';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import config from '~/config';
import { useDispatch } from 'react-redux'; // 👈 Import Redux hook
import authSlice from '~/redux/slices/authSlice';
import { BASE_URL } from '~/config/index';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    if (isLoading) return;
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      dispatch(authSlice.actions.loginStart()); // 👈 Bắt đầu login

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const resData = await response.json();

      if (resData.status === 'success') {
        const { accessToken, refreshToken, user } = resData.data;

        // ✅ Lưu token nếu cần
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        dispatch(authSlice.actions.loginSuccess({ user, accessToken })); // 👈 Cập nhật Redux

        console.log('Đăng nhập thành công:', user);
        setErrorMessage('');

        if (user?.operationType.trim().toLowerCase() === 'full') {
          navigate(config.routes.adminAnalytics);
        } else {
          navigate(config.routes.home);
        }

      } else {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng.');
        dispatch(authSlice.actions.loginFailed()); // 👈 Báo lỗi login
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
      dispatch(authSlice.actions.loginFailed()); // 👈 Báo lỗi login
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className="bg-white bg-opacity-90 p-10 mx-[20px] rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">Đăng nhập Hệ thống Quản lý Rác thải</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-green-800 font-semibold mb-1">Tên đăng nhập</label>
            <input
              value={username}
              onChange={(e) => {
                setErrorMessage('');
                setUsername(e.target.value);
              }}
              type="text"
              placeholder="Nhập tên đăng nhập"
              className="w-full px-4 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="mb-2 relative">
            <label className="block text-green-800 font-semibold mb-1">Mật khẩu</label>
            <input
              value={password}
              onChange={(e) => {
                setErrorMessage('');
                setPassword(e.target.value);
              }}
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
            />

            <motion.button
              type="button"
              className="absolute right-3 top-[38px] cursor-pointer text-green-600"
              onClick={() => setShowPassword(!showPassword)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.span
                key={showPassword ? 'hide' : 'show'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {showPassword ? '🙈' : '👀'}
              </motion.span>
            </motion.button>
          </div>

          {errorMessage && (
            <div className="text-red-600 text-sm mt-2 mb-4 text-center font-semibold">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-2 mt-[20px] rounded-md flex justify-center items-center gap-2 transition ${
              isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-sm text-center text-green-900 mt-6">🌱 Chung tay vì môi trường xanh – sạch – đẹp 🌍</p>
      </div>
    </div>
  );
}

export default Login;
