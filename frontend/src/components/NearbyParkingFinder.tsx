import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlineBuildingStorefront,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import { locationApi } from '../services/api';
import type { ParkingLocationItem, AreaItem, NearbyLocationsResponse } from '../services/api';

interface NearbyParkingFinderProps {
  onSelectLocation?: (location: ParkingLocationItem) => void;
  selectedLocationId?: string;
  className?: string;
}

type VehicleFilterType = 'four-wheeler' | 'two-wheeler' | 'ev' | 'disabled';

export const NearbyParkingFinder: React.FC<NearbyParkingFinderProps> = ({
  onSelectLocation,
  selectedLocationId,
  className = '',
}) => {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchMethod, setSearchMethod] = useState<'gps' | 'area'>('gps');
  const [vehicleType, setVehicleType] = useState<VehicleFilterType>('four-wheeler');
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('Katargam');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(10); // in km

  // Results & GPS state
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyData, setNearbyData] = useState<NearbyLocationsResponse | null>(null);
  const [areaLocations, setAreaLocations] = useState<ParkingLocationItem[]>([]);

  // Fetch Available Areas on Mount
  useEffect(() => {
    locationApi
      .getAreas()
      .then((res) => {
        setAreas(res.areas || []);
        if (res.areas && res.areas.length > 0) {
          setSelectedArea(res.areas[0].name);
        }
      })
      .catch((err) => console.error('Error fetching areas:', err));
  }, []);

  // Request Browser GPS
  const handleUseMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser. Please search your area manually.');
      setSearchMethod('area');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        setGpsLoading(false);
        fetchNearby(coords.latitude, coords.longitude, vehicleType, searchRadius);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access was denied. Search your area manually to find nearby parking.');
        } else if (err.code === err.TIMEOUT) {
          setError('GPS location request timed out. Please retry or search your area manually.');
        } else {
          setError(`Unable to detect location (${err.message}). Please search manually.`);
        }
        setSearchMethod('area');
        // Fetch default area as fallback
        fetchByArea(selectedArea, vehicleType);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Fetch Nearby using coordinates
  const fetchNearby = async (
    lat: number,
    lng: number,
    vType: string = vehicleType,
    radius: number = searchRadius
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await locationApi.getNearby({
        lat,
        lng,
        radius,
        vehicleType: vType,
      });
      setNearbyData(res);
      setAreaLocations([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search nearby parking.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Locations by Selected Area
  const fetchByArea = async (areaName: string, vType: string = vehicleType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await locationApi.getAll({ area: areaName, search: searchKeyword });
      const rawLocs = res.locations || [];

      // Calculate availability for vehicle type
      const mappedLocs = rawLocs.map((loc) => {
        const stats = loc.stats || {
          totalSlots: 0,
          availableSlots: 0,
          carsAvailable: 0,
          bikesAvailable: 0,
          evAvailable: 0,
          disabledAvailable: 0,
        };

        let catAvail = stats.availableSlots;
        if (vType === 'four-wheeler') catAvail = stats.carsAvailable;
        else if (vType === 'two-wheeler') catAvail = stats.bikesAvailable;
        else if (vType === 'ev') catAvail = stats.evAvailable;
        else if (vType === 'disabled') catAvail = stats.disabledAvailable;

        return {
          ...loc,
          categoryAvailable: catAvail,
          isCategoryFull: catAvail === 0,
        };
      });

      setAreaLocations(mappedLocs);
      setNearbyData(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search parking in this area.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial GPS search on mount
  useEffect(() => {
    handleUseMyLocation();
  }, []);

  // When vehicle type changes, refresh
  const handleVehicleChange = (newType: VehicleFilterType) => {
    setVehicleType(newType);
    if (searchMethod === 'gps' && userCoords) {
      fetchNearby(userCoords.latitude, userCoords.longitude, newType, searchRadius);
    } else {
      fetchByArea(selectedArea, newType);
    }
  };

  // When area changes, fetch
  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    setSearchMethod('area');
    fetchByArea(area, vehicleType);
  };

  // Unified list of locations to display
  const displayLocations = useMemo(() => {
    if (searchMethod === 'gps' && nearbyData?.locations) {
      return nearbyData.locations;
    }
    return areaLocations;
  }, [searchMethod, nearbyData, areaLocations]);

  // Open external Google Maps for Turn-by-Turn GPS navigation
  const openDirections = (loc: ParkingLocationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle Select Location / View Parking
  const handleSelect = (loc: ParkingLocationItem) => {
    if (onSelectLocation) {
      onSelectLocation(loc);
    } else {
      navigate(`/book-parking?locationId=${loc._id}`);
    }
  };

  const vehicleTabs: { id: VehicleFilterType; label: string; icon: string }[] = [
    { id: 'four-wheeler', label: 'Cars', icon: '🚗' },
    { id: 'two-wheeler', label: 'Bikes', icon: '🏍' },
    { id: 'ev', label: 'EV Station', icon: '⚡' },
    { id: 'disabled', label: 'Accessible', icon: '♿' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header Banner */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-cyan-950/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 mb-2">
              <HiOutlineMapPin className="w-4 h-4" /> Find Parking Near You
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Smart Proximity <span className="neon-text">Parking Search</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Locate open parking bays with live distance, instant capacity, and smart recommendations.
            </p>
          </div>

          {/* Search Method Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchMethod('gps');
                handleUseMyLocation();
              }}
              disabled={gpsLoading}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                searchMethod === 'gps'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 scale-[1.02]'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {gpsLoading ? (
                <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
              ) : (
                <HiOutlineMapPin className="w-4 h-4 text-cyan-300" />
              )}
              <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Location'}</span>
            </button>

            <button
              onClick={() => {
                setSearchMethod('area');
                fetchByArea(selectedArea, vehicleType);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                searchMethod === 'area'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <HiOutlineFunnel className="w-4 h-4" />
              <span>Search Area</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Vehicle Type Tabs */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-1.5 bg-gray-950/60 p-1.5 rounded-2xl border border-gray-800">
            <span className="text-[11px] font-bold text-gray-400 px-2 uppercase tracking-wider hidden sm:inline">
              Vehicle:
            </span>
            {vehicleTabs.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVehicleChange(v.id)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  vehicleType === v.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* Area Dropdown (Visible in Area mode or secondary) */}
          <div className="md:col-span-3">
            <select
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-950/80 border border-gray-700/80 rounded-xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              {areas.map((a) => (
                <option key={a.name} value={a.name}>
                  📍 {a.name} ({a.count} Hubs)
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-3 relative">
            <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search mall or road..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchMethod === 'gps' && userCoords) {
                    fetchNearby(userCoords.latitude, userCoords.longitude, vehicleType, searchRadius);
                  } else {
                    fetchByArea(selectedArea, vehicleType);
                  }
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-950/80 border border-gray-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Error / Warning Notice */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineExclamationTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleUseMyLocation()}
              className="text-xs underline font-semibold text-red-200 hover:text-white ml-2"
            >
              Retry GPS
            </button>
          </div>
        )}
      </div>

      {/* --- SMART PARKING RECOMMENDATION SECTION --- */}
      {searchMethod === 'gps' && nearbyData && (nearbyData.recommended || nearbyData.nearestFull) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/20 border border-cyan-500/40 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-3">
            <HiOutlineSparkles className="w-4 h-4 animate-pulse" />
            <span>Smart Location-Based Parking Recommendation</span>
          </div>

          {/* Scenario A: Nearest location has available slots */}
          {nearbyData.recommended && !nearbyData.nearestFull && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {nearbyData.recommended.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  📍 <span className="font-semibold text-cyan-300">{nearbyData.recommended.distanceFormatted}</span> away · {nearbyData.recommended.address}
                </p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  ✓ {nearbyData.recommendationReason}
                </p>
                {nearbyData.recommendationHighlights && nearbyData.recommendationHighlights.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-gray-400">
                    {nearbyData.recommendationHighlights.map((h, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-gray-300">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => openDirections(nearbyData.recommended!, e)}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-cyan-400" />
                  <span>Directions</span>
                </button>
                <button
                  onClick={() => handleSelect(nearbyData.recommended!)}
                  className="btn-neon px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/30"
                >
                  <span>Book at {nearbyData.recommended.name.split('-')[0].trim()}</span>
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Scenario B: Nearest location is FULL, showing transparent alternative recommendation */}
          {nearbyData.nearestFull && nearbyData.recommended && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">{nearbyData.nearestFull.name}</span> is closest ({nearbyData.nearestFull.distanceFormatted} away) but <span className="font-bold text-red-400">currently full</span> for your vehicle.
                  </div>
                </div>
                <span className="text-[11px] text-amber-200/80 italic">Avoiding Congestion</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Alternative Best Choice:</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {nearbyData.recommended.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-300">
                    📍 <span className="font-bold text-cyan-300">{nearbyData.recommended.distanceFormatted} away</span> · {nearbyData.recommended.categoryAvailable} slots available
                  </p>
                  <p className="text-xs text-cyan-300 font-medium">{nearbyData.recommendationReason}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => openDirections(nearbyData.recommended!, e)}
                    className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 flex items-center gap-1.5"
                  >
                    <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-cyan-400" />
                    <span>Directions</span>
                  </button>
                  <button
                    onClick={() => handleSelect(nearbyData.recommended!)}
                    className="btn-neon px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  >
                    <span>View Parking</span>
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* --- ALL LOCATIONS / MALLS LIST --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <HiOutlineBuildingStorefront className="w-5 h-5 text-cyan-400" />
            {searchMethod === 'gps' ? 'Nearby Parking Locations' : `Parking Facilities in ${selectedArea}`}
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {displayLocations.length} Facilities Found
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-3xl bg-gray-900/50 border border-gray-800 animate-pulse p-6" />
            ))}
          </div>
        ) : displayLocations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass border border-gray-800">
            <HiOutlineBuildingStorefront className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No parking facilities found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchMethod === 'gps'
                ? 'No parking locations detected within search radius. Try searching by Area above.'
                : `No facilities registered under ${selectedArea}. Check another area.`}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {areas.map((a) => (
                <button
                  key={a.name}
                  onClick={() => handleAreaChange(a.name)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300"
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayLocations.map((loc) => {
              const stats = loc.stats || {
                totalSlots: 0,
                availableSlots: 0,
                carsAvailable: 0,
                bikesAvailable: 0,
                evAvailable: 0,
              };

              const isSelected = selectedLocationId === loc._id;
              const isFull = loc.isCategoryFull || (stats.totalSlots > 0 && stats.availableSlots === 0);

              return (
                <motion.div
                  key={loc._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleSelect(loc)}
                  className={`group relative rounded-3xl p-5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-2 border-cyan-400 shadow-xl shadow-cyan-500/20'
                      : 'glass-card hover:border-cyan-500/50 hover:shadow-xl'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {loc.area}
                      </span>

                      {loc.distanceFormatted ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                          📍 {loc.distanceFormatted} away
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">
                          {loc.city || 'Surat'}
                        </span>
                      )}
                    </div>

                    {/* Facility Name & Address */}
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {loc.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {loc.address}
                    </p>

                    {/* Live Category Counts Breakdown */}
                    <div className="mt-4 p-3 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-semibold">Live Availability:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            isFull
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : stats.availableSlots < 5
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isFull ? 'Currently Full' : `${stats.availableSlots} Bays Free`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] pt-1 font-medium">
                        <div
                          className={`p-1.5 rounded-xl border ${
                            vehicleType === 'four-wheeler'
                              ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          🚗 <span className="font-bold text-white">{stats.carsAvailable}</span> Cars
                        </div>
                        <div
                          className={`p-1.5 rounded-xl border ${
                            vehicleType === 'two-wheeler'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          🏍 <span className="font-bold text-white">{stats.bikesAvailable}</span> Bikes
                        </div>
                        <div
                          className={`p-1.5 rounded-xl border ${
                            vehicleType === 'ev'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          ⚡ <span className="font-bold text-white">{stats.evAvailable}</span> EV
                        </div>
                      </div>
                    </div>

                    {/* Amenities Chips */}
                    {loc.amenities && loc.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {loc.amenities.slice(0, 3).map((am) => (
                          <span
                            key={am}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-gray-800/80 text-gray-400 border border-gray-750"
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

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => openDirections(loc, e)}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-colors"
                      title="Open GPS Directions in Google Maps"
                    >
                      <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Directions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className="btn-neon px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                    >
                      <span>View Parking</span>
                      <HiOutlineArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyParkingFinder;
