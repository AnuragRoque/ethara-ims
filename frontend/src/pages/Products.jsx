import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Box, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';

const LOW_STOCK_THRESHOLD = parseInt(import.meta.env.VITE_LOW_STOCK_THRESHOLD || '10', 10);

export default function Products() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get('/products');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => apiClient.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    },
  });

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingProductId(null);
    setFormData({ name: '', sku: '', price: '', quantity: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setEditingProductId(product.id);
    setFormData({ 
      name: product.name, 
      sku: product.sku, 
      price: product.price.toString(), 
      quantity: product.quantity.toString() 
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', sku: '', price: '', quantity: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity, 10),
    };

    if (isEditMode) {
      updateMutation.mutate({ id: editingProductId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { 
      header: 'Product Details', 
      accessor: 'name',
      csvValue: (row) => `${row.name} (SKU: ${row.sku})`,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {row.sku}</p>
        </div>
      )
    },
    { 
      header: 'Unit Price', 
      accessor: 'price',
      csvValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-slate-700">${parseFloat(row.price).toFixed(2)}</span>
    },
    { 
      header: 'Inventory Status', 
      accessor: 'quantity',
      csvValue: (row) => row.quantity,
      cell: (row) => {
        if (row.quantity === 0) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
              Out of Stock
            </span>
          );
        }
        if (row.quantity < LOW_STOCK_THRESHOLD) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Low Stock ({row.quantity})
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            In Stock ({row.quantity})
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            onClick={() => openEditModal(row)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              setProductToDelete(row);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl hidden sm:block">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Directory</h1>
            <p className="text-slate-500 mt-1">Manage pricing, SKUs, and track your current inventory levels.</p>
          </div>
        </div>
        <Button variant="accent" onClick={openAddModal}>
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={products} 
        isLoading={isLoading}
        emptyTitle="No Products Found"
        emptyDescription="Your catalog is currently empty. Get started by adding your first product to the system."
        searchableFields={['name', 'sku']}
        csvFilename="ethara_products_export.csv"
        actionButton={
          <Button variant="accent" onClick={openAddModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add First Product
          </Button>
        }
      />

      {/* Add / Edit Product Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditMode ? "Edit Product" : "Add New Product"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Product Name" 
            placeholder="e.g. Mechanical Keyboard" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            helperText="The public-facing name of the item."
            required
          />
          <Input 
            label="SKU (Stock Keeping Unit)" 
            placeholder="e.g. KB-MECH-87" 
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            helperText="A unique identifier. Must not duplicate existing items."
            required
          />
          <div className="grid grid-cols-2 gap-5 pt-2">
            <Input 
              label="Unit Price ($)" 
              type="number" 
              step="0.01" 
              min="0"
              placeholder="0.00" 
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
            <Input 
              label={isEditMode ? "Current Quantity" : "Initial Quantity"} 
              type="number" 
              min="0"
              placeholder="0" 
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
            />
          </div>
          <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
            <Button variant="accent" type="submit" isLoading={isEditMode ? updateMutation.isPending : createMutation.isPending}>
              {isEditMode ? "Save Changes" : "Save Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              Are you sure you want to permanently delete <strong>{productToDelete?.name}</strong>? 
              This action cannot be undone and will remove the item from all inventory views.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Keep Product</Button>
            <Button 
              variant="danger" 
              isLoading={deleteMutation.isPending} 
              onClick={() => deleteMutation.mutate(productToDelete.id)}
            >
              Yes, Delete It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
