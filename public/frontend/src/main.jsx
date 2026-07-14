import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
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
            {/* Notificaciones de toda la tienda: confirmaciones, errores y
                avisos salen por aquí (criterio 17 de la rúbrica) */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#1c1c1e',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                },
                success: { iconTheme: { primary: '#067FF9', secondary: '#fff' } },
                error: { duration: 4500 },
              }}
            />
          </CartProvider>
        </ProductosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
