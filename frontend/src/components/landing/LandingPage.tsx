import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { HeroScene } from "./HeroScene";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.25 },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
const NAV_LINKS = [
  "Product",
  "Solutions",
  "Resources",
  "How It Works",
  "Pricing",
  "About Us",
];

function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 py-4"
      style={{
        background:
          "linear-gradient(180deg, rgba(5,10,21,0.92) 0%, rgba(5,10,21,0.6) 70%, transparent 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-500/20">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div className="leading-tight">
          <span className="text-white font-bold text-lg tracking-tight">
            Audit<span className="text-orange-400">AI</span>
          </span>
          <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wide">
            Financial Fraud Detection
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="hidden lg:flex items-center gap-7">
        {NAV_LINKS.map((l) => (
          <button
            key={l}
            className="text-[13px] text-gray-300 hover:text-white transition-colors duration-200 font-medium"
          >
            {l}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="hidden sm:inline-flex text-[13px] text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg px-4 py-2 transition-all duration-200 font-medium">
          Login
        </button>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-orange-500 hover:bg-orange-400 rounded-lg px-4 py-2 transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          Start Detection
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 120% 100% at 20% 50%, #0a1225 0%, #050a15 50%, #030610 100%)",
      }}
    >
      <Navbar />

      {/* Three.js Scene */}
      <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[62%] z-0">
        <HeroScene />
      </div>

      {/* Gradient Overlay */}
      <div
        className="hidden lg:block absolute top-0 bottom-0 z-[1] pointer-events-none"
        style={{
          left: "30%",
          width: "18%",
          background:
            "linear-gradient(90deg, rgba(5,10,21,1) 0%, rgba(5,10,21,0.7) 40%, transparent 100%)",
        }}
      />

      {/* Hero Text */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex items-center h-full px-6 lg:px-16 pt-20 pb-10 lg:pt-0 lg:pb-0"
      >
        <div className="max-w-xl w-full lg:w-[42%]">
          {/* Heading */}
          <motion.h1
            variants={fadeLeft}
            className="text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.8rem] font-extrabold leading-[1.1] tracking-tight text-white mb-5"
          >
            Detect Financial
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Fraud
            </span>
            <br />
            Before It Happens
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeLeft}
            className="text-[15px] sm:text-base text-orange-300/80 font-medium mb-4"
          >
            AI-Powered Financial Anomaly Detection &amp; Reporting
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeLeft}
            className="text-[14px] sm:text-[15px] text-gray-400 leading-relaxed mb-8 max-w-md"
          >
            AuditAI monitors millions of transactions in real-time, detects
            suspicious activities, duplicate payments, and policy violations
            before they cause impact.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-xl shadow-orange-600/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              Start Detection

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(3,6,16,0.9) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}