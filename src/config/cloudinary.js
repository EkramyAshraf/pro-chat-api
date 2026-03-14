const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log(file);
    let resourceType = "auto";
    let folderName = "SyncOps/Others";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      folderName = "SyncOps/Images";
    } else if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("audio/")
    ) {
      resourceType = "video";
      folderName = file.mimetype.startsWith("video/")
        ? "SyncOps/Videos"
        : "SyncOps/Voices";
    } else {
      resourceType = "raw";
      folderName = "SyncOps/Documents";
    }

    let public_id;
    if (resourceType === "raw") {
      public_id = `${Date.now()}-${file.originalname}`;
    } else {
      public_id = `${Date.now()}-${file.originalname.split(".")[0]}`;
    }
    return {
      folder: folderName,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "png",
        "jpeg",
        "mp4",
        "mp3",
        "wav",
        "pdf",
        "docx",
      ],
      public_id: public_id,
    };
  },
});

module.exports = { cloudinary, storage };
