import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  ShoppingCart, 
  X, 
  Search,
  Plus,
  Minus,
  Trash2,
  Info,
  ArrowUpDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';
import Button from '../../../components/common/Button';
import CartSidebar from '../../../components/cart/CartSidebar';
import GlobalDiscountModal from '../../../components/admin/GlobalDiscountModal';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

type SygematProduct = {
  sku: string;
  name: string;
  category: string;
  urls_foto: string;
  web_list_price: number;
  atributos?: string;
  branch_stock?: any;
  unit_of_measurement?: string;
};

type CartItem = {
  product: SygematProduct;
  quantity: number;
};

type SortDirection = 'asc' | 'desc' | null;

const ITEMS_PER_PAGE = 50;

const CatalogPage = () => {
  const { profile } = useAuth();
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [products, setProducts] = useState<SygematProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SygematProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [priceSort, setPriceSort] = useState<SortDirection>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCart();
    fetchAllProducts();
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
      setGlobalDiscount(0);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      let allProducts: SygematProduct[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(
          `https://www.sygemat.com.ar/api-prod/Sygemat_Dat_dat/v1/art_cat_m?page%5Bnumber%5D=${page}&page%5Bsize%5D=1000&api_key=ZHwEoi7O`
        );

        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }

        const data = await response.json();
        
        const productsWithPrice = data.art_cat_m.map((product: any) => ({
          ...product,
          web_list_price: parseFloat(product.web_list_price || '0')
        }));

        allProducts = [...allProducts, ...productsWithPrice];
        
        const progress = Math.min(100, (allProducts.length / data.total_count) * 100);
        setLoadingProgress(Math.round(progress));
        
        hasMore = page * 500 < data.total_count;
        page++;
      }

      setProducts(allProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const addToCart = (product: SygematProduct) => {
    const existingItem = cart.find(item => item.product.sku === product.sku);
    
    if (existingItem) {
      const newCart = cart.map(item =>
        item.product.sku === product.sku
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newCart);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (sku: string) => {
    const newCart = cart.filter(item => item.product.sku !== sku);
    saveCart(newCart);
  };

  const updateQuantity = (sku: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.product.sku === sku) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 
          ? { ...item, quantity: newQuantity }
          : item;
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    saveCart(newCart);
  };

  const getImageUrls = (urls: string): string[] => {
    return urls.split(',').filter(url => url.trim());
  };

  const handleViewImages = (product: SygematProduct) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const handleViewDetails = (product: SygematProduct) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const togglePriceSort = () => {
    setPriceSort(current => {
      if (current === null) return 'asc';
      if (current === 'asc') return 'desc';
      return null;
    });
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = priceSort
    ? [...filteredProducts].sort((a, b) => {
        const priceA = calculateDiscountedPrice(a.web_list_price || 0);
        const priceB = calculateDiscountedPrice(b.web_list_price || 0);
        return priceSort === 'asc' ? priceA - priceB : priceB - priceA;
      })
    : filteredProducts;

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const calculateDiscountedPrice = (price: number) => {
    return price * (1 - (globalDiscount / 100));
  };

  const formatPrice = (product: SygematProduct) => {
    const originalPrice = product.web_list_price;
    const discountedPrice = calculateDiscountedPrice(originalPrice);
    const unit = product.unit_of_measurement === 'm2' ? '/m²' : '';
    
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-400 line-through">
          ${originalPrice?.toLocaleString()}{unit}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            ${discountedPrice?.toLocaleString()}{unit}
          </span>
          <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded">
            {globalDiscount}% OFF
          </span>
        </div>
      </div>
    );
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-black transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <div className="mt-4 flex items-center text-gray-600">
          <Loader className="w-5 h-5 animate-spin mr-2" />
          <span>Cargando productos ({loadingProgress}%)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          {globalDiscount > 0 && (
            <div className="flex items-center mt-1">
              <p className="text-sm text-green-600">
                ¡{globalDiscount}% de descuento en todos los productos!
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {isAdmin && globalDiscount === 0 && (
            <button
              onClick={() => setShowDiscountModal(true)}
              className="text-sm text-gray-500 hover:text-gray-700 mt-1 flex items-center"
            >
              <Settings className="w-4 h-4 mr-1" />
              Configurar descuento global
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCart(true)}
            className="relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                <button
                  onClick={togglePriceSort}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Precio</span>
                  <ArrowUpDown className={`w-4 h-4 ${priceSort ? 'text-black' : 'text-gray-400'}`} />
                  {priceSort && (
                    <span className="ml-1 text-xs">
                      ({priceSort === 'asc' ? '↑' : '↓'})
                    </span>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.map((product, index) => {
              const imageUrls = getImageUrls(product.urls_foto);
              const cartItem = cart.find(item => item.product.sku === product.sku);
              
              return (
                <tr 
                  key={`${product.sku}-${index}`} 
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative h-20 w-20 group">
                      <img
                        src={imageUrls[0] || 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'}
                        alt={product.name}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg';
                        }}
                      />
                      {imageUrls.length > 1 && (
                        <button
                          onClick={() => handleViewImages(product)}
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity"
                        >
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPrice(product)}
                  </td>
                  
<td className="px-6 py-4 whitespace-nowrap text-right">
  <div className="flex items-center justify-end space-x-2">
    {product.unit_of_measurement === 'm2' ? (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={cartItem?.quantity || ''}
          onChange={(e) => {
            const inputQuantity = parseFloat(e.target.value);
            const coefficient = parseFloat(product.coefficient || '1');
            if (!isNaN(inputQuantity) && coefficient > 0) {
              const boxesNeeded = Math.floor(inputQuantity / coefficient) + 1;
              const finalQuantity = parseFloat((boxesNeeded * coefficient).toFixed(2));
              const existingIndex = cart.findIndex(item => item.product.sku === product.sku);
              const newCart = [...cart];
              if (existingIndex >= 0) {
                newCart[existingIndex] = { product, quantity: finalQuantity };
              } else {
                newCart.push({ product, quantity: finalQuantity });
              }
              saveCart(newCart);
            }
          }}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="m²"
        />
        <span className="text-xs text-gray-500">m²</span>
        {cartItem && product.coefficient && (
          <span className="text-xs text-gray-400">
            {`≈ ${Math.round(cartItem.quantity / parseFloat(product.coefficient))} cajas`}
          </span>
        )}
      </div>
    ) : cartItem ? (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(product.sku, -1)}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium w-8 text-center">
          {cartItem.quantity}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(product.sku, 1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeFromCart(product.sku)}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </>
    ) : (
      <Button
        variant="outline"
        size="sm"
        onClick={() => addToCart(product)}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Agregar
      </Button>
    )}
  </div>
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, sortedProducts.length)} de {sortedProducts.length} productos
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedProduct && !showProductDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={getImageUrls(selectedProduct.urls_foto)[selectedImageIndex]}
                  alt={`${selectedProduct.name} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-96 object-contain"
                />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {getImageUrls(selectedProduct.urls_foto).map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-black'
                        : 'hover:opacity-75'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${selectedProduct.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && showProductDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Detalles del Producto</h3>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setShowProductDetails(false);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={getImageUrls(selectedProduct.urls_foto)[0] || 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {getImageUrls(selectedProduct.urls_foto).slice(1).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${selectedProduct.name} - Image ${index + 2}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
                    <p className="text-lg font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">SKU</h4>
                    <p>{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Precio</h4>
                    <p className="text-xl font-bold">
                      {formatPrice(selectedProduct)}
                    </p>
                  </div>
                  {selectedProduct.atributos && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Atributos</h4>
                      <p className="whitespace-pre-wrap">{selectedProduct.atributos}</p>
                    </div>
                  )}
                  {selectedProduct.branch_stock && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Stock por Sucursal</h4>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedProduct.branch_stock).map(([branch, stock]) => (
                          <div key={branch} className="flex justify-between">
                            <span>{branch}</span>
                            <span className="font-medium">{stock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4">
                    {cart.find(item => item.product.sku === selectedProduct.sku) ? (
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(selectedProduct.sku, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-lg font-medium w-8 text-center">
                          {cart.find(item => item.product.sku === selectedProduct.sku)?.quantity}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => updateQuantity(selectedProduct.sku, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => removeFromCart(selectedProduct.sku)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => addToCart(selectedProduct)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <GlobalDiscountModal
          currentDiscount={globalDiscount}
          onClose={() => setShowDiscountModal(false)}
          onUpdate={fetchGlobalDiscount}
        />
      )}

      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
};

export default CatalogPage;