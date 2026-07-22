import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  Camera,
  User,
  Mail,
  Phone,
  X,
  Link as LinkIcon,
  Award,
  BarChart3,
  Loader2,
} from "lucide-react";
import { updateProfile, uploadProfilePhoto } from "../api/posts";

// ── Custom brand icons ──
const InstagramIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.88c.26 0 .51.04.75.1V9.66a6.35 6.35 0 0 0-.75-.04A6.22 6.22 0 0 0 3.25 15.84a6.22 6.22 0 0 0 6.22 6.22 6.22 6.22 0 0 0 6.22-6.22V9.41a7.94 7.94 0 0 0 4.64 1.48V7.53a4.85 4.85 0 0 1-.74-.84z" />
  </svg>
);

// ── Constants ──
const BIO_MAX_LENGTH = 150;

const fitnessLevels = [
  {
    value: "Beginner",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    value: "Intermediate",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    value: "Advanced",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    value: "Elite",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
];

// ── Memoized sub-components (defined OUTSIDE EditProfile) ──
const SectionIcon = memo(({ icon: Icon, darkMode }) => (
  <div
    className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 ${
      darkMode ? "bg-purple-500/10" : "bg-purple-100"
    }`}
  >
    <Icon
      size={14}
      className={darkMode ? "text-purple-400" : "text-purple-600"}
    />
  </div>
));

const InputWrapper = memo(
  ({
    label,
    field,
    children,
    hint,
    darkMode,
    formData,
    activeField,
    onClear,
  }) => (
    <div className="space-y-1.5">
      <label
        className={`text-[11px] font-medium uppercase tracking-wider mb-2 block ${
          darkMode ? "text-gray-500" : "text-gray-500"
        }`}
      >
        {label}
      </label>
      <div className="relative group">
        {children}
        {formData[field] && activeField === field && (
          <button
            type="button"
            onClick={() => onClear(field)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              darkMode
                ? "bg-white/10 text-gray-500 hover:text-white"
                : "bg-gray-200 text-gray-500 hover:text-gray-900"
            }`}
          >
            <X size={10} />
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  ),
);

