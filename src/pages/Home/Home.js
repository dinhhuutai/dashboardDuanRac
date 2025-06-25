// import { useEffect, useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { userSelector } from '~/redux/selectors';
// import weightSlice from '~/redux/slices/weightSlice';

// function Home() {
//   const tmp = useSelector(userSelector);
//   const [user, setUser] = useState({});

//   const navigate = useNavigate();
//   const [index, setIndex] = useState(0);
//   const [typedText, setTypedText] = useState('');
//   let fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
//   let characters = fullText.split('');
//   const intervalRef = useRef(null); // <== Lưu interval để reset

//   const dispatch = useDispatch();

//   useEffect(() => {
//     setUser(tmp?.login?.currentUser);
//     fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
//     characters = fullText.split('');
//   }, [tmp]);

//   useEffect(() => {
//     let current = 0;
//     setTypedText('');
//     const typingInterval = setInterval(() => {
//       if (current < characters.length - 1) {
//         setTypedText((prev) => prev + characters[current]);
//         current++;
//       } else {
//         clearInterval(typingInterval);
//       }
//     }, 100);
//     return () => clearInterval(typingInterval);
//   }, [index]);

//   const data = [{ image: require('~/assets/imgs/bg-1.jpg') }, { image: require('~/assets/imgs/bg-2.jpg') }];

//   const handleScanQR = () => {
//     navigate('/scan');
//   };

//   const startAutoSlide = () => {
//     clearInterval(intervalRef.current);
//     intervalRef.current = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 5000); // 10 giây
//   };

//   useEffect(() => {
//     startAutoSlide();
//     return () => clearInterval(intervalRef.current);
//   }, []);

//   const handleSlider = (i) => {
//     setIndex(i);
//     startAutoSlide(); // Reset thời gian đếm lại từ đầu
//   };

//   const handleConnectBluetooth = async () => {
//     try {
//       console.log('Yêu cầu thiết bị...');
//       const device = await navigator.bluetooth.requestDevice({
//         filters: [{ name: 'ESP32_SCALE' }],
//         optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb'],
//       });

//       console.log('Đang kết nối GATT...');
//       const server = await device.gatt.connect();

//       console.log('Đang lấy service...');
//       const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');

//       console.log('Đang lấy characteristic...');
//       const characteristic = await service.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');

//       console.log('Bắt đầu nhận dữ liệu...');
//       await characteristic.startNotifications();
//       characteristic.addEventListener('characteristicvaluechanged', (event) => {
//         const value = new TextDecoder().decode(event.target.value);
//         dispatch(weightSlice.actions.setWeight(value));
//       });

//       alert('✅ Đã kết nối tới ESP32_SCALE');
//     } catch (error) {
//       console.error('Bluetooth Error:', error);
//       alert('❌ Lỗi Bluetooth: ' + error.message);
//     }
//   };

//   const handleCheckClassification = async () => {

//   };

//   return (
//     <div className="overflow-hidden w-full flex justify-center">
//       <div className="relative w-full h-[300px] md:h-[600px]">
//         {data.map((e, i) => (
//           <div
//             key={i}
//             className={`w-full h-full absolute transition-opacity duration-1000 ease-in-out ${
//               index === i ? 'opacity-100 z-10' : 'opacity-0 z-0'
//             }`}
//           >
//             <img className="w-full h-full object-cover" alt="slide" src={e.image} />
//             <div className="absolute inset-0 bg-black bg-opacity-40"></div>

//             {index === i && (
//               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white space-y-4">
//                 <h1 className="text-[14px] md:text-[24px] font-bold drop-shadow-md whitespace-nowrap">
//                   {typedText}
//                   <span className="animate-pulse">|</span>
//                 </h1>

//                 <div className="flex flex-col md:flex-row justify-center items-center gap-4">
//                   <button
//                     onClick={handleScanQR}
//                     className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
//                   >
//                     📷 Quét mã QR
//                   </button>

//                   <button
//                     onClick={handleConnectBluetooth}
//                     className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
//                   >
//                     Kết nối Bluetooth
//                   </button>
                  
//                   {
//                     user.role === 'admin' &&
//                     <button
//                       onClick={handleCheckClassification}
//                       className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
//                     >
//                       Kiểm tra phân loại
//                     </button>
//                   }
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}

