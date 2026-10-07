import { adminCookieOptions } from "../utils/cookieOptions.js";

const logoutController = {};

logoutController.logoutAdmin = (req, res) => {
  res.clearCookie("adminAuthCookie", adminCookieOptions);
  return res.status(200).json({ message: "Sesión admin cerrada" });
};

export default logoutController;
