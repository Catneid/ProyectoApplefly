import orderModel from "../models/orders.js";
import productModel from "../models/products.js";

const ordersController = {};

const ENVIO = 15;
const ENVIO_GRATIS_DESDE = 500;
const IVA = 0.13;

// Vuelve a calcular el pedido usando los precios que están en la base de
// datos. Nunca se confía en el subtotal/total que manda el navegador: si no,
// cualquiera podría mandar total = 1 y llevarse un iPhone por un dólar.
const calcularPedido = async (productosPedidos) => {
  let subtotal = 0;
  const productos = [];

  for (const item of productosPedidos) {
    const producto = await productModel.findById(item.productId);

    if (!producto) {
      throw new Error(`El producto ya no está disponible`);
    }

    const cantidad = parseInt(item.quantity);
    if (!cantidad || cantidad < 1) {
      throw new Error(`Cantidad inválida para ${producto.name}`);
    }

    if (producto.stock < cantidad) {
      throw new Error(`Solo quedan ${producto.stock} unidades de ${producto.name}`);
    }

    const subtotalItem = producto.price * cantidad;
    subtotal += subtotalItem;

    productos.push({
      productId: producto._id,
      name: producto.name,
      price: producto.price,
      quantity: cantidad,
      subtotal: subtotalItem,
    });
  }

  const shipping = subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
  const tax = subtotal * IVA;
  const total = subtotal + shipping + tax;

  return {
    productos,
    subtotal: Math.round(subtotal * 100) / 100,
    shipping,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// El cliente confirma su compra. Solo llega aquí si tiene sesión (verifyToken).
ordersController.createOrder = async (req, res) => {
  try {
    const { products, address, phone, payment } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    if (!address || !phone) {
      return res.status(400).json({ message: "Faltan los datos de envío" });
    }

    const calculado = await calcularPedido(products);

    const newOrder = new orderModel({
      // El cliente sale del token, no del body: nadie puede hacer un pedido
      // a nombre de otra persona.
      customerId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      products: calculado.productos,
      subtotal: calculado.subtotal,
      shipping: calculado.shipping,
      tax: calculado.tax,
      total: calculado.total,
      address,
      phone,
      payment,
      status: "pendiente",
    });

    await newOrder.save();

    // Descontar el stock ya que la compra se concretó
    for (const item of calculado.productos) {
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    return res.status(201).json({ message: "Pedido creado", order: newOrder });
  } catch (error) {
    console.log(error);
    // Los errores de calcularPedido (sin stock, producto borrado) son culpa
    // de la petición, no del servidor: van como 400 para que el frontend
    // pueda mostrárselos al usuario.
    return res.status(400).json({ message: error.message || "No se pudo crear el pedido" });
  }
};

// Historial: solo los pedidos del cliente que está en sesión
ordersController.getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ customerId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

ordersController.getMyOrderById = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // No basta con que el pedido exista: tiene que ser suyo
    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default ordersController;
