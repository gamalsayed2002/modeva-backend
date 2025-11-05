import multer from "multer";

// دالة عامة لإنشاء إعدادات الرفع
const createUploader = () => {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith("image")) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file format"), false);
      }
    },
  });
};

export default createUploader;