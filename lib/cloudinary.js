import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET ? '***SECRET***' : 'NOT SET'
);

export const cloudinaryUploadImage = async (fileBuffer, folderName) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${fileBuffer.toString('base64')}`, 
      {
        folder: folderName,
        resource_type: "auto",
      }
    );
    return result;
  } catch (err) {
    console.log("Cloudinary upload error:", err);
    return err;
  }
};

export const cloudinaryRemoveImage = async (PublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(PublicId);
    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};