const mediaService = require("../services/mediaService");

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const file = req.file;
    const result = await mediaService.processUploadedFile(file);

    res.status(200).json({
      status: "success",
      data: {
        fileUrl: result.fileUrl,
        messageType: result.messageType,
      },
    });
  } catch (err) {
    const statusCode = err.message === "No file uploaded." ? 400 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};
