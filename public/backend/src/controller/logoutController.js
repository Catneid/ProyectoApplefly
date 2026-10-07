import { authCookieOptions } from "../utils/cookieOptions.js";

const logoutController = {};

logoutController.logoutCustomer = (req, res) => {
  res.clearCookie("authCookie", authCookieOptions);
  return res.status(200).json({ message: "Sesión cerrada" });
};

export default logoutController;