//         {/* Chấm điều hướng */}
//         <div className="absolute z-10 flex bottom-5 gap-4 left-1/2 -translate-x-1/2">
//           {data.map((_, i) => (
//             <div
//               key={i}
//               onClick={() => handleSlider(i)}
//               className={`h-3 w-3 rounded-full cursor-pointer transition ${
//                 index === i ? 'bg-yellow-400 scale-110' : 'bg-gray-400'
//               }`}
//             ></div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Home;


import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userSelector } from '~/redux/selectors';
import weightSlice from '~/redux/slices/weightSlice';
import Modal from 'react-modal';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { format } from 'date-fns';

Modal.setAppElement('#root');

function Home() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  let fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
  let characters = fullText.split('');
  const intervalRef = useRef(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedDept, setSelectedDept] = useState({});
  const [selectedUnit, setSelectedUnit] = useState({});

  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);

  const [isLoadingClassification, setIsLoadingClassification] = useState(false);

  const [trashBins, setTrashBins] = useState([]);
  const [isTrashModalOpen, setTrashModalOpen] = useState(false);

  const [isCheckModalOpen, setCheckModalOpen] = useState(false);

  const [isInstructionModalOpen, setInstructionModalOpen] = useState(false);
  const [instructionConfirmed, setInstructionConfirmed] = useState(true);

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  const [finalConfirmModalOpen, setFinalConfirmModalOpen] = useState(false);
  
  const showError = (msg) => {
    setErrorMessage(msg);
    setErrorModalOpen(true);
  };

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
    fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
    characters = fullText.split('');
  }, [tmp]);

  useEffect(() => {
    if (isModalOpen || isErrorModalOpen || isTrashModalOpen || isCheckModalOpen || isInstructionModalOpen) return; // Dừng toàn bộ hiệu ứng nếu có modal

    let current = 0;
    setTypedText('');
    const typingInterval = setInterval(() => {
      if (current < characters.length - 1) {
        setTypedText((prev) => prev + characters[current]);
        current++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [index, isModalOpen, isErrorModalOpen, isTrashModalOpen, isCheckModalOpen, isInstructionModalOpen]);



  const data = [
    { image: require('~/assets/imgs/bg-1.jpg') },
    { image: require('~/assets/imgs/bg-2.jpg') },
  ];

  const handleScanQR = () => {
    navigate('/scan');
  };

  const startAutoSlide = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, 5000);
  };

  useEffect(() => {
    if (isModalOpen || isErrorModalOpen || isTrashModalOpen || isCheckModalOpen || isInstructionModalOpen) {
      clearInterval(intervalRef.current); // Dừng đổi ảnh nếu đang mở modal
    } else {
      startAutoSlide(); // Chỉ chạy khi không có modal
    }

    return () => clearInterval(intervalRef.current); // Dọn sạch
  }, [isModalOpen, isErrorModalOpen, isTrashModalOpen, isCheckModalOpen, isInstructionModalOpen]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedDept?.id) return;

      try {
        const today = new Date().toISOString().split('T')[0];

        const res = await axios.get(`${BASE_URL}/api/units`, {
          params: {
            departmentId: selectedDept.id,
            date: today
          }
        });

        setUnits(res.data); // Chỉ chứa units chưa kiểm tra
      } catch (err) {
        showError('Lỗi khi tải đơn vị: ' + err.message);
      }
    };

    fetchUnits();
  }, [selectedDept]);


  const handleSlider = (i) => {
    setIndex(i);
    startAutoSlide();
  };

  const handleConnectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_SCALE' }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb'],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = new TextDecoder().decode(event.target.value);
        dispatch(weightSlice.actions.setWeight(value));
      });

      showError('✅ Đã kết nối tới ESP32_SCALE');
    } catch (error) {
      console.error('Bluetooth Error:', error);
      showError('❌ Lỗi Bluetooth: ' + error.message);
    }
  };

  const handleCheckClassification = async () => {
    try {
      setIsLoadingClassification(true);
      
      const today = format(new Date(), 'yyyy-MM-dd'); // format ngày cho đúng

      const deptRes = await axios.get(`${BASE_URL}/api/departments`, {
        params: { date: today }
      });

      setDepartments(deptRes.data);
      setModalOpen(true);
    } catch (err) {
      showError('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setIsLoadingClassification(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedDept?.id || (!selectedUnit?.id && units.length > 0)) {
      showError('⚠️ Vui lòng chọn đầy đủ thông tin.');
      return;
    }
    setIsLoadingClassification(true);

    try {
      const res = await axios.get(`${BASE_URL}/trash-bin-in-areas`, {
        params: {
          departmentID: selectedDept?.id,
          unitID: selectedUnit?.id,
        },
      });

      setTrashBins(res.data);
      setModalOpen(false);           // đóng modal chọn bộ phận, đơn vị
      setTrashModalOpen(true);       // mở modal loại rác
    } catch (err) {
      showError('Lỗi khi lấy dữ liệu rác: ' + err.message);
    } finally {
      setIsLoadingClassification(false);
    }
  };

  const handleFinalSubmit = async () => {
    const payload = {
      department: selectedDept,
      unit: selectedUnit,
      trashBins,
      feedbackNote,
      user: user.userID,
    }
    
    setIsLoadingClassification(true);

    try {
      const res = await fetch(`${BASE_URL}/submit-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setFinalConfirmModalOpen(false);
        showError('Lưu thành công');
      } else {
        showError('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Lỗi kết nối đến server');
    } finally {
      setIsLoadingClassification(false);
    }
  }

  return (
    <div className="overflow-hidden w-full flex justify-center">
      <div className="relative w-full h-[300px] md:h-[600px]">
        {data.map((e, i) => (
          <div
            key={i}
            className={`w-full h-full absolute transition-opacity duration-1000 ease-in-out ${
              index === i ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img className="w-full h-full object-cover" alt="slide" src={e.image} />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            {index === i && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white space-y-4">
                <h1 className="text-[14px] md:text-[24px] font-bold drop-shadow-md whitespace-nowrap">
                  {typedText}
                  <span className="animate-pulse">|</span>
                </h1>

                <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                  <button
                    onClick={handleScanQR}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
                  >
                    📷 Quét mã QR
                  </button>

                  <button
                    onClick={handleConnectBluetooth}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
                  >
                    Kết nối Bluetooth
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={handleCheckClassification}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition min-w-[180px] flex items-center justify-center gap-2"
                    >
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Kiểm tra phân loại'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="absolute z-10 flex bottom-5 gap-4 left-1/2 -translate-x-1/2">
          {data.map((_, i) => (
            <div
              key={i}
              onClick={() => handleSlider(i)}
              className={`h-3 w-3 rounded-full cursor-pointer transition ${
                index === i ? 'bg-yellow-400 scale-110' : 'bg-gray-400'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Modal chọn bộ phận & đơn vị */}
      <Modal
        isOpen={isModalOpen}
        //onRequestClose={() => setModalOpen(false)}
        className="bg-white rounded-xl max-w-md w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[50]"
      >
        <h2 className="text-xl font-bold mb-4">🔍 Kiểm tra phân loại</h2>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Bộ phận:</label>
          <select
            value={selectedDept?.id}
            onChange={(e) => {
              const selectedOption = e.target.options[e.target.selectedIndex];
              const selectedName = selectedOption.dataset.name;


              setSelectedDept({
                id: e.target.value,
                name: selectedName,
              });
              setSelectedUnit({});
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn bộ phận --</option>
            {departments?.map((dept) => (
              <option
                key={dept.departmentID}
                value={dept.departmentID}
                data-name={dept.departmentName}
              >
                {dept?.departmentName?.normalize('NFC') === 'Chụp khung'.normalize('NFC') ? 'Chụp Khuôn' : dept.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-semibold">Đơn vị:</label>
          <select
            value={selectedUnit?.id}
            onChange={(e) => {
              const selectedOption = e.target.options[e.target.selectedIndex];
              const selectedName = selectedOption.dataset.name;

              setSelectedUnit({
                id: e.target.value,
                name: selectedName,
              });
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn đơn vị --</option>
            {units?.map((unit) => (
                <option
                  key={unit.unitID}
                  value={unit.unitID}
                  data-name={unit.unitName}
                >
                  {unit.unitName}
                </option>
              ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setSelectedDept({});
              setSelectedUnit({});
              setModalOpen(false);
            }}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Hủy
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded"
          >
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Tiếp tục'}
          </button>
        </div>
      </Modal>

      {/* Modal thông báo lỗi */}
      <Modal
        isOpen={isErrorModalOpen}
        onRequestClose={() => setErrorModalOpen(false)}
        className="bg-white rounded-xl max-w-sm w-full p-6 mx-auto mt-20 shadow-lg outline-none text-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[53]"
      >
        <h3 className="text-lg font-semibold mb-3">Thông báo</h3>
        <p className="mb-4">{errorMessage}</p>
        <button
          onClick={() => setErrorModalOpen(false)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Đóng
        </button>
      </Modal>

      <Modal
        isOpen={isTrashModalOpen}
        //onRequestClose={() => setTrashModalOpen(false)}
        className="bg-white rounded-xl max-w-lg w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-4">🗑️ Số lượng thùng rác</h2>

        {trashBins.length === 0 ? (
          <p>Không có loại rác nào được cấu hình cho bộ phận và đơn vị này.</p>
        ) : (
          <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {trashBins.map((item, index) => {
              // Gán màu theo tên rác
              const normalizedTrashName = item.trashName?.normalize('NFC')?.trim();
              const colorMap = {
                'Giẻ lau dính mực thường': 'bg-yellow-400',
                'Giẻ lau dính mực lapa': 'bg-yellow-400',
                'Băng keo dính hóa chất': 'bg-white border border-gray-400',
                'Mực in thường thải': 'bg-red-500',
                'Mực in lapa thải': 'bg-red-500',
                'Rác sinh hoạt': 'bg-green-500',
                'Vụn logo': 'bg-black'
              };

              const colorClass = colorMap[normalizedTrashName] || 'bg-gray-300';

              return (
                <li
                  key={item.trashBinInAreaID}
                  className="border rounded-lg px-4 py-3 shadow-sm bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 mt-1 rounded-full ${colorClass}`} />
                    <div className="flex-1 space-y-1">
                      <div className="text-base font-medium text-gray-800">
                        {item.trashName}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Số lượng theo quy định:</strong> {item.expectedQuantity}
                      </div>
                      <div>
                        <label htmlFor={`actual-${index}`} className="block text-sm font-semibold mb-1">
                          Thùng hiện có:
                        </label>
                        <input
                          id={`actual-${index}`}
                          type="number"
                          min="0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={item.actualQuantity ?? ''}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const updatedBins = [...trashBins];
                            updatedBins[index] = {
                              ...updatedBins[index],
                              actualQuantity: newValue
                            };
                            setTrashBins(updatedBins);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setTrashModalOpen(false);
              setModalOpen(true); // mở lại modal trước đó (ví dụ: chọn bộ phận & đơn vị)
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Quay lại
          </button>
          
          <button
            onClick={() => {
              // hành động huỷ
              setTrashModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="flex px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              const binsWithDefaultCheck = trashBins.map((item) => ({
                ...item,
                isCorrect: item.isCorrect ?? true, // chỉ gán nếu chưa có
              }));

              setTrashBins(binsWithDefaultCheck);
              setTrashModalOpen(false);
              setCheckModalOpen(true); // mở modal tiếp theo, ví dụ: nhập số liệu cân hoặc xác nhận
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Tiếp tục'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isCheckModalOpen}
        //onRequestClose={() => setCheckModalOpen(false)}
        className="bg-white rounded-xl max-w-xl w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]"
      >
        <h2 className="text-xl font-bold mb-4">🧪 Xác nhận phân loại rác</h2>

        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {trashBins.map((item, index) => {
            const normalizedTrashName = item.trashName?.normalize('NFC')?.trim();
            const colorMap = {
                'Giẻ lau dính mực thường': 'bg-yellow-400',
                'Giẻ lau dính mực lapa': 'bg-yellow-400',
                'Băng keo dính hóa chất': 'bg-white border border-gray-400',
                'Mực in thường thải': 'bg-red-500',
                'Mực in lapa thải': 'bg-red-500',
                'Rác sinh hoạt': 'bg-green-500',
                'Vụn logo': 'bg-black'
            };
            const colorClass = colorMap[normalizedTrashName] || 'bg-gray-300';

            return (
              <li
                key={item.trashBinInAreaID}
                className={`flex items-center justify-between border rounded px-4 py-2 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${colorClass}`}></span>
                  <div className="font-semibold">{item.trashName}</div>
                </div>

                <div className="flex gap-6">
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.isCorrect === true ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => {
                      const updated = [...trashBins];
                      updated[index] = { ...item, isCorrect: true };
                      setTrashBins(updated);
                    }}
                  >
                    ✅
                  </button>
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.isCorrect === false ? 'bg-red-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => {
                      const updated = [...trashBins];
                      updated[index] = { ...item, isCorrect: false };
                      setTrashBins(updated);
                    }}
                  >
                    ❌
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setCheckModalOpen(false);
              setTrashModalOpen(true); // quay lại chỉnh sửa
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Quay lại
          </button>
          
          <button
            onClick={() => {
              // hành động huỷ
              setCheckModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="flex px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              // Kiểm tra nếu mọi loại rác đều đã được đánh dấu
              const allChecked = trashBins.every((item) => item.isCorrect !== undefined);
              if (!allChecked) {
                alert('Vui lòng xác nhận tất cả các loại rác!');
                return;
              }

              setCheckModalOpen(false);
              setInstructionModalOpen(true);
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Tiếp tục'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isInstructionModalOpen}
        //onRequestClose={() => setInstructionModalOpen(false)}
        className="bg-white rounded-xl max-w-lg w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-6 text-center">
          👨‍🏭 Thợ in đã được hướng dẫn phân loại chưa?
        </h2>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setInstructionConfirmed(true)}
            className={`flex items-center px-4 py-2 rounded-full border ${
              instructionConfirmed ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border-gray-400'
            } hover:bg-green-600 hover:text-white transition`}
          >
            ✅ Đã hướng dẫn
          </button>

          <button
            onClick={() => {
              setInstructionConfirmed(false);
            }}
            className={`flex items-center px-4 py-2 rounded-full border ${
              instructionConfirmed === false ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border-gray-400'
            } hover:bg-red-600 hover:text-white transition`}
          >
            ❌ Chưa hướng dẫn
          </button>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setInstructionModalOpen(false);
              setCheckModalOpen(true); // modal trước đó
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Quay lại
          </button>
          
          <button
            onClick={() => {
              // hành động huỷ
              setInstructionModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="flex px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              if (instructionConfirmed) {
                setInstructionModalOpen(false);
                setFeedbackModalOpen(true);
              } else {
                showError('⚠️ Vui lòng hướng dẫn thợ in phân loại trước khi tiếp tục.');
              }
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Tiếp tục'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isFeedbackModalOpen}
        //onRequestClose={() => setFeedbackModalOpen(false)}
        className="bg-white rounded-xl max-w-lg w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-4 text-center">📝 Ghi chú phản hồi</h2>

        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Nhập ghi chú nếu có..."
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setFeedbackModalOpen(false);
              setInstructionModalOpen(true); // modal trước đó
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Quay lại
          </button>
          
          <button
            onClick={() => {
              // hành động huỷ
              setFeedbackModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="flex px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              setFeedbackModalOpen(false);
              setFinalConfirmModalOpen(true);
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Hoàn tất'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={finalConfirmModalOpen}
        //onRequestClose={() => setFinalConfirmModalOpen(false)}
        className="bg-white rounded-xl max-w-xl w-full p-6 mx-auto mt-20 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[70]"
      >
        <h2 className="text-xl font-bold mb-6 text-center">🔒 Xác nhận thông tin cuối cùng</h2>

        <div className="space-y-4 max-h-80 overflow-y-auto px-2">
          <div className='flex'>
            <h3 className="font-semibold text-gray-700 mb-1">📌 Bộ phận:</h3>
            <p className="text-gray-900 ml-[8px]">{selectedDept?.name?.normalize('NFC') === 'Chụp khung'.normalize('NFC') ? 'Chụp Khuôn' : selectedDept?.name}</p>
          </div>

          <div className='flex'>
            <h3 className="font-semibold text-gray-700 mb-1">🏷️ Đơn vị:</h3>
            <p className="text-gray-900 ml-[8px]">{selectedUnit?.name}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-1">♻️ Kết quả phân loại:</h3>
            <ul className="space-y-2">
              {trashBins.map((item) => {
                const isCorrect = item.isCorrect;
                const color = isCorrect ? 'text-green-600' : 'text-red-500';
                return (
                  <li key={item.trashBinInAreaID} className={`border rounded px-4 py-2 ${color}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.trashName}</span>
                      <span>{isCorrect ? '✅ Đúng' : '❌ Sai'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Theo quy định: <strong>{item.expectedQuantity}</strong>, hiện có: <strong>{item.actualQuantity}</strong>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-1">📝 Ghi chú:</h3>
            <p className="text-gray-800 whitespace-pre-wrap">
              {feedbackNote.trim() !== '' ? feedbackNote : '(Không có ghi chú)'}
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setFinalConfirmModalOpen(false);
              setFeedbackModalOpen(true);
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Quay lại
          </button>

          <button
            onClick={() => {
              // Gọi hàm submit / lưu dữ liệu chính thức
              handleFinalSubmit();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            
                      {isLoadingClassification && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      )}
                      {!isLoadingClassification && 'Xác nhận'}
          </button>
        </div>
      </Modal>

    </div>
  );
}

export default Home;
