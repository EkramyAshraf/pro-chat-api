exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const file = req.file;
    let messageType = "file";

    if (file.mimetype.startsWith("image/")) {
      messageType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      messageType = "video";
    } else if (file.mimetype.startsWith("audio/")) {
      messageType = "audio";
    }

    res.status(200).json({
      status: "success",
      data: {
        fileUrl: req.file.path,
        messageType,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
