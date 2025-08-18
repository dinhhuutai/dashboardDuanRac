import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import bg from '~/assets/imgs/cong.jpg';
import http from '~/api/http';

function Feedback() {
    const [images, setImages] = useState([]); // mảng ảnh
const [previewUrls, setPreviewUrls] = useState([]); // mảng URL preview

  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);


  const handleSubmit = async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('content', content);
  images.forEach(image => {
    formData.append('images', image);
  });

  try {
    setIsSending(true);
    await http.post(`${BASE_URL}/api/feedbacks`, formData);
    setContent('');
    setImages([]);
    setPreviewUrls([]);
    setSuccess(true);
  } catch (err) {
    setShowErrorModal(true);
  } finally {
    setIsSending(false);
  }
};


  return (
    <div 
        style={{
  backgroundImage: `url(${bg})`,
  backgroundColor: 'rgba(255,255,255, 0.4)',
  backgroundBlendMode: 'lighten',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}}

    className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-semibold text-blue-700 text-center mb-4">📝 Góp ý công ty</h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">
            ✅ Đã gửi góp ý! Cảm ơn bạn!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder="Nhập góp ý của bạn..."
            value={content}
            onChange={e => {
                setContent(e.target.value);
                setSuccess(false);
            }}
            className="w-full border border-gray-300 p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={5}
            required
          ></textarea>

          <div className="space-y-2">
  <label className="block text-gray-600">Đính kèm hình ảnh (nếu có):</label>


  <input
  type="file"
  accept="image/*"
  multiple
  onChange={e => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  }}
  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
/>

{/* Hiển thị ảnh preview */}
{previewUrls.length > 0 && (
  <div className="grid grid-cols-2 gap-2 mt-2">
    {previewUrls.map((url, index) => (
      <div key={index} className="relative">
        <img
          src={url}
          className="w-full h-32 object-cover border rounded-lg shadow-sm"
          alt={`Preview ${index}`}
        />
        <button
          type="button"
          onClick={() => {
            const newImages = images.filter((_, i) => i !== index);
            const newPreviews = previewUrls.filter((_, i) => i !== index);
            setImages(newImages);
            setPreviewUrls(newPreviews);
          }}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}
</div>



          <button
  type="submit"
  disabled={isSending}
  className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition duration-200 ${
    isSending ? 'opacity-70 cursor-not-allowed' : ''
  }`}
>
  {isSending && (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  )}
  {isSending ? 'Đang gửi...' : 'Gửi góp ý'}
</button>

        </form>
      </div>

      {/* Modal lỗi khi gửi không thành công */}
{showErrorModal && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center relative">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Gửi thất bại</h2>
      <p className="text-sm text-gray-700 mb-4">Vui lòng kiểm tra kết nối và thử lại.</p>
      <button
        onClick={() => setShowErrorModal(false)}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Đóng
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default Feedback;
