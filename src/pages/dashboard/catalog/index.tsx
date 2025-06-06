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
  id: string;
  name: string;
  sku: string;
  web_list_price: number;
  urls_foto?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SygematProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
