import React, { useRef, useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaCloudUploadAlt, FaTimes, FaCheck } from 'react-icons/fa';
import companyLogo from '~/assets/imgs/logoAdmin.png';
import http from '~/api/http'; 

/**
 * Modal component (reusable) — modern style
 */
function Modal({ open, title, children, onClose, onConfirm, confirmLabel = 'OK', cancelLabel = 'Huỷ', hideCancel = false, logo }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-6 z-10 transform transition-all duration-200"
        style={{ translate: '0 0' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {logo && <img src={logo} alt="logo" className="h-10 w-10 rounded-md object-contain bg-white/60 p-1" />}
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 text-slate-700">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          {!hideCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 transition"
            >
              {cancelLabel}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow"
            >
              <FaCheck /> {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * LunchFeedbackForm
 * - Tự đọc query params: eid, fid, name, food
 * - Nếu có query params, ưu tiên dùng chúng để pre-fill tên + tên món
 * - Textarea mặc định có "Món {id}: " ở đầu nếu id biết được
 */
export default function LunchFeedbackForm({
  fid: propFid,
  foodNameFromQuery: propFoodName,
  defaultName: propDefaultName = '',
}) {
  // states
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [name, setName] = useState(propDefaultName);
  const [dept, setDept] = useState('');
  const [phone, setPhone] = useState('');
  const [wantContact, setWantContact] = useState(true);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  // modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [infoIsError, setInfoIsError] = useState(false);

  // parsed params state
  const [qidFid, setQidFid] = useState(null);
  const [qFoodName, setQFoodName] = useState(null);
  const [qName, setQName] = useState(null);

  // parse query params once on mount (safe for SSR)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const eid = params.get('eid') || '';
      const fid = params.get('fid') || '';
      const rawName = params.get('name') || '';
      const rawFood = params.get('food') || '';

      let decodedName = '';
      let decodedFood = '';
      try { decodedName = rawName ? decodeURIComponent(rawName) : ''; } catch { decodedName = rawName; }
      try { decodedFood = rawFood ? decodeURIComponent(rawFood) : ''; } catch { decodedFood = rawFood; }

      // prefer fid -> eid if provided
      const finalFid = fid || eid || propFid || '';
      setQidFid(finalFid || null);

      setQFoodName(decodedFood || propFoodName || null);
      setQName(decodedName || propDefaultName || null);

      // prefill states if query provided
      if (decodedName) setName(decodedName);

      // Prefill textarea with prefix "Món {id}: " if we have an id and textarea empty
      const idToUse = finalFid || propFid || '';
      if (idToUse) {
        const prefix = `Món ${idToUse}: `;
        // only set if textarea currently empty
        setText(prev => (prev && prev.trim() ? prev : prefix));
      } else {
        // fallback: if propFoodName and no id, you may still want prefix; but user asked for id prefix, so skip
      }
    } catch (err) {
      console.error('[Feedback] parse query params error', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived dish title: priority qFoodName > propFoodName > fid prop
  const dishTitle = qFoodName || propFoodName || (qidFid || propFid ? `Món #${qidFid || propFid}` : 'Món ăn');

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  }
  function removeImage(i) { setImages(prev => prev.filter((_, idx) => idx !== i)); }

    async function doSubmit() {
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      const fd = new FormData();
      // category cố định cho "Đánh giá bữa trưa"
      fd.append('suggestionCategorieId', '12');

      // gửi nội dung như user nhập (đã có prefix "Món {id}: " nếu có)
      fd.append('content', (text || '').trim());

      // giống bên FeedbackFlow: wantContact là boolean
      fd.append('wantContact', wantContact);

      // nếu cho liên hệ thì mới gửi info (cho sạch dữ liệu)
      if (wantContact) {
        fd.append('sender_name', name || '');
        fd.append('sender_department', dept || '');
        fd.append('sender_phone', phone || '');
      }

      // ảnh
      images.forEach(f => fd.append('images', f));

      // 👇 giống bên dưới: dùng http.post
      const res = await http.post('/api/suggestions/submit', fd);
      const data = res.data;

      if (!data?.success) {
        throw new Error(data?.message || 'Gửi góp ý thất bại');
      }

      // thành công
      setInfoIsError(false);
      setInfoTitle('Gửi thành công');
      setInfoMessage('Cảm ơn bạn! Đánh giá đã được gửi.');
      setInfoOpen(true);

      // reset form nhưng giữ prefix "Món {id}: "
      const idToKeep = qidFid || propFid || '';
      const prefix = idToKeep ? `Món ${idToKeep}: ` : '';
      setText(prefix);
      setImages([]);
      setRating(5);
      // tuỳ em muốn có reset name/phone hay không:
      // setName('');
      // setDept('');
      // setPhone('');
    } catch (err) {
      console.error(err);
      setInfoIsError(true);
      setInfoTitle('Gửi thất bại');
      setInfoMessage('Gửi thất bại: ' + (err?.message || 'Lỗi'));
      setInfoOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setInfoIsError(true);
      setInfoTitle('Điểm không hợp lệ');
      setInfoMessage('Vui lòng chọn điểm từ 1 đến 5.');
      setInfoOpen(true);
      return;
    }
    // If text is only the prefix (e.g. "Món 123:") treat as empty content
    const idToCheck = qidFid || propFid || '';
    const prefixToCheck = idToCheck ? `Món ${idToCheck}:` : '';
    const textTrim = (text || '').trim();
    const isOnlyPrefix = prefixToCheck && (textTrim === prefixToCheck || textTrim === prefixToCheck + ''); // exact match
    if ((!textTrim || isOnlyPrefix) && images.length === 0) {
      setConfirmOpen(true);
      return;
    }
    doSubmit();
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <img src={companyLogo} alt="company logo" className="h-14 w-14 object-contain rounded-md shadow-sm bg-white p-2" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">Đánh giá bữa trưa</h1>
              <p className="text-sm text-slate-500">Hãy cho chúng tôi biết cảm nhận về món ăn hôm nay — chỉ mất vài giây.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Bạn vừa dùng</div>
                <div className="text-lg font-medium text-slate-800">{dishTitle}</div>
                {qName ? <div className="text-sm text-slate-500 mt-1">CNV: <strong className="text-slate-700">{qName}</strong></div> : null}
              </div>
              <div className="text-sm text-slate-500">Cảm ơn bạn vì phản hồi!</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-600 mb-2">Chấm điểm</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-amber-500 text-2xl">
                  {[1,2,3,4,5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      title={`${s}/5`}
                      className="p-1 rounded hover:bg-amber-50 transition"
                    >
                      {rating >= s ? <FaStar/> : <FaRegStar/>}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-slate-500">{rating}/5</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-600 block mb-2">Cảm nhận</label>
              <textarea
                rows={5}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 outline-none"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Món ăn ${qidFid || propFid ? '#' + (qidFid || propFid) : ''}: hãy nhập cảm nhận của bạn...`}
              />
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-600 block mb-2">Hình ảnh (tối đa 10)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-100"
                >
                  <FaCloudUploadAlt /> <span className="text-sm">Chọn ảnh</span>
                </button>
                <div className="text-sm text-slate-500">Đã chọn <strong className="text-slate-700">{images.length}</strong> ảnh</div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {images.map((f, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border">
                      <img src={URL.createObjectURL(f)} alt="preview" className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow"
                        aria-label="Xoá ảnh"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <input className="border rounded-xl p-3 focus:ring-2 focus:ring-emerald-100" placeholder="Họ tên" value={name} onChange={e=>setName(e.target.value)} />
              <input className="border rounded-xl p-3 focus:ring-2 focus:ring-emerald-100" placeholder="Phòng ban" value={dept} onChange={e=>setDept(e.target.value)} />
              <input className="border rounded-xl p-3 focus:ring-2 focus:ring-emerald-100" placeholder="Số điện thoại" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <input id="wc" type="checkbox" checked={wantContact} onChange={e=>setWantContact(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="wc" className="text-sm text-slate-700">Tôi đồng ý được liên hệ</label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow"
              >
                <FaCheck /> {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm modal when empty content */}
      <Modal
        open={confirmOpen}
        title="Bạn chưa nhập cảm nhận"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        confirmLabel="Gửi vẫn được"
        cancelLabel="Quay lại"
        logo={companyLogo}
      >
        <p className="text-slate-700">Bạn chưa nhập cảm nhận và cũng chưa chọn ảnh. Bạn có chắc muốn gửi đánh giá trống không?</p>
        <p className="mt-3 text-sm text-slate-500">(Bạn vẫn có thể bổ sung sau bằng cách gửi lần nữa.)</p>
      </Modal>

      {/* Info modal for success / error */}
      <Modal
        open={infoOpen}
        title={infoIsError ? 'Lỗi' : (infoTitle || 'Thông báo')}
        onClose={() => setInfoOpen(false)}
        hideCancel={true}
        onConfirm={() => setInfoOpen(false)}
        confirmLabel="Đóng"
        logo={companyLogo}
      >
        <div className={`${infoIsError ? 'text-rose-600' : 'text-emerald-600'} font-medium mb-2`}>
          {infoTitle}
        </div>
        <div className="text-slate-700">{infoMessage}</div>
      </Modal>
    </>
  );
}
