import { motion } from "framer-motion";
import loginBg from "../assets/images/login-bg.png";

function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-white">
      {/* Background */}
      <img
        src={loginBg}
        alt="Login Background"
        className="
          absolute inset-0 h-full w-full scale-110 object-cover brightness-[0.38]
          transition-transform duration-[10000]
        "
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#07070B]/65" />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0F] via-[#0B0B0F]/65 to-[#09090B]/20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      {/* Glow */}
      <div className="absolute -right-24 -top-20 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[180px]" />

      <div className="absolute -bottom-16 -left-16 h-[380px] w-[380px] rounded-full bg-fuchsia-500/10 blur-[160px]" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:justify-end lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
