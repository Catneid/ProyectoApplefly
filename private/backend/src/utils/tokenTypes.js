// Claim "typ" de los JWT que firma este backend. Se firman con el mismo
// secreto que los de public/backend (JWT_Secret_key), así que sin esto una
// sesión de cliente copiada a adminAuthCookie podría pasar por sesión de
// administración. verifyAdmin exige este typ.
export const TOKEN_TYP = {
  ADMIN_SESSION: "admin-session", // adminAuthCookie: sesión de un empleado del panel
};
