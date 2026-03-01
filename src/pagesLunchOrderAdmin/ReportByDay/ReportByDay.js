// import React, { useEffect, useMemo, useState } from "react";
// import { BASE_URL } from "~/config";
// import http from "~/api/http";

// function ReportByDay() {
//   const [selectedDate, setSelectedDate] = useState("");
//   const [foods, setFoods] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // ===== Set mặc định ngày hôm nay =====
//   useEffect(() => {
//     const today = new Date();
//     const iso = today.toISOString().split("T")[0];
//     setSelectedDate(iso);
//   }, []);

//   // ===== Fetch report =====
//   useEffect(() => {
//     if (!selectedDate) return;

//     const fetchReport = async () => {
//       try {
//         setLoading(true);

//         const rs = await http.get(
//           `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}`
//         );

//         if (rs.data.success && rs.data.data) {
//           setFoods(rs.data.data.foods || []);
//           setRows(rs.data.data.rows || []);
//         } else {
//           setFoods([]);
//           setRows([]);
//         }
//       } catch (err) {
//         console.error("Fetch report error:", err);
//         setFoods([]);
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedDate]);

//   // ===== Build matrix =====
//   const reportMatrix = useMemo(() => {
//     const map = {};

//     for (const row of rows) {
//       const dept = row.departmentName || "Chưa gán";
//       const foodId = row.foodId;

//       if (!map[dept]) map[dept] = {};
//       if (!map[dept][foodId]) map[dept][foodId] = 0;

//       map[dept][foodId] += row.totalQuantity || 0;
//     }

//     return map;
//   }, [rows]);

//   // ===== Lấy danh sách bộ phận từ rows =====
//   const departments = useMemo(() => {
//     const setDept = new Set(rows.map(r => r.departmentName || "Chưa gán"));
//     return Array.from(setDept).sort();
//   }, [rows]);

//   const getRowTotal = (dept) =>
//     foods.reduce(
//       (sum, f) => sum + (reportMatrix?.[dept]?.[f.foodId] || 0),
//       0
//     );

//   const getColumnTotal = (foodId) =>
//     departments.reduce(
//       (sum, d) =>
//         sum + (reportMatrix?.[d]?.[foodId] || 0),
//       0
//     );

//   const getGrandTotal = () =>
//     departments.reduce(
//       (sum, d) => sum + getRowTotal(d),
//       0
//     );

//   // ===== Format header =====
//   const formatHeader = () => {
//     if (!selectedDate) return "";

//     const d = new Date(selectedDate);

//     const days = [
//       "Chủ nhật",
//       "Thứ 2",
//       "Thứ 3",
//       "Thứ 4",
//       "Thứ 5",
//       "Thứ 6",
//       "Thứ 7"
//     ];

//     return `${days[d.getDay()]} - ${d.toLocaleDateString("vi-VN")}`;
//   };

//   // ===== Disable T7 & CN =====
//   const isWeekend = (dateStr) => {
//     const d = new Date(dateStr);
//     const day = d.getDay();
//     return day === 0 || day === 6;
//   };

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow">
//       <h2 className="text-xl font-semibold mb-6">
//         📊 Báo cáo suất ăn - {formatHeader()}
//       </h2>

//       {/* ===== Filter chọn ngày ===== */}
//       <div className="flex flex-wrap gap-4 mb-6">
//         <input
//           type="date"
//           value={selectedDate}
//           onChange={(e) => {
//             if (isWeekend(e.target.value)) {
//               alert("Chỉ chọn từ Thứ 2 đến Thứ 6");
//               return;
//             }
//             setSelectedDate(e.target.value);
//           }}
//           className="border px-3 py-2 rounded-lg"
//         />
//       </div>

//       {/* ===== Table ===== */}
//       {loading ? (
//         <div className="text-center py-10 text-slate-500">
//           Đang tải dữ liệu...
//         </div>
//       ) : foods.length === 0 ? (
//         <div className="text-center py-10 text-slate-400">
//           Không có dữ liệu
//         </div>
//       ) : (
//         <div className="overflow-auto">
//           <table className="min-w-full border text-sm">
//             <thead className="bg-slate-100">
//               <tr>
//                 <th className="border px-3 py-2 text-left">
//                   Bộ phận
//                 </th>

//                 {foods.map((f) => (
//                   <th
//                     key={f.foodId}
//                     className="border px-3 py-2 text-center"
//                   >
//                     {f.foodName}
//                   </th>
//                 ))}

//                 <th className="border px-3 py-2 text-center bg-emerald-100">
//                   Tổng
//                 </th>
//               </tr>
//             </thead>

//             <tbody>
//               {departments.map((dept) => (
//                 <tr key={dept}>
//                   <td className="border px-3 py-2 font-medium">
//                     {dept}
//                   </td>

//                   {foods.map((f) => (
//                     <td
//                       key={f.foodId}
//                       className="border px-3 py-2 text-center"
//                     >
//                       {reportMatrix?.[dept]?.[f.foodId] || 0}
//                     </td>
//                   ))}

//                   <td className="border px-3 py-2 text-center font-semibold bg-emerald-50">
//                     {getRowTotal(dept)}
//                   </td>
//                 </tr>
//               ))}

//               {/* Tổng cuối bảng */}
//               <tr className="bg-slate-200 font-semibold">
//                 <td className="border px-3 py-2">Tổng</td>

//                 {foods.map((f) => (
//                   <td
//                     key={f.foodId}
//                     className="border px-3 py-2 text-center"
//                   >
//                     {getColumnTotal(f.foodId)}
//                   </td>
//                 ))}

