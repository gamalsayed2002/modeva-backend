import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// دالة عامة لإنشاء إعدادات الرفع بناءً على اسم الفولدر
const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, `../uploads/${folderName}`));
    },
    filename: function (req, file, cb) {
      if (file) {
        cb(
          null,
          new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
        );
      } else {
        cb(null, false);
      }
    },
  });

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

// ⬇️ الاستخدام حسب الحاجة
export const productPhotoUpload = createUploader("products");
export const paymentPhotoUpload = createUploader("payments");
export const orderPhotoUpload = createUploader("orders");

// أو لو عايز تستخدمها دايناميك في الراوت:
export const uploadByFolder = (folder) => createUploader(folder);

export default createUploader;
