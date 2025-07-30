import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';

function ExcelToPdfConverter() {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFiles(e.target.files);
  };

  const handleConvert = async () => {
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/convert/excel-pdf`, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Tạo link download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converted.pdf'); // hoặc converted.zip nếu nhiều file
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Lỗi chuyển đổi');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Chuyển Excel sang PDF</h2>
      <input type="file" multiple onChange={handleChange} accept=".xlsx" />
      <button
        onClick={handleConvert}
        disabled={!files || loading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Đang chuyển...' : 'Chuyển đổi'}
      </button>
    </div>
  );
}

export default ExcelToPdfConverter;
