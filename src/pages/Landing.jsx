import { useNavigate } from "react-router-dom";
import logo from "../assets/Zyft.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-6 relative overflow-hidden">
      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* PNG Logo */}
        <img
          src={logo}
          alt="Zyft"
          className="w-40 h-auto mb-4 object-contain"
        />

        {/* Tagline */}
        <p className="text-gray-400 text-xl tracking-wide font-light">
          Train. Share. Improve.
        </p>
      </div>

      <div className="w-full max-w-[420px] pb-8 pt-4 flex flex-col items-center">
        {/* Get Started - wider, taller button */}
        <button
          onClick={() => navigate("/register")}
          className="w-full max-w-[420px] py-4 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 mb-3"
        >
          Get Started
        </button>

        {/* Login - matching size */}
        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-[420px] py-4 bg-transparent border border-gray-600 rounded-full font-medium text-white text-base hover:border-gray-400 hover:bg-white/5 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
        >
          Login
        </button>

        <p className="text-center text-[11px] text-gray-600 mt-4 leading-relaxed px-4">
          by continuing you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-400 transition">
            terms
          </span>{" "}
          and{" "}
          <span className="underline cursor-pointer hover:text-gray-400 transition">
            privacy
          </span>
        </p>
      </div>
    </div>
  );
}
