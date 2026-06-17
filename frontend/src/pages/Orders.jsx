import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye, PlusCircle, X, ShoppingCart, AlertCircle, ShoppingBag, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';

export default function Orders() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Form State
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([{ product_id: '', quantity: 1 }]);

  // Fetch Data
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await apiClient.get('/orders')).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await apiClient.get('/customers')).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await apiClient.get('/products')).data,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newOrder) => apiClient.post('/orders', newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changed
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Order placed successfully');
      setIsAddModalOpen(false);
      setCustomerId('');
      setLineItems([{ product_id: '', quantity: 1 }]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Restocked
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Order cancelled and inventory restocked');
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    },
  });

  // Derived calculations for preview
  const runningTotal = useMemo(() => {
    if (!products) return 0;
    return lineItems.reduce((total, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product && item.quantity > 0) {
        return total + (product.price * item.quantity);
      }
      return total;
    }, 0);
  }, [lineItems, products]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const validItems = lineItems
      .filter(item => item.product_id && item.quantity > 0)
      .map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity)
      }));

    if (validItems.length === 0) {
      toast.error('Please add at least one valid product.');
      return;
    }

    createMutation.mutate({
      customer_id: parseInt(customerId),
      items: validItems,
    });
  };

  const columns = [
    { 
      header: 'Order Reference', 
      accessor: 'id',
      csvValue: (row) => `ORD-${row.id.toString().padStart(5, '0')}`,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">ORD-{row.id.toString().padStart(5, '0')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{new Date(row.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
      ) 
    },
    { 
      header: 'Customer', 
      accessor: 'customer.full_name',
      csvValue: (row) => row.customer?.full_name || 'Unknown',
      cell: (row) => (
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200">
          <Users2 className="w-3.5 h-3.5 text-slate-400" />
          {row.customer?.full_name || `Unknown`}
        </span>
      ) 
    },
    { 
      header: 'Total Value', 
      accessor: 'total_amount',
      csvValue: (row) => row.total_amount,
      cell: (row) => <span className="font-bold text-brand-700 text-lg">${parseFloat(row.total_amount).toFixed(2)}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="text-slate-600 border-transparent shadow-none hover:border-slate-200"
            onClick={() => {
              setSelectedOrder(row);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1.5" /> View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              setSelectedOrder(row);
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
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-500 mt-1">Process new transactions and review historical orders.</p>
          </div>
        </div>
        <Button variant="accent" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create Order
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={orders} 
        isLoading={isLoadingOrders} 
        emptyTitle="No Orders Processed"
        emptyDescription="There are no historical orders in the system. When a customer purchases a product, it will appear here."
        searchableFields={['id', 'customer.full_name', 'total_amount']}
        csvFilename="ethara_orders_export.csv"
        actionButton={
          <Button variant="accent" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create First Order
          </Button>
        }
      />

      {/* Create Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Transaction Checkout" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-slate-400" /> 1. Select Customer
            </h3>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              options={customers?.map(c => ({ value: c.id, label: `${c.full_name} (${c.email})` })) || []}
              helperText="Who is making this purchase?"
            />
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-400" /> 2. Add Line Items
            </h3>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex-1">
                    <Select
                      label="Product"
                      value={item.product_id}
                      onChange={(e) => {
                        const newItems = [...lineItems];
                        newItems[index].product_id = e.target.value;
                        setLineItems(newItems);
                      }}
                      required
                      options={products?.map(p => ({ 
                        value: p.id, 
                        label: `${p.name} — $${p.price} (${p.quantity} left)` 
                      })) || []}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...lineItems];
                        newItems[index].quantity = e.target.value;
                        setLineItems(newItems);
                      }}
                      required
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <Button 
                      variant="ghost" 
                      type="button"
                      className="p-2 text-red-500 hover:text-white hover:bg-red-500 mt-7 shrink-0"
                      onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                size="sm" 
                type="button" 
                className="w-full border-dashed border-2 bg-transparent hover:bg-white"
                onClick={() => setLineItems([...lineItems, { product_id: '', quantity: 1 }])}
              >
                <PlusCircle className="w-4 h-4 mr-2 text-slate-400" />
                Add Another Line Item
              </Button>
            </div>
          </div>

          {/* Receipt Total */}
          <div className="bg-brand-900 p-6 rounded-2xl text-white shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div>
              <span className="text-sm font-medium text-slate-300 uppercase tracking-widest block mb-1">Total Due</span>
              <p className="text-xs text-slate-400">Calculated automatically based on items</p>
            </div>
            <span className="text-4xl font-bold tracking-tight">${runningTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel Transaction</Button>
            <Button variant="accent" type="submit" isLoading={createMutation.isPending}>Submit Order</Button>
          </div>
        </form>
      </Modal>

      {/* View Order Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Order Receipt`} maxWidth="max-w-lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-bold text-slate-900 text-lg">{selectedOrder.customer?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reference ID</p>
                  <p className="font-bold text-slate-900">ORD-{selectedOrder.id.toString().padStart(5, '0')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Line Items ({selectedOrder.items.length})</p>
                <div className="space-y-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">Product #{item.product_id}</p>
                        <p className="text-sm text-slate-500">{item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-slate-900">${parseFloat(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-5 mt-5 border-t-2 border-dashed border-slate-300">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Total Paid</span>
                <span className="text-2xl font-bold text-brand-700">${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Cancel Order">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold mb-1">Warning: Order Cancellation</p>
              <p>
                Are you sure you want to cancel <strong>ORD-{selectedOrder?.id.toString().padStart(5, '0')}</strong>? 
                The inventory for these items will be automatically restocked into the system.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Keep Order</Button>
            <Button 
              variant="danger" 
              isLoading={deleteMutation.isPending} 
              onClick={() => deleteMutation.mutate(selectedOrder.id)}
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
