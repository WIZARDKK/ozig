import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import { Product } from '../../types/product.types';

const ProductsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingProduct(null);
    // The ProductList will automatically refresh when it regains focus
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!showForm ? (
        <ProductList
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
        />
      ) : (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default ProductsPage;