const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const { newUser } = await authService.registerUser(req.body);
    res.status(201).json({
      status: "success",
      newUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;
    const { user, token } = await authService.loginUser(
      email,
      password,
      fcmToken,
    );
    res.status(200).json({
      status: "success",
      username: user.username,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user._id;
    await authService.clearUserSession(userId);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
