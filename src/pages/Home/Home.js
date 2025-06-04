import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userSelector } from '~/redux/selectors';
import weightSlice from '~/redux/slices/weightSlice';

function Home() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  let fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
  let characters = fullText.split('');
  const intervalRef = useRef(null); // <== Lưu interval để reset

  const dispatch = useDispatch();

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
    fullText = `CChào mừng ${tmp?.login?.currentUser?.fullName} đến hệ thống`;
    characters = fullText.split('');
  }, [tmp]);

  useEffect(() => {
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
  }, [index]);

  const data = [{ image: require('~/assets/imgs/bg-1.jpg') }, { image: require('~/assets/imgs/bg-2.jpg') }];

  const handleScanQR = () => {
    navigate('/scan');
  };

  const startAutoSlide = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, 5000); // 10 giây
  };

  useEffect(() => {
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSlider = (i) => {
    setIndex(i);
    startAutoSlide(); // Reset thời gian đếm lại từ đầu
  };

  const handleConnectBluetooth = async () => {
    try {
      console.log('Yêu cầu thiết bị...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_SCALE' }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb'],
      });

      console.log('Đang kết nối GATT...');
      const server = await device.gatt.connect();

      console.log('Đang lấy service...');
      const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');

      console.log('Đang lấy characteristic...');
      const characteristic = await service.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');

      console.log('Bắt đầu nhận dữ liệu...');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = new TextDecoder().decode(event.target.value);
        dispatch(weightSlice.actions.setWeight(value));
      });

      alert('✅ Đã kết nối tới ESP32_SCALE');
    } catch (error) {
      console.error('Bluetooth Error:', error);
      alert('❌ Lỗi Bluetooth: ' + error.message);
    }
  };

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
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Chấm điều hướng */}
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
    </div>
  );
}

export default Home;
