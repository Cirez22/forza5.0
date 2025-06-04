import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, MapPin, Truck } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';

type Project = {
  id: string;
  name: string;
};

type CartItem = {
  product: any;
  quantity: number;
};

type ShippingType = 'delivery' | 'takeaway';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (sku: string, delta: number) => void;
  onRemoveItem: (sku: string) => void;
}

const FOSCHI_ADDRESS = "Av. Rivadavia 1234, CABA";
const DELIVERY_SCHEDULE_OPTIONS = [
  "8:00 - 12:00",
  "12:00 - 16:00",
  "16:00 - 20:00"
];

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [shippingType, setShippingType] = useState<ShippingType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliverySchedule, setDeliverySchedule] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchGlobalDiscount();
  }, []);

  const fetchGlobalDiscount = async () => {
    try {
      const { data, error } = await supabase
        .from('global_discount')
        .select('percentage')
        .eq('active', true)
        .single();

      if (error) throw error;
      setGlobalDiscount(data?.percentage ?? 0);
    } catch (err) {
      console.error('Error fetching global discount:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const calculateDiscountedPrice = (price: number) => {
    return Math.round(price * (1 - (globalDiscount / 100)));
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (calculateDiscountedPrice(item.product.web_list_price) * item.quantity), 0
  );

  const handleCheckout = async () => {
    if (!selectedProject) {
      alert('Por favor selecciona un proyecto');
      return;
    }

    if (shippingType === 'delivery' && (!deliveryAddress || !deliverySchedule)) {
      alert('Por favor completa los datos de envío');
      return;
    }

    setLoading(true);
    // Here you would implement the checkout logic
    // For now, we'll just show a success message
    alert('Pedido realizado con éxito');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Carrito de Compras</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                El carrito está vacío
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Proyecto
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shipping Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Envío
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShippingType('delivery')}
                      className={`p-4 border rounded-lg flex flex-col items-center ${
                        shippingType === 'delivery'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <Truck className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Envío a domicilio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingType('takeaway')}
                      className={`p-4 border rounded-lg flex flex-col items-center ${
                        shippingType === 'takeaway'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <MapPin className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Retiro en sucursal</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Options */}
                {shippingType === 'delivery' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección de Envío
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ingresa la dirección de envío"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario de Entrega
                      </label>
                      <select
                        value={deliverySchedule}
                        onChange={(e) => setDeliverySchedule(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                      >
                        <option value="">Seleccionar horario</option>
                        {DELIVERY_SCHEDULE_OPTIONS.map((schedule) => (
                          <option key={schedule} value={schedule}>
                            {schedule}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Dirección de retiro</h3>
                    <p className="text-sm text-gray-600">{FOSCHI_ADDRESS}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Horario: Lunes a Viernes de 8:00 a 18:00
                    </p>
                  </div>
                )}

                {/* Cart Items */}
                <div className="space-y-4">
                  {cart.map((item) => {
                    const originalPrice = Math.round(item.product.web_list_price);
                    const discountedPrice = calculateDiscountedPrice(item.product.web_list_price);
                    
                    return (
                      <div
                        key={item.product.sku}
                        className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <img
                            src={item.product.urls_foto?.split(',')[0] || 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-400 line-through">
                              ${originalPrice.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">
                                ${discountedPrice.toLocaleString()}
                              </span>
                              {globalDiscount > 0 && (
                                <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded">
                                  {globalDiscount}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.product.sku, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.product.sku, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveItem(item.product.sku)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total</span>
              <span className="text-lg font-bold">
                ${Math.round(cartTotal).toLocaleString()}
              </span>
            </div>
            <Button
              variant="primary"
              fullWidth
              disabled={cart.length === 0 || loading}
              onClick={handleCheckout}
            >
              {loading ? 'Procesando...' : 'Finalizar Compra'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;