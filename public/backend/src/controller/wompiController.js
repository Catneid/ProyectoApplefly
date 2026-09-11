import {
  WompiHttpError,
  cobrarToken3DSWompi,
  cobrarTokenWompi,
  obtenerTokenWompi,
  tokenizarTarjetaWompi,
} from "../services/wompiPagos.js";

const wompiController = {};

wompiController.generarToken = async (req, res) => {
  try {
    const data = await obtenerTokenWompi();
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof WompiHttpError) {
      return res.status(500).json({ error: error.wompiRaw });
    }
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


wompiController.tokenizarTarjeta = async (req, res) => {
  try {
    const { token, numeroTarjeta, cvv, mesVencimiento, anioVencimiento, nombreTarjetaHabiente } = req.body;

    const data = await tokenizarTarjetaWompi({
      token,
      numeroTarjeta,
      cvv,
      mesVencimiento,
      anioVencimiento,
      nombreTarjetaHabiente,
    });
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof WompiHttpError) {
      return res.status(400).json({ error: error.wompiRaw });
    }
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

wompiController.paymentTest = async (req, res) => {
  try {
    const { token, formData } = req.body;

    const data = await cobrarTokenWompi({ token, formData });
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof WompiHttpError) {
      return res.status(500).json({ error: error.wompiRaw });
    }
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


wompiController.payment3DS = async (req, res) => {
  try {
    const { token, formData } = req.body;

    const data = await cobrarToken3DSWompi({ token, formData });
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof WompiHttpError) {
      return res.status(500).json({ error: error.wompiRaw });
    }
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default wompiController;
