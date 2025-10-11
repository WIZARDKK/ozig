import React, { useState } from 'react';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';
import { Category } from '../../types/product.types';

const CategoriesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingCategory(null);
    // The CategoryList will automatically refresh when it regains focus
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!showForm ? (
        <CategoryList
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
        />
      ) : (
        <CategoryForm
          category={editingCategory}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CategoriesPage;