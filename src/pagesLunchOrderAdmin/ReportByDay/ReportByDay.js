// import React, { useEffect, useMemo, useState } from "react";
// import { BASE_URL } from "~/config";
// import http from "~/api/http";

// function ReportByDay() {
//   const [selectedDate, setSelectedDate] = useState("");
//   const [foods, setFoods] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const today = new Date();
//     const iso = today.toISOString().split("T")[0];
//     setSelectedDate(iso);
//   }, []);

//   useEffect(() => {
//     if (!selectedDate) return;

//     const fetchReport = async () => {
//       try {
//         setLoading(true);

//         const rs = await http.get(
//           `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}`
//         );

//         console.log(rs.data.data);

//         if (rs.data.success && rs.data.data) {
//           setFoods(rs.data.data.foods || []);
//           setRows(rs.data.data.rows || []);
//         } else {
//           setFoods([]);
//           setRows([]);
//         }
//       } catch (err) {
//         console.error(err);
//         setFoods([]);
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedDate]);

//   // ===== Flatten food + branch =====
//   const flatFoods = useMemo(() => {
//     const result = [];

//     foods.forEach((f) => {
//       if (!f.branches || f.branches.length === 0) {
//         result.push({
//           key: `${f.foodId}_0`,
//           foodId: f.foodId,
//           branchId: 0,
//           label: `${f.foodName} (Không phân loại)`
//         });
//       } else {
//         f.branches.forEach((b) => {
//           result.push({
//             key: `${f.foodId}_${b.branchId}`,
//             foodId: f.foodId,
//             branchId: b.branchId || 0,
//             label: b.branchName
//               ? `${f.foodName} - ${b.branchName}`
//               : `${f.foodName} (Không phân loại)`
//           });
//         });
//       }
//     });

//     return result;
//   }, [foods]);

//   // ===== Build matrix (theo food + branch) =====
//   const reportMatrix = useMemo(() => {
//     const map = {};

//     for (const row of rows) {
//       const dept = row.departmentName || "Chưa gán";
//       const key = `${row.foodId}_${row.branchId || 0}`;

//       if (!map[dept]) map[dept] = {};
//       if (!map[dept][key]) map[dept][key] = 0;

//       map[dept][key] += row.totalQuantity || 0;
//     }

//     return map;
//   }, [rows]);

//   const departments = useMemo(() => {
//     const setDept = new Set(rows.map(r => r.departmentName || "Chưa gán"));
//     return Array.from(setDept).sort();
//   }, [rows]);

//   const getRowTotal = (dept) =>
//     flatFoods.reduce(
//       (sum, f) => sum + (reportMatrix?.[dept]?.[f.key] || 0),
//       0
//     );

//   const getColumnTotal = (key) =>
//     departments.reduce(
//       (sum, d) =>
//         sum + (reportMatrix?.[d]?.[key] || 0),
//       0
//     );

//   const getGrandTotal = () =>
//     departments.reduce(
//       (sum, d) => sum + getRowTotal(d),
//       0
//     );

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

//   return (
//     <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
//       <div className="bg-white rounded-3xl shadow-xl p-8">

//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-2xl font-bold text-slate-800">
//             📊 Báo cáo suất ăn
//             <span className="ml-3 text-lg font-medium text-emerald-600">
//               {formatHeader()}
//             </span>
//           </h2>

//           <input
//   type="date"
//   value={selectedDate}
//   onChange={(e) => setSelectedDate(e.target.value)}
//   onClick={(e) => e.target.showPicker()}
//   className="border border-slate-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-400 cursor-pointer"
// />
//         </div>

//         {/* Table */}
//         {loading ? (
//           <div className="text-center py-16 text-slate-500">
//             Đang tải dữ liệu...
//           </div>
//         ) : flatFoods.length === 0 ? (
//           <div className="text-center py-16 text-slate-400">
//             Không có dữ liệu
//           </div>
//         ) : (
// <div className="overflow-auto border rounded-2xl max-h-[85vh]">
//   <table className="min-w-full text-xs border-collapse">
//     <thead className="sticky top-0 z-20 bg-white shadow-sm">

