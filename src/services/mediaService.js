exports.processUploadedFile = async (file) => {
  if (!file) {
    throw new Error("No file uploaded.");
  }
  let messageType = "file";

  if (file.mimetype.startsWith("image/")) {
    messageType = "image";
  } else if (file.mimetype.startsWith("video/")) {
    messageType = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    messageType = "audio";
  }

  return {
    fileUrl: file.path,
    messageType,
  };
};
