import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaEdit, FaTrash, FaQrcode } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function QrcodeList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [trashTypeId, setTrashTypeId] = useState("");

  // NEW: Trạng thái (active | deleted | all)
  const [status, setStatus] = useState("active");

  // Lookup lists
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [trashTypes, setTrashTypes] = useState([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [qrLinkInput, setQrLinkInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // NEW: Restore modal
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // Image Lightbox
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState("");

  const openImage = (url) => { if (url) { setImageModalUrl(url); setImageModalOpen(true); } };
  const closeImage = () => { setImageModalOpen(false); setImageModalUrl(""); };

  // Load lookups
  useEffect(() => {
    (async () => {
      try {
        const [d, t] = await Promise.all([
          http.get(`${BASE_URL}/api/lookups/qr/departments`),
          http.get(`${BASE_URL}/api/lookups/qr/trash-types`),
        ]);
        setDepartments(d.data || []);
        setTrashTypes(t.data || []);
      } catch (e) {
        console.error("Load lookups error:", e);
      }
    })();
  }, []);

  // Load units when department changes
  useEffect(() => {
    (async () => {
      try {
        const res = await http.get(`${BASE_URL}/api/lookups/qr/units`, {
          params: { departmentId: departmentId || undefined },
        });
        setUnits(res.data || []);
      } catch (e) {
        console.error("Load units error:", e);
        setUnits([]);
      }
    })();
  }, [departmentId]);

  // Fetch list (đổi endpoint sang /api/trash-bins có status)
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/trash-bins`, {
        params: {
          page,
          pageSize,
          status, // active | deleted | all
          q: q || undefined,
          departmentId: departmentId || undefined,
          unitId: unitId || undefined,
          trashTypeId: trashTypeId || undefined,
        },
      });
      setRows(res.data?.data ?? []);
      const p = res.data?.pagination;
      setTotal(p?.total || 0);
      setTotalPages(p?.totalPages || 1);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
      setRows([]); setTotal(0); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, pageSize, q, departmentId, unitId, trashTypeId, status]);

  // Search submit
  const onSubmitSearch = (e) => {
    e?.preventDefault?.();
    setPage(1);
    setQ(qInput.trim());
  };

  const clearFilters = () => {
    setDepartmentId("");
    setUnitId("");
    setTrashTypeId("");
    setQ("");
    setQInput("");
    setStatus("active");
    setPage(1);
  };

  // Edit
  const openEdit = (row) => {
    setEditRow(row);
    setQrLinkInput(row?.qrLink || "");
    setCodeInput(row?.trashBinCode || "");
    setPreviewBroken(false);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await http.put(`${BASE_URL}/api/trash-bins/${editRow.trashBinID}`, {
        qrLink: (qrLinkInput || "").replace(/\u0000/g, "").trim() || null,
        trashBinCode: (codeInput || "").replace(/\u0000/g, "").trim() || null,
      });
      setEditOpen(false);
      setEditRow(null);
      await fetchList();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Cập nhật thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const openDelete = (id) => { setDeletingId(id); setConfirmOpen(true); };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await http.delete(`${BASE_URL}/api/trash-bins/${deletingId}`);
      setConfirmOpen(false);
      setDeletingId(null);
      const remain = rows.length - 1;
      if (remain <= 0 && page > 1) setPage((p) => p - 1);
      else await fetchList();
    } catch (err) {
      console.error("Lỗi xoá:", err);
      alert("Không thể xoá. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  // NEW: Restore
  const openRestore = (id) => { setRestoringId(id); setRestoreOpen(true); };

  const confirmRestore = async () => {
    if (!restoringId) return;
    setRestoring(true);
    try {
      await http.patch(`${BASE_URL}/api/trash-bins/${restoringId}/restore`);
      setRestoreOpen(false);
      setRestoringId(null);
      const remain = rows.length - 1;
      if (remain <= 0 && page > 1) setPage((p) => p - 1);
      else await fetchList();
    } catch (err) {
      console.error("Lỗi khôi phục:", err);
      alert("Không thể khôi phục. Vui lòng thử lại.");
    } finally {
      setRestoring(false);
    }
  };

  // Pagination helpers
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const gotoPrev = () => { if (canPrev) setPage((p) => p - 1); };
  const gotoNext = () => { if (canNext) setPage((p) => p + 1); };
  const jumpTo = (p) => { if (p >= 1 && p <= totalPages && p !== page) setPage(p); };

  // Hiển thị số trang rút gọn
  const compactPageItems = useMemo(() => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    items.push(1);
    const left = Math.max(page - 1, 2);
    const right = Math.min(page + 1, totalPages - 1);
    if (left > 2) items.push("...");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("...");
    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="bg-gradient-to-br from-[#FFEBEE] via-[#E3F2FD] to-[#E8F5E9] overflow-hidden p-4">
      <div className="relative z-[99] w-full bg-white rounded-2xl shadow-xl px-6 md:px-8 py-8 space-y-6 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -8, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-pink-600 text-3xl"
            >
              <FaQrcode />
            </motion.div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Danh sách QR Thùng rác
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <form onSubmit={onSubmitSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Tìm mã thùng (VD: TR228)"
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500
                         shadow-sm w-48 md:w-64"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium
                         shadow-sm ring-1 ring-emerald-600/20 hover:bg-emerald-700"
            >
              Tìm
            </button>
          </form>

          {/* Filters */}
          <select
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setUnitId(""); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 shadow-sm min-w-[180px]"
          >
            <option value="">Tất cả bộ phận</option>
            {departments.map(d => (
              <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
            ))}
          </select>

          <select
            value={unitId}
            onChange={(e) => { setUnitId(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 shadow-sm min-w-[160px]"
          >
            <option value="">Tất cả đơn vị</option>
            {units.map(u => (
              <option key={u.unitID} value={u.unitID}>{u.unitName}</option>
            ))}
          </select>

          <select
            value={trashTypeId}
            onChange={(e) => { setTrashTypeId(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 shadow-sm min-w-[160px]"
          >
            <option value="">Tất cả loại rác</option>
            {trashTypes.map(t => (
              <option key={t.trashTypeID} value={t.trashTypeID}>{t.trashName}</option>
            ))}
          </select>

          {/* NEW: Trạng thái */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 shadow-sm min-w-[160px]"
          >
            <option value="active">Đang hoạt động</option>
            <option value="deleted">Đã xoá</option>
            <option value="all">Tất cả</option>
          </select>

          <button
            onClick={clearFilters}
            className="h-10 px-3 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200"
          >
            Xoá lọc
          </button>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 shadow-sm"
          >
            {[10, 20, 30, 50, 100].map(n => (
              <option key={n} value={n}>{n}/trang</option>
            ))}
          </select>

          <button
            onClick={() => fetchList()}
            disabled={loading}
            className={`h-10 px-4 rounded-lg text-sm font-medium shadow-sm ring-1
              ${loading ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed" :
                "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}
          >
            {loading ? "Đang tải..." : "↻ Tải lại"}
          </button>
        </div>

        {/* Info bar */}
        <div className="text-sm text-slate-600">
          Tổng: <b>{total}</b> bản ghi • Trang <b>{page}</b>/<b>{totalPages}</b>
        </div>

        {/* Table */}
        <div className="mt-2 overflow-auto rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/95 backdrop-blur text-[13px] text-slate-700">
                <th className="px-3 py-2 border border-slate-200 first:rounded-tl-xl font-semibold">STT</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">QR</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">Mã thùng</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">Bộ phận</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">Đơn vị</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">Loại rác</th>
                <th className="px-3 py-2 border border-slate-200 font-semibold">Trạng thái</th>
                <th className="px-3 py-2 border border-slate-200 last:rounded-tr-xl font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">Đang tải dữ liệu...</td></tr>
              ) : tableRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">Không có dữ liệu.</td></tr>
              ) : (
                tableRows.map((r, idx) => {
                  const inactive = r.isActive === false || r.isActive === 0;
                  return (
                    <tr key={r.trashBinID}
                        className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100/70"}>
                      <td className="px-3 py-2 border border-slate-200 text-center font-medium">
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* QR */}
                      <td className="px-3 py-2 border border-slate-200">
                        <div className="flex items-center justify-center">
                          {r.qrLink ? (
                            <img
                              src={r.qrLink}
                              alt={r.trashBinCode || `QR-${r.trashBinID}`}
                              className="w-20 h-20 object-contain rounded-lg shadow-sm ring-1 ring-slate-200 cursor-zoom-in bg-white"
                              onClick={() => openImage(r.qrLink)}
                              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/80x80?text=QR"; }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                              N/A
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2 border border-slate-200 font-semibold">{r.trashBinCode || "—"}</td>
                      <td className="px-3 py-2 border border-slate-200">{r.departmentName || "—"}</td>
                      <td className="px-3 py-2 border border-slate-200">{r.unitName || "—"}</td>
                      <td className="px-3 py-2 border border-slate-200">{r.trashName || "—"}</td>
                      <td className="px-3 py-2 border border-slate-200">
                        {inactive ? (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                            Đã xoá
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 border border-slate-200">
                        <div className="flex items-center gap-2 justify-center">
                          {inactive ? (
                            <button
                              onClick={() => openRestore(r.trashBinID)}
                              className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 ring-1 ring-transparent hover:ring-emerald-200"
                              title="Khôi phục"
                            >
                              ↺ <span className="hidden md:inline">Khôi phục</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(r)}
                                className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 ring-1 ring-transparent hover:ring-blue-200"
                                title="Sửa"
                              >
                                <FaEdit /> <span className="hidden md:inline">Sửa</span>
                              </button>
                              <button
                                onClick={() => openDelete(r.trashBinID)}
                                className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 ring-1 ring-transparent hover:ring-rose-200"
                                title="Xoá"
                              >
                                <FaTrash /> <span className="hidden md:inline">Xoá</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="text-sm text-slate-600">
            Hiển thị <b>{rows.length}</b> / <b>{total}</b> bản ghi
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={gotoPrev}
              disabled={!canPrev}
              className={`h-9 px-3 rounded-lg text-sm ring-1 ${!canPrev
                ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}
            >
              ‹ Trước
            </button>

            {compactPageItems.map((it, i) =>
              it === "..." ? (
                <span key={`d-${i}`} className="h-9 px-2 grid place-items-center text-slate-500">…</span>
              ) : (
                <button
                  key={it}
                  onClick={() => jumpTo(it)}
                  className={`h-9 min-w-9 px-3 rounded-lg text-sm ring-1 ${
                    it === page
                      ? "bg-emerald-600 text-white ring-emerald-600/20"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {it}
                </button>
              )
            )}

            <button
              onClick={gotoNext}
              disabled={!canNext}
              className={`h-9 px-3 rounded-lg text-sm ring-1 ${!canNext
                ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}
            >
              Sau ›
            </button>
          </div>
        </div>

        {/* Modal Sửa */}
        {editOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Sửa thùng rác</h2>

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-700">Mã thùng</label>
                    <input
                      type="text"
                      disabled={true}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      placeholder="VD: TR228"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700">Link ảnh QR</label>
                    <input
                      type="url"
                      value={qrLinkInput}
                      onChange={(e) => { setQrLinkInput(e.target.value); setPreviewBroken(false); }}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      placeholder="https://.../qr.png"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500">Preview:</div>
                  <div className="w-24 h-24 rounded-lg bg-white grid place-items-center ring-1 ring-slate-200 overflow-hidden">
                    {qrLinkInput && !previewBroken ? (
                      <img
                        src={qrLinkInput}
                        alt="preview"
                        className="w-full h-full object-contain"
                        onError={() => setPreviewBroken(true)}
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setEditOpen(false); setEditRow(null); }}
                  className="h-10 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  onClick={saveEdit}
                  className="h-10 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xác nhận xoá */}
        {confirmOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 text-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Xác nhận xoá</h3>
              <p className="text-slate-600">Bạn có chắc chắn muốn xoá thùng rác này không?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setConfirmOpen(false); setDeletingId(null); }}
                  className="h-10 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={deleting}
                >
                  {deleting ? "Đang xoá..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Modal Xác nhận khôi phục */}
        {restoreOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 text-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Khôi phục QR</h3>
              <p className="text-slate-600">Xác nhận khôi phục QR đã xoá?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setRestoreOpen(false); setRestoringId(null); }}
                  className="h-10 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                  disabled={restoring}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmRestore}
                  className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={restoring}
                >
                  {restoring ? "Đang khôi phục..." : "Khôi phục"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX Xem ảnh lớn */}
        {imageModalOpen && (
          <div
            className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeImage}
          >
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={imageModalUrl}
                alt="QR lớn"
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-lg ring-1 ring-slate-300 bg-white"
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/600x400?text=QR"; }}
              />
              <button
                onClick={closeImage}
                className="absolute -top-3 -right-3 inline-flex items-center justify-center
                           size-9 rounded-full bg-white/90 text-slate-700
                           shadow ring-1 ring-slate-300 hover:bg-white"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QrcodeList;
