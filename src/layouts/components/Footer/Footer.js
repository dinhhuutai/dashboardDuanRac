import { useState } from "react";
import { FaFacebookF, FaYoutube, FaTiktok, FaInstagram } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';

function Footer() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            setError('Vui lòng nhập đầy đủ Tên và Số điện thoại.');
            return;
        }
        setError('');
        alert("✅ Gửi thành công!");
        setFormData({ name: '', phone: '', email: '', message: '' });
    };

    return (
        <div className="w-full bg-white border-t border-gray-200 px-8 py-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left - Contact Info */}
                <div>
                    <h2 className="text-[20px] font-serif font-semibold mb-4">Come &amp; Find Us</h2>
                    <p className="text-lg font-semibold">Địa chỉ</p>
                    <p className="mb-4 text-[12px]">Ấp Mới 2, Xã Mỹ Hạnh Nam, Huyện Đức Hoà, Tỉnh Long An, Việt Nam</p>

                    <p className="text-lg font-semibold">Liên hệ</p>
                    <p className="text-[12px]">+84 336 470 664</p>
                    <p className="mb-4 text-[12px]">lttnguyen328@gmail.com</p>

                    <div className="flex space-x-3 mt-4">
                        <a href="https://facebook.com"><FaFacebookF className="bg-[#3b5998] text-white text-[40px] p-2 rounded" /></a>
                        <a href="https://www.youtube.com/youtube"><FaYoutube className="bg-[#FF0000] text-white text-[40px] p-2 rounded" /></a>
                        <a href="https://www.tiktok.com/"><FaTiktok className="bg-[#000] text-white text-[40px] p-2 rounded" /></a>
                        <a href="https://www.instagram.com/"><FaInstagram className="bg-[#E1306C] text-white text-[40px] p-2 rounded" /></a>
                        <a href="https://chat.zalo.me/"><SiZalo className="bg-[#0084FF] text-white text-[40px] p-2 rounded" /></a>
                    </div>
                </div>

                {/* Right - Contact Form */}
                <div>
                    <h2 className="text-[20px] font-serif font-semibold mb-4">Leave us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <div>
                            <label className="text-[13px] font-medium text-red-600">* Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                placeholder="Fill your name"
                                className="w-full border border-gray-300 text-[13px] p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-red-600">* Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="text"
                                placeholder="Fill your phone number"
                                className="w-full border border-gray-300 text-[13px] p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium">Email</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                placeholder="Fill your email"
                                className="w-full border border-gray-300 text-[13px] p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Message"
                                className="w-full border border-gray-300 p-2 rounded h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            ></textarea>
                        </div>
                        <div className="flex justify-center">
                            <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition duration-200">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Footer;
