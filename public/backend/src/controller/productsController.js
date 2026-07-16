import productModel from "../models/products.js";
import reviewModel from "../models/reviews.js";

const productsController = {};


const agregarValoraciones = async (productos) => {
  const ids = productos.map((p) => p._id);

  const resumen = await reviewModel.aggregate([
    { $match: { productId: { $in: ids } } },
    {
      $group: {
        _id: "$productId",
        rating: { $avg: "$rating" },
        reviews: { $sum: 1 },
      },
    },
  ]);

  const porProducto = new Map(resumen.map((r) => [String(r._id), r]));

  return productos.map((p) => {
    const datos = porProducto.get(String(p._id));
    return {
      ...p.toObject(),
      rating: datos ? Math.round(datos.rating * 10) / 10 : 0,
      reviews: datos ? datos.reviews : 0,
    };
  });
};

productsController.getProducts = async (req, res) => {
  try {
    const products = await productModel.find().populate("category", "name");
    return res.status(200).json(await agregarValoraciones(products));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

productsController.getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const [conValoraciones] = await agregarValoraciones([product]);
    return res.status(200).json(conValoraciones);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default productsController;
