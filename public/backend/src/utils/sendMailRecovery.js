const HTMLRecoveryEmail = (code) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#1c1c1e">Recuperación de contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Applefly.
         Usa este código para continuar:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#067FF9;text-align:center;padding:16px;background:#f5f5f7;border-radius:8px">${code}</div>
      <p style="color:#666;font-size:13px">El código expira en 15 minutos.
         Si no fuiste tú, puedes ignorar este correo.</p>
    </div>
  `;
};

export default HTMLRecoveryEmail;
