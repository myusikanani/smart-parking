import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineMapPin,
  HiOutlineBuildingStorefront,
  HiOutlineBolt,
  HiOutlineVideoCamera,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineArrowsPointingOut,
  HiOutlineCube,
  HiOutlineRectangleStack,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import { locationApi } from '../../services/api';
import type { ParkingLocationItem, AreaItem } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

const AMENITY_OPTIONS = [
  'EV Fast Charging',
  'CCTV 24/7',
  'Covered Parking',
  'Valet Service',
  '24/7 Security',
  'Elevator Ramp',
  'VIP Reserved',
  'Solar Powered',
  'Car Wash',
];

interface LocationFormData {
  _id?: string;
  name: string;
  code: string;
  area: string;
  city: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  totalFloors: number;
  contactNumber: string;
  operatingHours: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  amenities: string[];
}

const defaultFormData: LocationFormData = {
  name: '',
  code: '',
  area: 'Katargam',
  city: 'Surat',
  address: '',
  latitude: 21.2330,
  longitude: 72.8335,
  totalFloors: 3,
  contactNumber: '+91 98250 00000',
  operatingHours: '24/7 Open',
  description: '',
  status: 'active',
  amenities: ['CCTV 24/7', 'Covered Parking', '24/7 Security'],
};