//       {/* ===== Header tầng 1 (Food) ===== */}
//       <tr className="bg-slate-100">
//         <th
//           rowSpan={2}
//           className="sticky left-0 z-30 bg-slate-100 border px-3 py-2 text-left"
//         >
//           Bộ phận
//         </th>

//         {foods.map((f) => (
//           <th
//             key={f.foodId}
//             colSpan={f.branches?.length || 1}
//             className="border px-3 py-2 text-center font-semibold"
//           >
//             {f.foodName}
//           </th>
//         ))}

//         <th
//           rowSpan={2}
//           className="sticky right-0 z-30 bg-emerald-100 border px-3 py-2 text-center"
//         >
//           Tổng
//         </th>
//       </tr>

//       {/* ===== Header tầng 2 (Branch) ===== */}
//       <tr className="bg-slate-50">
//         {foods.map((f) =>
//           f.branches && f.branches.length > 0 ? (
//             f.branches.map((b) => (
//               <th
//                 key={`${f.foodId}_${b.branchId}`}
//                 className="border px-3 py-2 text-center font-medium"
//               >
//                 {b.branchName}
//               </th>
//             ))
//           ) : (
//             <th
//               key={`${f.foodId}_empty`}
//               className="border px-3 py-2 text-center text-slate-400"
//             >
//               {/* để trống */}
//             </th>
//           )
//         )}
//       </tr>
//     </thead>

//     <tbody>
//       {departments.map((dept, index) => (
//         <tr
//           key={dept}
//           className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
//         >
//           <td className="sticky left-0 bg-white border px-3 py-2 font-medium">
//             {dept}
//           </td>

//           {foods.map((f) =>
//             f.branches && f.branches.length > 0 ? (
//               f.branches.map((b) => {
//                 const key = `${f.foodId}_${b.branchId}`;
//                 return (
//                   <td
//                     key={key}
//                     className="border px-3 py-2 text-center"
//                   >
//                     {reportMatrix?.[dept]?.[key] || 0}
//                   </td>
//                 );
//               })
//             ) : (
//               <td
//                 key={`${f.foodId}_0`}
//                 className="border px-3 py-2 text-center"
//               >
//                 {reportMatrix?.[dept]?.[`${f.foodId}_0`] || 0}
//               </td>
//             )
//           )}

//           {/* Tổng hàng ngang */}
//           <td className="sticky right-0 bg-emerald-50 border px-3 py-2 text-center font-semibold">
//             {getRowTotal(dept)}
//           </td>
//         </tr>
//       ))}

//       {/* ===== Tổng cuối bảng ===== */}
//       <tr className="bg-slate-200 font-semibold">
//         <td className="sticky left-0 bg-slate-200 border px-3 py-2">
//           Tổng
//         </td>

//         {foods.map((f) =>
//           f.branches && f.branches.length > 0 ? (
//             f.branches.map((b) => {
//               const key = `${f.foodId}_${b.branchId}`;
//               return (
//                 <td
//                   key={key}
//                   className="border px-3 py-2 text-center"
//                 >
//                   {getColumnTotal(key)}
//                 </td>
//               );
//             })
//           ) : (
//             <td
//               key={`${f.foodId}_0`}
//               className="border px-3 py-2 text-center"
//             >
//               {getColumnTotal(`${f.foodId}_0`)}
//             </td>
//           )
//         )}

