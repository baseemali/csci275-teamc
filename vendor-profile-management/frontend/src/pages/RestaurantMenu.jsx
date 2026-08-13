import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Plus, Pencil, Trash2, X, Image as ImageIcon, 
  CheckCircle, XCircle, BookOpen, UtensilsCrossed 
} from 'lucide-react';
import { 
  getRestaurantMenu, createMenuItem, updateMenuItem, deleteMenuItem,
  getRestaurantProfile 
} from '../services/api';

const CATEGORIES = ['Appetizers', 'Main Course', 'Desserts', 'Drinks', 'Sides', 'Specials'];

const initialFormData = {
  name: '', description: '', price: '', category: 'Main Course', imageUrl: ''
};

export default function RestaurantMenu() {
  const { id } = useParams(); // restaurantId from URL
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [restRes, menuRes] = await Promise.all([
        getRestaurantProfile(id),
        getRestaurantMenu(id)
      ]);
      setRestaurant(restRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      return toast.error('Name and Price are required');
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateMenuItem(id, editingId, formData);
        toast.success('Item updated!');
      } else {
        await createMenuItem(id, formData);
        toast.success('Item added to menu!');
      }
      closeModal();
      loadData();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateMenuItem(id, item.id, { ...item, isAvailable: !item.isAvailable });
      setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
      toast.success(item.isAvailable ? 'Marked as Sold Out' : 'Marked as Available');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      await deleteMenuItem(id, item.id);
      setMenuItems(menuItems.filter(i => i.id !== item.id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  // Group items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading menu...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/restaurant')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-yellow-500" />
              {restaurant?.name} Menu
            </h1>
            <p className="text-gray-400 text-sm">Manage your food and drink offerings</p>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Menu Content */}
      {menuItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
          <UtensilsCrossed size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg mb-2">Your menu is empty</p>
          <p className="text-gray-500 text-sm mb-6">Add your first dish to get started.</p>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition">
            <Plus size={18} /> Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                {category} <span className="text-gray-500 text-sm font-normal ml-2">({items.length} items)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col transition-all ${!item.isAvailable ? 'opacity-60' : 'hover:border-yellow-500/50'}`}>
                    {/* Image */}
                    <div className="h-32 bg-gray-900 relative flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                      ) : (
                        <ImageIcon size={32} className="text-gray-700" />
                      )}
                      {!item.isAvailable && (
                        <span className="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-semibold">Sold Out</span>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-white font-semibold">{item.name}</h3>
                        <span className="text-yellow-500 font-bold">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                        {item.description || 'No description'}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-700">
                        <button onClick={() => toggleAvailability(item)} title={item.isAvailable ? 'Mark Sold Out' : 'Mark Available'} className={`flex-1 py-1.5 rounded text-xs font-medium transition ${item.isAvailable ? 'bg-gray-700 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                          {item.isAvailable ? 'Mark Sold Out' : 'Make Available'}
                        </button>
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition p-1"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Item Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500" placeholder="e.g., Truffle Margherita Pizza" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price ($) *</label>
                  <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500" placeholder="14.99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 resize-none" placeholder="Ingredients and details..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image URL (Optional)</label>
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500" placeholder="https://..." />
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-700" onError={(e) => e.target.style.display='none'} onLoad={(e) => e.target.style.display='block'} />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}