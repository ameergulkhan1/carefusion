import React from 'react';
import Card from '../../../components/common/Card/Card';
import { formatPKRSimple } from '../../../utils/currencyFormatter';

const MedicineCard = ({ medicine, onAddToCart }) => {
  return (
    <Card className="medicine-card">
      <div className="medicine-image">
        <img src={medicine.image || '/assets/images/medicine-placeholder.png'} alt={medicine.name} />
      </div>
      <h3>{medicine.name}</h3>
      <p className="medicine-description">{medicine.description}</p>
      <div className="medicine-footer">
        <span className="medicine-price">{formatPKRSimple(medicine.price)}</span>
        <button className="btn-add-cart" onClick={() => onAddToCart(medicine)}>
          Add to Cart
        </button>
      </div>
    </Card>
  );
};

export default MedicineCard;