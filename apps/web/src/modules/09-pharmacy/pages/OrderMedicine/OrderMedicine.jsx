import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pharmacyService } from '../../services/pharmacyService';
import { patientService } from '../../../02-patient-profile/services/patientService';
import Button from '../../../../components/common/Button/Button';
import Modal from '../../../../components/common/Modal/Modal';
import { formatPKRSimple, formatAmount } from '../../../../utils/currencyFormatter';
import './OrderMedicine.css';

const OrderMedicine = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const categories = ['all', 'tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'ointment', 'inhaler', 'other'];

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await Promise.all([fetchMedicines(), fetchPharmacies()]);
      if (isMounted) {
        await fetchUserAddress();
      }
    };

    loadData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchMedicines();
  }, [selectedPharmacyId]);

  const fetchPharmacies = async () => {
    try {
      const response = await pharmacyService.getPharmacyDirectory();
      if (response.success) {
        setPharmacies(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.log('Unable to load pharmacy directory');
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getMedicineCatalog({
        lowStock: false,
        limit: 250,
        pharmacyId: selectedPharmacyId !== 'all' ? selectedPharmacyId : undefined
      });
      
      if (response.success && response.data) {
        const medicinesList = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || response.data.inventory || [];
        setMedicines(medicinesList);
        setFilteredMedicines(medicinesList);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      toast.error('Failed to load medicines. Please try again.');
      // Use mock data as fallback
      const mockMedicines = [
        { _id: '1', medicineId: '1', pharmacyId: 'demo', pharmacyName: 'Demo Pharmacy', name: 'Paracetamol 500mg', price: 20, stock: 100, category: 'tablet', description: 'For fever and pain relief' }
      ];
      setMedicines(mockMedicines);
      setFilteredMedicines(mockMedicines);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = async () => {
    try {
      const response = await patientService.getProfile();
      if (response.success && response.data?.patient?.address) {
        const addr = response.data.patient.address;
        setDeliveryAddress({
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zipCode || '',
          phone: response.data.user?.phone || ''
        });
      }
    } catch (error) {
      console.log('Could not fetch user address, user will need to enter it');
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(med =>
        med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(med =>
        med.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredMedicines(filtered);
  };

  const addToCart = (medicine) => {
    if (cart.length > 0 && cart[0].pharmacyId && cart[0].pharmacyId !== medicine.pharmacyId) {
      toast.warning('Please place one order per pharmacy. Clear cart to switch pharmacy.');
      return;
    }

    const existingItem = cart.find(item => item._id === medicine._id);
    
    if (existingItem) {
      if (existingItem.quantity >= medicine.stock) {
        toast.warning('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(item =>
        item._id === medicine._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success('Quantity updated in cart');
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
      toast.success('Added to cart');
    }
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item._id !== medicineId));
    toast.info('Removed from cart');
  };

  const updateQuantity = (medicineId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(medicineId);
      return;
    }

    const medicine = medicines.find(m => m._id === medicineId);
    if (newQuantity > medicine.stock) {
      toast.warning('Cannot exceed available stock');
      return;
    }

    setCart(cart.map(item =>
      item._id === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handlePlaceOrder = async () => {
    try {
      setCheckoutLoading(true);

      // Validate delivery address
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.phone) {
        toast.error('Please fill in all delivery address fields');
        return;
      }

      const orderData = {
        pharmacyId: cart[0]?.pharmacyId,
        items: cart.map(item => ({
          medicineId: item.medicineId || item._id,
          medicineName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress: deliveryAddress,
        totalAmount: calculateTotal(),
        paymentMethod: 'cash'
      };

      const response = await patientService.createMedicineOrder(orderData);

      if (response.success) {
        toast.success('Order placed successfully!');
        setCart([]);
        setShowCheckoutModal(false);
        navigate('/patient/track-order/' + response.data._id);
      } else {
        throw new Error(response.message || 'Order failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-medicine loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading medicines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-medicine">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">Order Medicines</h1>
            <p className="page-subtitle">Browse and order medicines from our pharmacy</p>
          </div>
          <button 
            className="btn-cart" 
            onClick={() => setShowCart(!showCart)}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="cart-count">{cart.length}</span>
            Cart
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${selectedPharmacyId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPharmacyId('all')}
          >
            All Pharmacies
          </button>
          {pharmacies.map((pharmacy) => (
            <button
              key={pharmacy._id}
              className={`category-btn ${selectedPharmacyId === pharmacy._id ? 'active' : ''}`}
              onClick={() => setSelectedPharmacyId(pharmacy._id)}
            >
              {pharmacy.pharmacyName}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="medicines-grid">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map(medicine => {
            const cartItem = cart.find(item => item._id === medicine._id);
            const inCart = !!cartItem;
            
            return (
              <div key={medicine._id} className="medicine-card">
                <div className="medicine-header">
                  <h3 className="medicine-name">{medicine.name}</h3>
                  <span className={`stock-badge ${medicine.stock < 10 ? 'low' : ''}`}>
                    {medicine.stock > 0 ? `${medicine.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                
                {medicine.description && (
                  <p className="medicine-description">{medicine.description}</p>
                )}

                {medicine.pharmacyName && (
                  <p className="medicine-description">Pharmacy: {medicine.pharmacyName}</p>
                )}
                
                <div className="medicine-footer">
                  <div className="price-section">
                    <span className="price-label">Price:</span>
                    <span className="price">{formatPKRSimple(medicine.price)}</span>
                  </div>
                  
                  {inCart ? (
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(medicine._id, cartItem.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{cartItem.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(medicine._id, cartItem.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => addToCart(medicine)}
                      disabled={medicine.stock === 0}
                    >
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-results">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3>No medicines found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button for Mobile */}
      {cart.length > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowCart(true)}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="cart-badge">{cart.length}</span>
        </button>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Shopping Cart</h2>
              <button className="close-btn" onClick={() => setShowCart(false)}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="cart-items">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="item-price">{formatPKRSimple(item.price)} x {item.quantity}</p>
                    </div>
                    <div className="item-actions">
                      <div className="quantity-controls-small">
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-cart">
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Your cart is empty</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">{formatPKRSimple(calculateTotal())}</span>
                </div>
                <Button onClick={handleCheckout} className="checkout-btn">
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          title="Confirm Order"
        >
          <div className="checkout-modal">
            <div className="order-summary">
              <h3>Order Summary</h3>
              {cart.map(item => (
                <div key={item._id} className="summary-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatPKRSimple(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-total">
                <strong>Total:</strong>
                <strong>{formatPKRSimple(calculateTotal())}</strong>
              </div>
            </div>

            <div className="delivery-address-form">
              <h3>Delivery Address</h3>
              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  placeholder="House #, Street name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowCheckoutModal(false)}
                disabled={checkoutLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePlaceOrder}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderMedicine;