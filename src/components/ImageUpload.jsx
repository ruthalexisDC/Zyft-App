import { useState } from "react";

const ImageUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_unsigned_preset"); // from Cloudinary dashboard

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dchye2j8e/image/upload", // replace with your cloud name
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      setImageUrl(data.secure_url);
      onUploadSuccess?.(data.secure_url); // pass URL to parent component
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>

      {imageUrl && (
        <div className="mt-4">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1 break-all">{imageUrl}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
