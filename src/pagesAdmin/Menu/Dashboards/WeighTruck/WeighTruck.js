import { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaUndoAlt } from "react-icons/fa";
import { BASE_URL } from "~/config";

function WeighTruck() {
  const [trashTypes, setTrashTypes] = useState([]);
  const [selectedTrashTypes, setSelectedTrashTypes] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [weighings, setWeighings] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
const [truckToReload, setTruckToReload] = useState(null);


  // Load loại rác
  useEffect(() => {
    axios.get(`${BASE_URL}/trash-types`)
      .then(res => setTrashTypes(res.data))
      .catch(err => console.error("❌ Lỗi loại rác:", err));
  }, []);

  // Lấy danh sách xe phù hợp với các loại rác được chọn
  useEffect(() => {
    if (selectedTrashTypes.length === 0) return;
    axios.post(`${BASE_URL}/garbage-trucks/filter`, { trashTypeIDs: selectedTrashTypes })
      .then(res => setTrucks(res.data))
      .catch(err => console.error("❌ Lỗi lấy xe:", err));
  }, [selectedTrashTypes]);

  // Lấy danh sách cân
  useEffect(() => {
    axios.get(`${BASE_URL}/weighing-records`)
      .then(res => setWeighings(res.data))
      .catch(err => console.error("❌ Lỗi cân:", err));
  }, []);

  const handleTrashTypeToggle = (id) => {
    setSelectedTrashTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAssign = async (recordIndex, truckIndex) => {
    const selectedRecords = weighings.slice(0, recordIndex + 1);
    const totalWeight = selectedRecords.reduce((sum, r) => sum + r.weightKg, 0);
    const truck = trucks[truckIndex];

    setAssigning(true);
    try {
      // Gửi dữ liệu về server
      await axios.post(`${BASE_URL}/assign-weight`, {
        truckCode: truck.truckCode,
        weightKg: totalWeight,
        recordIDs: selectedRecords.map(r => r.weighingRecordID),
      });

      // Xoá bản ghi đã phân
      setWeighings(prev => prev.slice(recordIndex + 1));
      const updated = [...trucks];
      updated[truckIndex].weightKg = totalWeight;
      setTrucks(updated);
    } catch (err) {
      console.error("❌ Lỗi gán:", err);
    }
    setAssigning(false);
  };

  const handleReload = async () => {
  if (!truckToReload) return;

  try {
    await axios.put(`${BASE_URL}/garbage-trucks/${truckToReload.truckCode}/reload`);

    // Reload lại dữ liệu
    if (selectedTrashTypes.length > 0) {
      const [trucksRes, weighingsRes] = await Promise.all([
        axios.post(`${BASE_URL}/garbage-trucks/filter`, { trashTypeIDs: selectedTrashTypes }),
        axios.get(`${BASE_URL}/weighing-records`),
      ]);
      setTrucks(trucksRes.data);
      setWeighings(weighingsRes.data);
    }

    setShowReloadModal(false);
    setTruckToReload(null);
  } catch (err) {
    console.error("❌ Lỗi khi thu hồi dữ liệu:", err);
    setShowReloadModal(false);
    setTruckToReload(null);
  }
};


  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-green-600">Phân Xe Theo Loại Rác</h2>

      {/* Bộ lọc loại rác */}
      <div className="flex flex-wrap gap-4">
        {trashTypes.map(type => (
          <label key={type.trashTypeID} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedTrashTypes.includes(type.trashTypeID)}
              onChange={() => handleTrashTypeToggle(type.trashTypeID)}
            />
            <span>{type.trashName} ({type.trashType})</span>
          </label>
        ))}
      </div>

      {/* Danh sách xe */}
      <div className="flex space-x-4 overflow-x-auto pb-2 border-b border-gray-300">
        {trucks.map((truck, index) => (
          <div key={truck.garbageTruckID} className="border p-4 rounded-lg min-w-[200px] shadow bg-white">
            <p className="font-semibold">{truck.truckName}</p>
            <p className="text-sm text-gray-500">Mã: {truck.truckCode}</p>
            <p className="text-sm">Khối lượng: {truck.weightKg?.toFixed(2) || 0} kg</p>
            <button
  onClick={() => handleReload(truck.truckCode)}
  title="Thu hồi phân phối"
  className="text-yellow-600 hover:text-yellow-800"
>
  <FaUndoAlt />
</button>
          </div>
        ))}
      </div>

      {/* Danh sách cân */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Danh sách cân</h3>
        {weighings.length === 0 ? (
          <p className="text-sm text-gray-500">Không có bản ghi cân.</p>
        ) : (
          <ul className="space-y-2">
            {weighings.map((rec, idx) => (
              <li key={rec.weighingRecordID} className="flex items-center justify-between border-b pb-1">
                <span className="text-sm">⚖️ {rec.weightKg.toFixed(2)} kg - {new Date(rec.createdAt).toLocaleString("vi-VN")}</span>
                <button
                  disabled={assigning}
                  onClick={() => handleAssign(idx, 0)} // phân cho xe đầu tiên
                  className="text-green-600 hover:text-green-800"
                >
                  <FaCheckCircle />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showReloadModal && truckToReload && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
      <h3 className="text-lg font-semibold text-red-600">Xác nhận thu hồi xe</h3>
      <p className="text-gray-700">
        Bạn có chắc muốn <span className="font-semibold">thu hồi dữ liệu</span> đã phân cho xe <span className="font-semibold text-blue-600">{truckToReload.truckName}</span> không?
      </p>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          onClick={() => {
            setShowReloadModal(false);
            setTruckToReload(null);
          }}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          Hủy
        </button>
        <button
          onClick={handleReload}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
        >
          Thu hồi
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default WeighTruck;