const ManageLocations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<ParkingLocationItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [customArea, setCustomArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const [locRes, areaRes] = await Promise.all([
        locationApi.getAll({ all: 'true' }),
        locationApi.getAreas(),
      ]);
      setLocations(locRes.locations || []);
      setAreas(areaRes.areas || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load parking locations';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        !searchQuery ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArea = areaFilter === 'all' || loc.area.toLowerCase() === areaFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [locations, searchQuery, areaFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalHubs = locations.length;
    const activeHubs = locations.filter((l) => l.status === 'active').length;
    const uniqueAreas = new Set(locations.map((l) => l.area)).size;
    const totalSlots = locations.reduce((sum, l) => sum + (l.stats?.totalSlots || 0), 0);
    const availableSlots = locations.reduce((sum, l) => sum + (l.stats?.availableSlots || 0), 0);

    return { totalHubs, activeHubs, uniqueAreas, totalSlots, availableSlots };
  }, [locations]);

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(defaultFormData);
    setCustomArea('');
    setShowModal(true);
  };

  const openEditModal = (loc: ParkingLocationItem) => {
    setIsEditing(true);
    setFormData({
      _id: loc._id,
      name: loc.name,
      code: loc.code || '',
      area: loc.area,
      city: loc.city || 'Surat',
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      totalFloors: loc.totalFloors || 3,
      contactNumber: loc.contactNumber || '',
      operatingHours: loc.operatingHours || '24/7 Open',
      description: loc.description || '',
      status: loc.status,
      amenities: loc.amenities || [],
    });
    setCustomArea('');
    setShowModal(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    toast('Fetching GPS coordinates...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        }));
        toast('GPS coordinates updated!', 'success');
      },
      (err) => {
        toast(`GPS Error: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast('Location Name and Address are required.', 'error');
      return;
    }

    const finalArea = customArea.trim() || formData.area.trim();
    if (!finalArea) {
      toast('Area is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        area: finalArea,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        totalFloors: Number(formData.totalFloors),
      };

      if (isEditing && formData._id) {
        await locationApi.update(formData._id, payload);
        toast(`Location '${formData.name}' updated!`, 'success');
      } else {
        await locationApi.create(payload);
        toast(`Location '${formData.name}' created!`, 'success');
      }
      setShowModal(false);
      fetchLocations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save location';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await locationApi.delete(id);
      toast('Location deleted successfully.', 'success');
      setDeleteConfirmId(null);
      fetchLocations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete location';
      toast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <HiOutlineBuildingStorefront className="w-7 h-7 text-cyan-400" />
              Parking Locations & Malls
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Multi-Area Hubs
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Manage parking locations across Katargam, Varachha, Adajan, Vesu, and Surat city with GPS coordinates.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          <span>Add Parking Location</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Locations</span>
            <HiOutlineBuildingStorefront className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalHubs}</p>
          <p className="text-xs text-emerald-400 mt-1">{stats.activeHubs} Active Facilities</p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Covered Areas</span>
            <HiOutlineMapPin className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.uniqueAreas}</p>
          <p className="text-xs text-gray-400 mt-1">Katargam, Varachha, etc.</p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Slot Capacity</span>
            <HiOutlineRectangleStack className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalSlots}</p>
          <p className="text-xs text-purple-400 mt-1">Across all floors</p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Live Available Slots</span>
            <HiOutlineBolt className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.availableSlots}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.totalSlots > 0 ? Math.round((stats.availableSlots / stats.totalSlots) * 100) : 0}% Free Bays
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl bg-gray-900/40 border border-gray-800/80">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location name, area, or address..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="w-4 h-4 text-gray-400 ml-1" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-900/40 border border-gray-800 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-gray-900/30 border border-gray-800">
          <HiOutlineBuildingStorefront className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No parking locations found</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            {searchQuery || areaFilter !== 'all' || statusFilter !== 'all'
              ? 'Try changing your search or filter options.'
              : 'Add your first parking mall/garage to get started.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-medium"
          >
            Add New Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLocations.map((loc) => {
            const locStats = loc.stats || {
              totalSlots: 0,
              availableSlots: 0,
              carsAvailable: 0,
              bikesAvailable: 0,
              evAvailable: 0,
            };

            return (
              <motion.div
                key={loc._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800 hover:border-gray-700/80 p-5 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {loc.area}
                      </span>
                      {loc.code && (
                        <span className="text-[11px] font-mono text-gray-500">
                          {loc.code}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        loc.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : loc.status === 'maintenance'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {loc.status}
                    </span>
                  </div>

                  {/* Title & Address */}
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5 line-clamp-2">
                    <HiOutlineMapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </p>

                  {/* Coordinates & Hours */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-800/80 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HiOutlineClock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">{loc.operatingHours || '24/7'}</span>
                    </div>
                  </div>

                  {/* Live Slot Capacity Breakdown */}
                  <div className="mt-4 p-3 rounded-xl bg-gray-800/40 border border-gray-750/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-300">Live Availability</span>
                      <span className="text-emerald-400 font-bold">
                        {locStats.availableSlots} / {locStats.totalSlots} Free
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[11px] text-center pt-1">
                      <div className="px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300">
                        🚗 <span className="font-bold">{locStats.carsAvailable}</span> Cars
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        🏍 <span className="font-bold">{locStats.bikesAvailable}</span> Bikes
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        ⚡ <span className="font-bold">{locStats.evAvailable}</span> EV
                      </div>
                    </div>
                  </div>

                  {/* Amenities Chips */}
                  {loc.amenities && loc.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {loc.amenities.slice(0, 3).map((am) => (
                        <span
                          key={am}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-gray-800 text-gray-400 border border-gray-700/50"
                        >
                          {am}
                        </span>
                      ))}
                      {loc.amenities.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-gray-800 text-gray-400">
                          +{loc.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/slots?locationId=${loc._id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 transition-colors"
                      title="Manage Slots in this Mall"
                    >
                      <HiOutlineRectangleStack className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Slots</span>
                    </button>

                    <button
                      onClick={() => navigate(`/admin/layout-designer?locationId=${loc._id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 transition-colors"
                      title="3D Layout Designer"
                    >
                      <HiOutlineCube className="w-3.5 h-3.5 text-purple-400" />
                      <span>3D Map</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(loc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      title="Edit Location"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(loc._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Location"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HiOutlineBuildingStorefront className="w-5 h-5 text-cyan-400" />
                  {isEditing ? 'Edit Parking Location' : 'Add New Parking Location'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLocation} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Location / Mall Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mall A - Katargam Central Mall"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Facility Code (Short ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KAT-MALL-A"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white uppercase focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Area / Zone <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.area}
                      onChange={(e) => {
                        setFormData({ ...formData, area: e.target.value });
                        setCustomArea('');
                      }}
                      className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Katargam">Katargam</option>
                      <option value="Varachha">Varachha</option>
                      <option value="Adajan">Adajan</option>
                      <option value="Vesu">Vesu</option>
                      <option value="Athwa">Athwa</option>
                      <option value="Rander">Rander</option>
                      <option value="Custom">+ Add Custom Area...</option>
                    </select>
                    {formData.area === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Type new area name..."
                        value={customArea}
                        onChange={(e) => setCustomArea(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 bg-gray-800 border border-cyan-500/50 rounded-xl text-sm text-white"
                        required
                      />
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Full Street Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Katargam Main Road, Near GIDC, Katargam, Surat - 395004"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* GPS Coordinates */}
                <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                      <HiOutlineMapPin className="w-4 h-4" />
                      GPS Coordinates (GeoJSON Point for Proximity)
                    </span>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-medium"
                    >
                      📍 Auto-Fill Device GPS
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400">Latitude (North/South)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">Longitude (East/West)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Floors, Contact, Hours & Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300">Total Floors</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.totalFloors}
                      onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationFormData['status'] })}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-gray-300">Operating Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 24/7 Open"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                {/* Amenities Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Select Facility Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const selected = formData.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => handleToggleAmenity(amenity)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                            selected
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <span>{amenity}</span>
                          {selected && <HiOutlineCheck className="w-4 h-4 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-300">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief details about parking layout, security, or landmark instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Location'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Delete Parking Location?</h3>
              <p className="text-sm text-gray-400 mt-2">
                Are you sure you want to delete this parking facility? Any unassigned slots will remain in the database.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteLocation(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageLocations;
