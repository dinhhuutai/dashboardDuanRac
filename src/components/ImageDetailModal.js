import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ImageDetailModal = ({ selectedItem, closeModal }) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!selectedItem) return null;

  const { categoryName, content, created_at, sender_name, sender_department, sender_phone, images } = selectedItem;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hour = String(d.getUTCHours()).padStart(2, "0");
    const minute = String(d.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const nextImage = () => setSelectedImageIdx((selectedImageIdx + 1) % images.length);
  const prevImage = () => setSelectedImageIdx((selectedImageIdx - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[999999] flex items-center justify-center px-4">
      <div className="bg-white w-[960px] max-h-[90vh] p-6 rounded-xl shadow-xl relative overflow-hidden flex gap-8">
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl z-10"
        >
          &times;
        </button>

        {/* Image Section */}
        <div className="flex-1 flex flex-col items-center">
          {images.length > 0 && (
            <>
              <img
                src={images[selectedImageIdx]?.image_url}
                alt={`selected-${selectedImageIdx}`}
                className="w-full h-[320px] object-contain rounded-lg border cursor-pointer"
                onClick={toggleFullscreen}
              />
              <div className="flex gap-2 mt-4 max-w-full overflow-x-auto">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.image_url}
                    alt={`thumb-${idx}`}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-24 h-20 object-cover border rounded cursor-pointer ${
                      selectedImageIdx === idx ? "ring-2 ring-blue-500" : ""
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 overflow-y-auto pr-4">
          <h2 className="text-2xl font-bold text-pink-600 mb-4 flex items-center">
            🎯 Chi tiết góp ý
          </h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>📁 Danh mục:</strong> {categoryName}</p>
            <p><strong>📝 Nội dung:</strong> {content}</p>
            <p><strong>📅 Ngày gửi:</strong> {formatDate(created_at)}</p>
            <p><strong>👤 Người gửi:</strong> {sender_name || "Ẩn danh"}</p>
            <p><strong>🏢 Bộ phận:</strong> {sender_department || "-"}</p>
            <p><strong>📞 SĐT:</strong> {sender_phone || "-"}</p>
          </div>
        </div>

        {/* Fullscreen Image Viewer */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[99999] flex items-center justify-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-5 right-5 text-white text-3xl hover:text-red-400"
            >
              <IoMdClose />
            </button>
            <button
              onClick={prevImage}
              className="absolute left-5 text-white text-4xl hover:text-gray-400"
            >
              <FaChevronLeft />
            </button>
            <img
              src={images[selectedImageIdx]?.image_url}
              alt={`fullscreen-${selectedImageIdx}`}
              className="max-w-5xl max-h-[80vh] object-contain"
            />
            <button
              onClick={nextImage}
              className="absolute right-5 text-white text-4xl hover:text-gray-400"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDetailModal;