//                 <td className="border px-3 py-2 text-center bg-emerald-200">
//                   {getGrandTotal()}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ReportByDay;





import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "~/config";
import http from "~/api/http";

function ReportByDay() {
  const [selectedDate, setSelectedDate] = useState("");
  const [foods, setFoods] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set ngày hôm nay
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split("T")[0]);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!selectedDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const rs = await http.get(
          `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}`
        );

        console.log(rs.data.data)
        if (rs.data.success && rs.data.data) {
          // 🔥 Đảm bảo branches luôn là array
          const safeFoods = (rs.data.data.foods || []).map((f) => ({
            ...f,
            branches: Array.isArray(f.branches) ? f.branches : [],
          }));

          setFoods(safeFoods);
          setRows(rs.data.data.rows || []);
        } else {
          setFoods([]);
          setRows([]);
        }
      } catch (err) {
        console.error(err);
        setFoods([]);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  // ===== Build matrix =====
  const reportMatrix = useMemo(() => {
    const map = {};

    for (const row of rows) {
      const dept = row.departmentName || "Chưa gán";
      const key = `${row.foodId}_${row.branchId || 0}`;

      if (!map[dept]) map[dept] = {};
      if (!map[dept][key]) map[dept][key] = 0;

      map[dept][key] += row.totalQuantity || 0;
    }

    return map;
  }, [rows]);

  const departments = useMemo(() => {
    const setDept = new Set(
      rows.map((r) => r.departmentName || "Chưa gán")
    );
    return Array.from(setDept).sort();
  }, [rows]);

  const getCell = (dept, foodId, branchId) =>
    reportMatrix?.[dept]?.[`${foodId}_${branchId || 0}`] || 0;

  const getRowTotal = (dept) => {
    let total = 0;

    foods.forEach((food) => {
      const branches = food.branches || [];

      if (branches.length > 0) {
        branches.forEach((b) => {
          total += getCell(dept, food.foodId, b.branchId);
        });
      } else {
        total += getCell(dept, food.foodId, 0);
      }
    });

    return total;
  };

  const getGrandTotal = () =>
    departments.reduce((sum, d) => sum + getRowTotal(d), 0);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-6">
        📊 Báo cáo suất ăn
      </h2>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="border px-3 py-2 rounded-lg mb-6"
      />

      {loading ? (
        <div>Đang tải...</div>
      ) : foods.length === 0 ? (
        <div>Không có dữ liệu</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead>
              {/* Header tầng 1 */}
              <tr className="bg-slate-100">
                <th rowSpan={2} className="border px-3 py-2">
                  Bộ phận
                </th>

                {foods.map((food) => {
                  const branches = food.branches || [];

                  return (
                    <th
                      key={food.foodId}
                      colSpan={branches.length > 0 ? branches.length : 1}
                      className="border px-3 py-2 text-center"
                    >
                      {food.foodName}
                    </th>
                  );
                })}

                <th
                  rowSpan={2}
                  className="border px-3 py-2 text-center bg-emerald-100"
                >
                  Tổng
                </th>
              </tr>

              {/* Header tầng 2 */}
              <tr className="bg-slate-50">
                {foods.map((food) => {
                  const branches = food.branches || [];

                  if (branches.length > 0) {
                    return branches.map((b) => (
                      <th
                        key={`${food.foodId}_${b.branchId}`}
                        className="border px-3 py-2 text-center"
                      >
                        {b.branchName}
                      </th>
                    ));
                  }

                  return (
                    <th
                      key={food.foodId}
                      className="border px-3 py-2 text-center"
                    >
                      {food.foodName}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {departments.map((dept) => (
                <tr key={dept}>
                  <td className="border px-3 py-2 font-medium">
                    {dept}
                  </td>

                  {foods.map((food) => {
                    const branches = food.branches || [];

                    if (branches.length > 0) {
                      return branches.map((b) => (
                        <td
                          key={`${food.foodId}_${b.branchId}`}
                          className="border px-3 py-2 text-center"
                        >
                          {getCell(dept, food.foodId, b.branchId)}
                        </td>
                      ));
                    }

                    return (
                      <td
                        key={food.foodId}
                        className="border px-3 py-2 text-center"
                      >
                        {getCell(dept, food.foodId, 0)}
                      </td>
                    );
                  })}

                  <td className="border px-3 py-2 text-center bg-emerald-50 font-semibold">
                    {getRowTotal(dept)}
                  </td>
                </tr>
              ))}

              {/* Grand total */}
              <tr className="bg-slate-200 font-semibold">
                <td className="border px-3 py-2">Tổng</td>

                {foods.map((food) => {
                  const branches = food.branches || [];

                  if (branches.length > 0) {
                    return branches.map((b) => (
                      <td
                        key={`${food.foodId}_${b.branchId}`}
                        className="border px-3 py-2 text-center"
                      >
                        {departments.reduce(
                          (sum, d) =>
                            sum +
                            getCell(d, food.foodId, b.branchId),
                          0
                        )}
                      </td>
                    ));
                  }

                  return (
                    <td
                      key={food.foodId}
                      className="border px-3 py-2 text-center"
                    >
                      {departments.reduce(
                        (sum, d) =>
                          sum + getCell(d, food.foodId, 0),
                        0
                      )}
                    </td>
                  );
                })}

                <td className="border px-3 py-2 text-center bg-emerald-200">
                  {getGrandTotal()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReportByDay;

