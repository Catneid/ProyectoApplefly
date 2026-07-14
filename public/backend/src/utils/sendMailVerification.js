const HTMLVerificationEmail = (code) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#1c1c1e">¡Bienvenido a Applefly!</h2>
      <p>Tu código de verificación es:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#067FF9;text-align:center;padding:16px;background:#f5f5f7;border-radius:8px">${code}</div>
      <p style="color:#666;font-size:13px">Expira en 15 minutos.</p>
    </div>
  `;
};

export default HTMLVerificationEmail;
