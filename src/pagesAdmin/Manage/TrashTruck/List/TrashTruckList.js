import { useEffect, useState } from "react";
import axios from "axios";
import { BsCartDashFill } from "react-icons/bs";
import { FaTrashAlt, FaEdit, FaSpinner } from "react-icons/fa";
import { BASE_URL } from "~/config";

function TrashTruckList() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [trashTypes, setTrashTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);


  const fetchTrucks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/garbage-trucks`);
      setTrucks(res.data);
    } catch (err) {
      setError("Lỗi khi tải danh sách xe rác.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTrashTypes = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/trash-types`);
        setTrashTypes(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách loại rác", err);
      }
    };

    fetchTrashTypes();
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const confirmDelete = (truck) => {
    setTruckToDelete(truck);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
  setDeleting(true);
  try {
    await axios.delete(`${BASE_URL}/garbage-trucks/${truckToDelete.garbageTruckID}`);
    setTrucks((prev) =>
      prev.filter((t) => t.garbageTruckID !== truckToDelete.garbageTruckID)
    );
    setShowDeleteModal(false);
    setTruckToDelete(null);
  } catch (err) {
    console.error("❌ Lỗi khi xóa:", err);
  } finally {
    setDeleting(false);
  }
};


  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSubmit = async () => {
  setSaving(true);
  try {
    const updatedData = {
      truckName: editForm.truckName,
      trashTypeIDs: editForm.trashTypeIDs || [], // mảng các ID
    };

    await axios.put(`${BASE_URL}/garbage-trucks/${editForm.garbageTruckID}`, updatedData);
    fetchTrucks();
    setEditForm(null);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật:", err);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BsCartDashFill className="text-green-600 w-5 h-5" />
          Danh Sách Xe Rác
        </h2>

        {loading && <p>⏳ Đang tải...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200">
  <table className="min-w-full border border-gray-200 text-sm">
    <thead className="bg-blue-50 text-gray-700 uppercase">
      <tr>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">STT</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Tên Xe</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Mã Xe</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Loại Rác</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Khối Lượng</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Ngày Tạo</th>
        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Thao Tác</th>
      </tr>
    </thead>
    <tbody className="bg-white">
      {trucks.map((truck, index) =>
        truck.trashTypes.map((type, tIdx) => (
          <tr
            key={`${truck.garbageTruckID}-${tIdx}`}
            className="hover:bg-gray-50 transition-colors duration-150"
          >
            {tIdx === 0 && (
              <>
                <td
                  rowSpan={truck.trashTypes.length}
                  className="border border-gray-200 px-4 py-3 text-center align-middle"
                >
                  {index + 1}
                </td>
                <td
                  rowSpan={truck.trashTypes.length}
                  className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-800 align-middle"
                >
                  {truck.truckName}
                </td>
                <td
                  rowSpan={truck.trashTypes.length}
                  className="border border-gray-200 px-4 py-3 text-center text-gray-700 align-middle"
                >
                  {truck.truckCode}
                </td>
              </>
            )}

            <td className="border border-gray-200 px-4 py-3 text-center text-gray-700 align-middle">
              {type}
            </td>

            {tIdx === 0 && (
              <>
                <td className="border border-gray-200 px-4 py-3 text-center text-gray-700 align-middle" rowSpan={truck.trashTypes.length}>
                  {truck.weightKg?.toFixed(2) || 0}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-center text-gray-600 align-middle" rowSpan={truck.trashTypes.length}>
                  {new Date(truck.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-center align-middle space-x-3" rowSpan={truck.trashTypes.length}>
                  <button
                    onClick={() =>
  setEditForm({
    ...truck,
  })
}

                    className="text-blue-600 hover:text-blue-800 transition"
                    title="Sửa xe rác"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => confirmDelete(truck)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Xóa xe rác"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </>
            )}
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


        )}

        {/* Modal Xóa */}
        {showDeleteModal && truckToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <p>
                Bạn có chắc chắn muốn xóa xe <strong>{truckToDelete.truckName}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Hủy
                </button>
                <button
  onClick={handleDelete}
  disabled={deleting}
  className={`px-4 py-2 flex items-center justify-center gap-2 rounded 
              ${deleting ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} 
              text-white`}
>
  {deleting ? (
    <>
      <FaSpinner className="animate-spin" />
      Đang xóa...
    </>
  ) : (
    "Xác nhận"
  )}
</button>

              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa */}
        {editForm && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
      <h3 className="text-lg font-semibold text-blue-600">Chỉnh sửa Thông Tin Xe Rác</h3>

      {/* Truck Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Xe</label>
        <input
          className="w-full border p-2 rounded-md focus:ring focus:ring-blue-200"
          name="truckName"
          value={editForm.truckName}
          onChange={handleEditChange}
          placeholder="Nhập tên xe"
          required
        />
      </div>

      {/* Trash Type */}
        <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Loại Rác</label>
  <div className="grid grid-cols-2 gap-2 p-2">
    {trashTypes.map((type) => (
      <label key={type.trashTypeID} className="inline-flex items-center space-x-2">
        <input
          type="checkbox"
          value={type.trashTypeID}
          checked={editForm.trashTypeIDs?.includes(type.trashTypeID)}
          onChange={(e) => {
            const checked = e.target.checked;
            const id = parseInt(e.target.value);
            setEditForm((prev) => ({
              ...prev,
              trashTypeIDs: checked
                ? [...(prev.trashTypeIDs || []), id]
                : prev.trashTypeIDs.filter((t) => t !== id),
            }));
          }}
          className="accent-blue-600"
        />
        <span className="text-sm text-gray-700">
          {type.trashName} ({type.trashType})
        </span>
      </label>
    ))}
</div>




      </div>

      {/* Info-only: Truck Code & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã Xe</label>
          <input
            type="text"
            value={editForm.truckCode}
            className="w-full bg-gray-100 border p-2 rounded-md"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khối lượng (kg)</label>
          <input
            type="text"
            value={editForm.weightKg?.toFixed(2)}
            className="w-full bg-gray-100 border p-2 rounded-md"
            readOnly
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          onClick={() => setEditForm(null)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Hủy
        </button>
        <button
  onClick={handleEditSubmit}
  disabled={saving}
  className={`px-4 py-2 flex items-center justify-center gap-2 rounded-md 
              ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
              text-white`}
>
  {saving ? (
    <>
      <FaSpinner className="animate-spin" />
    </>
  ) : (
    "Lưu thay đổi"
  )}
</button>

      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default TrashTruckList;
