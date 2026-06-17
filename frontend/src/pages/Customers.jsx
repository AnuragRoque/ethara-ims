import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users2, Mail, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';

export default function Customers() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await apiClient.get('/customers');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCustomer) => apiClient.post('/customers', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', phone: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
    });
  };

  const columns = [
    { 
      header: 'Customer Details', 
      accessor: 'full_name',
      csvValue: (row) => row.full_name,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
            {row.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.full_name}</p>
            <p className="text-xs text-slate-500">ID: CUST-{row.id.toString().padStart(4, '0')}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Contact Information', 
      accessor: 'email',
      csvValue: (row) => `${row.email} ${row.phone ? `| ${row.phone}` : ''}`,
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {row.email}
          </div>
          {row.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {row.phone}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => {
            setCustomerToDelete(row);
            setIsDeleteModalOpen(true);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl hidden sm:block">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
            <p className="text-slate-500 mt-1">Manage your clients and their contact information.</p>
          </div>
        </div>
        <Button variant="accent" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={customers} 
        isLoading={isLoading} 
        emptyTitle="No Customers Yet"
        emptyDescription="You haven't added any customers. Add your first customer to start placing orders."
        searchableFields={['full_name', 'email', 'phone']}
        csvFilename="ethara_customers_export.csv"
        actionButton={
          <Button variant="accent" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add First Customer
          </Button>
        }
      />

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <Input 
            label="Full Legal Name" 
            placeholder="e.g. Acme Corporation or John Doe" 
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            required
          />
          <Input 
            label="Email Address" 
            type="email"
            placeholder="e.g. billing@acme.com" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            helperText="Used for digital receipts and primary contact. Must be unique."
            required
          />
          <Input 
            label="Phone Number (Optional)" 
            type="tel"
            placeholder="+1 (555) 000-0000" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="accent" type="submit" isLoading={createMutation.isPending}>Save Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              Are you sure you want to permanently delete <strong>{customerToDelete?.full_name}</strong>? 
              This will remove them from the directory.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Keep Customer</Button>
            <Button 
              variant="danger" 
              isLoading={deleteMutation.isPending} 
              onClick={() => deleteMutation.mutate(customerToDelete.id)}
            >
              Yes, Delete It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
