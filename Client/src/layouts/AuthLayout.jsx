import { motion } from "framer-motion";
import loginBg from "../assets/images/login-bg.png";

function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B0F]">
      {/* Background */}
      <img
        src={loginBg}
        alt="Login Background"
        className="
absolute
inset-0
h-full
w-full
object-cover

brightness-[0.45]

transition-transform
duration-[10000]

scale-110
"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />

      {/* Glow */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[180px]" />

      <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[160px]" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex justify-end items-center px-8 lg:px-24">
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
