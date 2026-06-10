const logoutController = {};

logoutController.logoutCustomer = (req, res) => {
  res.clearCookie("authCookie");
  return res.status(200).json({ message: "Sesión cerrada" });
};

logoutController.logoutAdmin = (req, res) => {
  res.clearCookie("adminAuthCookie");
  return res.status(200).json({ message: "Sesión admin cerrada" });
};

export default logoutController;
