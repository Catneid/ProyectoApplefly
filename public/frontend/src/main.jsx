import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProductosProvider } from './context/ProductosContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductosProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ProductosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
