import { useState } from "react";
import { FaFacebookF, FaYoutube, FaTiktok, FaInstagram } from "react-icons/fa";
import { SiZalo } from "react-icons/si";

function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setError("");
    setSent(false);
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Vui lòng nhập đầy đủ Tên và Số điện thoại.");
      return;
    }
    // (bạn có thể gọi API tại đây)
    setError("");
    setSent(true);
    setFormData({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <footer
      className="w-full relative"
      aria-labelledby="site-footer"
      style={{
        background:
          "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #eef2f7 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(1200px_500px_at_50%_0%,#000,transparent)] bg-white/40" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Contact Info */}
          <section aria-label="Thông tin liên hệ" className="space-y-5">
            <h2 id="site-footer" className="text-2xl font-bold text-slate-800">
              Bạn có góp ý cho website?
            </h2>

            <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700">Địa chỉ</h3>
              <p className="text-[13px] text-slate-600">
                Ấp Mới 2, Xã Mỹ Hạnh, Tỉnh Tây Ninh, Việt Nam
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Liên hệ
                  </h3>
                  <p className="text-[13px] text-slate-600">+84 336 470 664</p>
                  <p className="text-[13px] text-slate-600">
                    lttnguyen328@gmail.com
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Theo dõi chúng tôi
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-8">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="group"
                    >
                      <span className="sr-only">Facebook</span>
                      <FaFacebookF className="h-6 w-6 text-slate-500 group-hover:text-[#3b5998] transition" />
                    </a>
                    <a
                      href="https://www.youtube.com/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                      className="group"
                    >
                      <FaYoutube className="h-6 w-6 text-slate-500 group-hover:text-[#FF0000] transition" />
                    </a>
                    <a
                      href="https://www.tiktok.com/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="TikTok"
                      className="group"
                    >
                      <FaTiktok className="h-6 w-6 text-slate-500 group-hover:text-black transition" />
                    </a>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="group"
                    >
                      <FaInstagram className="h-6 w-6 text-slate-500 group-hover:text-[#E1306C] transition" />
                    </a>
                    <a
                      href="https://zalo.me/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Zalo"
                      className="group"
                    >
                      <SiZalo className="h-6 w-6 text-slate-500 group-hover:text-[#0084FF] transition" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Thuận Hưng Long An. All rights
              reserved.
            </p>
          </section>

          {/* RIGHT: Contact Form */}
          <section
            aria-label="Gửi góp ý"
            className="rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-sm p-5 sm:p-6"
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Hãy viết và gửi cho chúng tôi nhé!
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              {sent && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  ✅ Gửi thành công! Cảm ơn bạn đã góp ý.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="text-[13px] font-medium text-slate-700"
                  >
                    * Tên
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Nhập tên của bạn"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-[13px] font-medium text-slate-700"
                  >
                    * Số điện thoại
                  </label>
                  <input
                    id="phone"
                    name="phone" // <-- sửa name cho đúng key state
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Email (không bắt buộc)
                </label>
                <input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Tin nhắn
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Bạn muốn góp ý điều gì?"
                  className="mt-1 w-full h-28 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-y"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-700 active:scale-[.99] transition"
                >
                  Gửi góp ý
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