const Toast = memo(({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        className={`bg-[#1a1a2e] border rounded-xl px-4 py-3 shadow-xl shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === "success" ? "border-green-500/30" : "border-red-500/30"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            toast.type === "success" ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-green-400"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-red-400"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-300 font-medium">
          {toast.message}
        </span>
      </div>
    </div>
  );
});

// ── Main Component ──
export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [previewImage, setPreviewImage] = useState(
    user?.avatar || user?.photo || null,
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("zyft_theme") !== "light",
  );

  const [formData, setFormData] = useState({
    name: user?.name || "",
    handle: user?.handle || user?.username || "",
    bio: user?.bio || "",
    focus: user?.focus || "",
    email: user?.email || "",
    phone: user?.phone || "",
    instagram: user?.instagram || "",
    twitter: user?.twitter || "",
    tiktok: user?.tiktok || "",
    fitnessLevel: user?.level || "Intermediate",
  });

  // ── Stable callbacks (useCallback) ──
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const calculateCompletion = useCallback(() => {
    const fields = [
      formData.name?.length > 0,
      formData.handle?.length > 0,
      formData.bio?.length > 10,
      formData.focus?.length > 0,
      formData.email?.length > 0,
      formData.phone?.length > 0,
      !!previewImage,
      formData.instagram?.length > 0,
      formData.fitnessLevel !== "Beginner",
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [formData, previewImage]);

  const completion = calculateCompletion();

  const handleFocus = useCallback((field) => {
    setActiveField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "bio" && value.length > BIO_MAX_LENGTH) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSavedSuccess(false);
  }, []);

  const handleHandleChange = useCallback((e) => {
    const raw = e.target.value.replace("@", "");
    setFormData((prev) => ({ ...prev, handle: "@" + raw }));
    setSavedSuccess(false);
  }, []);

  const clearField = useCallback((field) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handlePhotoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);

      setUploadingPhoto(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append("photo", file);
        const { data } = await uploadProfilePhoto(formDataUpload);

        setPreviewImage(data.avatar);
        updateUser((prev) => ({
          ...prev,
          avatar: data.avatar,
          photo: data.photo,
        }));
        showToast("Photo updated!");
      } catch (err) {
        console.error("Failed to upload photo:", err);
        showToast("Failed to upload photo", "error");
        setPreviewImage(user?.avatar || user?.photo || null);
      } finally {
        setUploadingPhoto(false);
      }
    },
    [updateUser, showToast, user],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        const { data } = await updateProfile({
          name: formData.name,
          bio: formData.bio,
          focus: formData.focus,
          level: formData.fitnessLevel,
          instagram: formData.instagram,
          twitter: formData.twitter,
          tiktok: formData.tiktok,
          phone: formData.phone,
        });

        updateUser((prev) => ({
          ...prev,
          ...data.user,
          name: data.user.name,
          bio: data.user.bio,
          focus: data.user.focus,
          level: data.user.level,
          instagram: data.user.instagram,
          twitter: data.user.twitter,
          tiktok: data.user.tiktok,
          phone: data.user.phone,
          avatar: data.user.avatar || prev.avatar,
          photo: data.user.photo || prev.photo,
        }));

        setSavedSuccess(true);
        showToast("Profile saved!");
        setTimeout(() => {
          setSavedSuccess(false);
          navigate("/profile");
        }, 1500);
      } catch (err) {
        console.error("Failed to save profile:", err);
        showToast("Failed to save profile", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, navigate, updateUser, showToast],
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const handleFitnessLevelChange = useCallback((levelValue) => {
    setFormData((prev) => ({ ...prev, fitnessLevel: levelValue }));
  }, []);

  // ── Effects ──
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("zyft_theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("zyft_theme", "light");
    }
  }, [darkMode]);

  // ── Styles (memoized strings) ──
  const inputBase = `w-full px-4 py-3.5 rounded-2xl border text-sm transition-all duration-200 outline-none`;
  const inputClass = `${inputBase} ${
    darkMode
      ? "bg-[#13131f] border-white/[0.06] text-white placeholder-gray-600 focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10"
      : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
  }`;
  const labelClass = `text-[11px] font-medium uppercase tracking-wider mb-2 block ${
    darkMode ? "text-gray-500" : "text-gray-500"
  }`;

  // ── Render ──
  return (
    <div
      className={`min-h-screen pt-4 pb-28 px-5 max-w-lg mx-auto transition-colors duration-300 ${
        darkMode ? "bg-[#0a0a0f] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 relative">
        <Link
          to="/profile"
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${
            darkMode
              ? "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              : "bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1
            className={`text-sm font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Edit Profile
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${
            darkMode
              ? "bg-white/5 text-yellow-400 hover:bg-white/10"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Profile Completion ── */}
      <div
        className={`rounded-2xl p-4 border mb-6 ${
          darkMode ? "bg-[#13131f] border-white/5" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-500">
              Profile Completion
            </span>
          </div>
          <span
            className={`text-xs font-bold ${
              completion === 100 ? "text-emerald-400" : "text-purple-400"
            }`}
          >
            {completion}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              completion === 100
                ? "bg-gradient-to-r from-emerald-400 to-green-400"
                : "bg-gradient-to-r from-purple-500 to-fuchsia-500"
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion === 100 && (
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <Award size={10} /> Profile complete! You're all set.
          </p>
        )}
      </div>

      {/* ── Avatar ── */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center text-4xl font-bold overflow-hidden ring-4 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300 shadow-xl shadow-purple-900/20">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white">
                {formData.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handlePhotoClick}
            className="absolute bottom-0 right-0 w-9 h-9 bg-[#8b5cf6] rounded-full flex items-center justify-center border-[3px] border-[#0a0a0f] hover:bg-[#7c3aed] active:scale-95 transition-all shadow-lg"
          >
            {uploadingPhoto ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <button
          type="button"
          onClick={handlePhotoClick}
          className="mt-4 text-xs font-medium text-[#8b5cf6] hover:text-[#a78bfa] transition-all"
        >
          {uploadingPhoto ? "Uploading..." : "Change Photo"}
        </button>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="space-y-4">
          <div className="flex items-center mb-1">
            <SectionIcon icon={User} darkMode={darkMode} />
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Personal Info
            </p>
          </div>

          <InputWrapper
            label="Display Name"
            field="name"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => handleFocus("name")}
              onBlur={handleBlur}
              placeholder="Your name"
              className={inputClass}
            />
          </InputWrapper>

          <InputWrapper
            label="Username"
            field="handle"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                @
              </span>
              <input
                type="text"
                name="handle"
                value={formData.handle.replace("@", "")}
                onChange={handleHandleChange}
                onFocus={() => handleFocus("handle")}
                onBlur={handleBlur}
                placeholder="username"
                className={`${inputClass} pl-8`}
              />
            </div>
          </InputWrapper>

          <InputWrapper
            label="Bio"
            field="bio"
            hint={`${formData.bio.length}/${BIO_MAX_LENGTH} characters`}
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              onFocus={() => handleFocus("bio")}
              onBlur={handleBlur}
              rows={3}
              placeholder="Tell us about yourself..."
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </InputWrapper>

          <div className="space-y-1.5">
            <label className={labelClass}>Fitness Level</label>
            <div className="grid grid-cols-4 gap-2">
              {fitnessLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleFitnessLevelChange(level.value)}
                  className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    formData.fitnessLevel === level.value
                      ? `${level.bg} ${level.border} ${level.color} ring-1 ring-offset-1 ring-offset-[#0a0a0f] ${level.border.replace(
                          "border-",
                          "ring-",
                        )}`
                      : "bg-[#13131f] border-white/5 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {level.value}
                </button>
              ))}
            </div>
          </div>

          <InputWrapper
            label="Fitness Focus"
            field="focus"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <input
              type="text"
              name="focus"
              value={formData.focus}
              onChange={handleChange}
              onFocus={() => handleFocus("focus")}
              onBlur={handleBlur}
              placeholder="e.g., Strength & running"
              className={inputClass}
            />
          </InputWrapper>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center mb-1">
            <SectionIcon icon={Mail} darkMode={darkMode} />
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Contact Info
            </p>
          </div>

          <InputWrapper
            label="Email"
            field="email"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus("email")}
              onBlur={handleBlur}
              placeholder="you@example.com"
              className={inputClass}
            />
          </InputWrapper>

          <InputWrapper
            label="Phone"
            field="phone"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => handleFocus("phone")}
              onBlur={handleBlur}
              placeholder="+1 234 567 890"
              className={inputClass}
            />
          </InputWrapper>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <div className="flex items-center mb-1">
            <SectionIcon icon={LinkIcon} darkMode={darkMode} />
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Social Links
            </p>
          </div>

          <InputWrapper
            label="Instagram"
            field="instagram"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <div className="relative">
              <InstagramIcon
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                onFocus={() => handleFocus("instagram")}
                onBlur={handleBlur}
                placeholder="@yourhandle"
                className={`${inputClass} pl-10`}
              />
            </div>
          </InputWrapper>

          <InputWrapper
            label="Twitter / X"
            field="twitter"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <div className="relative">
              <TwitterIcon
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                onFocus={() => handleFocus("twitter")}
                onBlur={handleBlur}
                placeholder="@yourhandle"
                className={`${inputClass} pl-10`}
              />
            </div>
          </InputWrapper>

          <InputWrapper
            label="TikTok"
            field="tiktok"
            darkMode={darkMode}
            formData={formData}
            activeField={activeField}
            onClear={clearField}
          >
            <div className="relative">
              <TikTokIcon
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                onFocus={() => handleFocus("tiktok")}
                onBlur={handleBlur}
                placeholder="@yourhandle"
                className={`${inputClass} pl-10`}
              />
            </div>
          </InputWrapper>
        </div>

        {/* ── Buttons ── */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              savedSuccess
                ? "bg-emerald-500 text-white shadow-emerald-900/20"
                : saving
                  ? "bg-purple-600/50 text-white cursor-wait"
                  : "bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white shadow-purple-900/25 hover:shadow-purple-900/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 size={18} /> Profile Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>

          <Link
            to="/profile"
            className={`w-full py-4 rounded-2xl border text-sm font-semibold text-center block active:scale-[0.98] transition-all ${
              darkMode
                ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20"
                : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
