import fetch from "node-fetch";
import { config } from "../../config.js";

//Array de funciones
const wompiController = {};

//Generar el token de acceso de Wompi
wompiController.generarToken = async (req, res) => {
  try {
    const response = await fetch("https://id.wompi.sv/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: config.wompi.grant_type,
        audience: config.wompi.audience,
        client_id: config.wompi.client_id,
        client_secret: config.wompi.client_secret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Tokenizar la tarjeta.
//Wompi nunca recibe el número de tarjeta en la transacción: primero hay que
//cambiarlo por un token de un solo uso, y ese token es el que se cobra.
//El número de tarjeta pasa por aquí y no se guarda en ningún lado.
wompiController.tokenizarTarjeta = async (req, res) => {
  try {
    //#1- El token de acceso y los datos de la tarjeta
    const { token, numeroTarjeta, cvv, mesVencimiento, anioVencimiento, nombreTarjetaHabiente } = req.body;

    const response = await fetch("https://api.wompi.sv/tokenizacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        numeroTarjeta,
        cvv,
        mesVencimiento: parseInt(mesVencimiento),
        anioVencimiento: parseInt(anioVencimiento),
        nombreTarjetaHabiente,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(400).json({ error });
    }

    //Devuelve { token, tarjetaEnmascarada }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//Transacción de prueba (tarjeta tokenizada, sin 3DS)
wompiController.paymentTest = async (req, res) => {
  try {
    //#1- Solicito los datos
    const { token, formData } = req.body;

    //Hago fetch
    const response = await fetch(
      "https://api.wompi.sv/TransaccionCompra/TokenizadaSin3Ds",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//TRANSACCIÓN REAL (con 3DS)
wompiController.payment3DS = async (req, res) => {
  try {
    //#1- Solicitar el token, y todos los valores (monto, tarjeta, nombre del titular)
    const { token, formData } = req.body;

    //Hago fetch
    const response = await fetch("https://api.wompi.sv/TransaccionCompra/3Ds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default wompiController;
