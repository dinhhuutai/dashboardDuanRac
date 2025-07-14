import { motion } from "framer-motion";
import { FaTools, FaSmileWink } from "react-icons/fa";

function Chat() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFEBEE] via-[#E3F2FD] to-[#E8F5E9] overflow-hidden px-4 py-12">
      {/* 🎈 Animated background shapes */}
      <motion.div
        className="absolute w-40 h-40 bg-pink-200 opacity-20 rounded-full -top-10 -left-10"
        animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-72 h-72 bg-blue-200 opacity-20 rounded-full bottom-[-60px] -right-32"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      {/* 🧱 Content card */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-xl px-8 py-10 text-center space-y-6 border border-gray-100">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-pink-600 text-6xl mx-auto"
        >
          <FaTools />
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Chức năng đang được phát triển!{" "}
          <FaSmileWink className="inline ml-2 text-yellow-500" />
        </motion.h1>

        <motion.p
          className="text-gray-600 text-base md:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Cảm ơn bạn đã ghé thăm 💖
          <br />
          Chúng tôi đang làm việc để hoàn thiện tính năng này.
          <br />
          Hẹn bạn quay lại sau nhé!
        </motion.p>

        <motion.img
          src="https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif"
          alt="Under Construction"
          className="w-[200px] mx-auto rounded-xl shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
        />
      </div>
    </div>
  );
}


export default Chat;