//         <td className="sticky right-0 bg-emerald-200 border px-3 py-2 text-center">
//           {getGrandTotal()}
//         </td>
//       </tr>
//     </tbody>
//   </table>
// </div>
//         )}
//       </div>
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

  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString().split("T")[0];
    setSelectedDate(iso);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchReport = async () => {
      try {
        setLoading(true);

        const rs = await http.get(
          `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}`
        );

        if (rs.data.success && rs.data.data) {
          setFoods(rs.data.data.foods || []);
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

    fetchReport();
  }, [selectedDate]);

  // ===== Flatten food + branch =====
  const flatFoods = useMemo(() => {
    const result = [];

    foods.forEach((f) => {
      if (!f.branches || f.branches.length === 0) {
        result.push({
          key: `${f.foodId}_0`,
        });
      } else {
        f.branches.forEach((b) => {
          result.push({
            key: `${f.foodId}_${b.branchId || 0}`,
          });
        });
      }
    });

    return result;
  }, [foods]);

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
    const setDept = new Set(rows.map((r) => r.departmentName || "Chưa gán"));
    return Array.from(setDept).sort();
  }, [rows]);

  const getRowTotal = (dept) =>
    flatFoods.reduce(
      (sum, f) => sum + (reportMatrix?.[dept]?.[f.key] || 0),
      0
    );

  const getColumnTotal = (key) =>
    departments.reduce(
      (sum, d) => sum + (reportMatrix?.[d]?.[key] || 0),
      0
    );

  const getGrandTotal = () =>
    departments.reduce((sum, d) => sum + getRowTotal(d), 0);

  const formatHeader = () => {
    if (!selectedDate) return "";

    const d = new Date(selectedDate);
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];

    return `${days[d.getDay()]} - ${d.toLocaleDateString("vi-VN")}`;
  };

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
              📊 Báo cáo suất ăn
            </h2>
            <div className="text-emerald-600 font-medium text-sm sm:text-base mt-1">
              {formatHeader()}
            </div>
          </div>

          <input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  onClick={(e) => e.target.showPicker?.()}
  className="border border-slate-300 px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-400 text-sm cursor-pointer w-full sm:w-auto"
/>
        </div>

        {/* ===== TABLE ===== */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : flatFoods.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="overflow-auto border rounded-xl max-h-[90vh]">
            <table className="min-w-max w-full text-[11px] sm:text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">

                {/* Tầng 1 */}
                <tr className="bg-slate-100">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-30 bg-slate-100 border px-2 sm:px-3 py-2 text-left min-w-[120px]"
                  >
                    Bộ phận
                  </th>

                  {foods.map((f) => (
                    <th
                      key={f.foodId}
                      colSpan={f.branches?.length || 1}
                      className="border px-2 sm:px-3 py-2 text-center font-semibold whitespace-nowrap"
                    >
                      {f.foodName}
                    </th>
                  ))}

                  <th
                    rowSpan={2}
                    className="sticky right-0 z-30 bg-emerald-100 border px-3 py-2 text-center min-w-[70px]"
                  >
                    Tổng
                  </th>
                </tr>

                {/* Tầng 2 */}
                <tr className="bg-slate-50">
                  {foods.map((f) =>
                    f.branches && f.branches.length > 0 ? (
                      f.branches.map((b) => (
                        <th
                          key={`${f.foodId}_${b.branchId}`}
                          className="border px-2 py-2 text-center whitespace-nowrap"
                        >
                          {b.branchName}
                        </th>
                      ))
                    ) : (
                      <th
                        key={`${f.foodId}_empty`}
                        className="border px-2 py-2"
                      />
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {departments.map((dept, index) => (
                  <tr
                    key={dept}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="sticky left-0 bg-white border px-2 sm:px-3 py-2 font-medium min-w-[120px]">
                      {dept}
                    </td>

                    {foods.map((f) =>
                      f.branches && f.branches.length > 0 ? (
                        f.branches.map((b) => {
                          const key = `${f.foodId}_${b.branchId}`;
                          return (
                            <td
                              key={key}
                              className="border px-2 py-2 text-center"
                            >
                              {reportMatrix?.[dept]?.[key] || 0}
                            </td>
                          );
                        })
                      ) : (
                        <td
                          key={`${f.foodId}_0`}
                          className="border px-2 py-2 text-center"
                        >
                          {reportMatrix?.[dept]?.[`${f.foodId}_0`] || 0}
                        </td>
                      )
                    )}

                    <td className="sticky right-0 bg-emerald-50 border px-2 py-2 text-center font-semibold">
                      {getRowTotal(dept)}
                    </td>
                  </tr>
                ))}

                {/* Tổng cuối */}
                <tr className="bg-slate-200 font-semibold">
                  <td className="sticky left-0 bg-slate-200 border px-3 py-2">
                    Tổng
                  </td>

                  {flatFoods.map((f) => (
                    <td
                      key={f.key}
                      className="border px-2 py-2 text-center"
                    >
                      {getColumnTotal(f.key)}
                    </td>
                  ))}

                  <td className="sticky right-0 bg-emerald-200 border px-3 py-2 text-center">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportByDay;