import React, { useState, useEffect, useMemo } from 'react';
import CapabilityMultiSelect from './CapabilityMultiSelect.jsx';
import { MapPin, Calendar, Weight, ArrowRight, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export default function LoadSearchForm({
  lanes = [],
  capabilities = [],
  onSubmit,
  isLoading = false,
  initialValues = null,
}) {
  // Extract unique origins and destinations
  const origins = useMemo(() => {
    const set = new Set(lanes.map((l) => l.origin_city));
    return Array.from(set).sort();
  }, [lanes]);

  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedLaneId, setSelectedLaneId] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [weightKg, setWeightKg] = useState('18000');
  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize defaults once lanes load
  useEffect(() => {
    if (lanes.length > 0 && !selectedLaneId) {
      const firstLane = lanes[0];
      setSelectedLaneId(String(firstLane.lane_id));
      setSelectedOrigin(firstLane.origin_city);
      setSelectedDestination(firstLane.destination_city);
    }
  }, [lanes, selectedLaneId]);

  // Set default dates if empty: tomorrow and day after
  useEffect(() => {
    if (!pickupDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const toISO = (d) => d.toISOString().slice(0, 10);
      setPickupDate(toISO(tomorrow));
      setDeliveryDate(toISO(dayAfter));
    }
  }, [pickupDate]);

  // Default equipment selection: 32FT container + waterproof
  useEffect(() => {
    if (capabilities.length > 0 && selectedCapabilityIds.length === 0) {
      const defaultCapNames = ['32FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'];
      const defaultIds = capabilities
        .filter((c) => defaultCapNames.includes(c.name))
        .map((c) => Number(c.capability_id));
      if (defaultIds.length > 0) {
        setSelectedCapabilityIds(defaultIds);
      }
    }
  }, [capabilities, selectedCapabilityIds.length]);

  // Available destinations for selected origin
  const availableDestinations = useMemo(() => {
    if (!selectedOrigin) return [];
    return lanes
      .filter((l) => l.origin_city === selectedOrigin)
      .map((l) => ({
        city: l.destination_city,
        distance: l.distance_km,
        laneId: l.lane_id,
      }));
  }, [lanes, selectedOrigin]);

  const handleOriginChange = (orig) => {
    setSelectedOrigin(orig);
    const validDests = lanes.filter((l) => l.origin_city === orig);
    if (validDests.length > 0) {
      setSelectedDestination(validDests[0].destination_city);
      setSelectedLaneId(String(validDests[0].lane_id));
    } else {
      setSelectedDestination('');
      setSelectedLaneId('');
    }
  };

  const handleDestinationChange = (dest) => {
    setSelectedDestination(dest);
    const lane = lanes.find((l) => l.origin_city === selectedOrigin && l.destination_city === dest);
    if (lane) {
      setSelectedLaneId(String(lane.lane_id));
    }
  };

  // Presets
  const loadPreset = (presetType) => {
    if (presetType === 'general-32ft') {
      const ids = capabilities
        .filter((c) => ['32FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'].includes(c.name))
        .map((c) => Number(c.capability_id));
      setSelectedCapabilityIds(ids);
      setWeightKg('18000');
    } else if (presetType === 'cold-chain') {
      const ids = capabilities
        .filter((c) => ['32FT', 'CONTAINER', 'WATERPROOF', 'REFRIGERATED', 'PERISHABLE'].includes(c.name))
        .map((c) => Number(c.capability_id));
      setSelectedCapabilityIds(ids);
      setWeightKg('20000');
    } else if (presetType === 'heavy-flatbed') {
      const ids = capabilities
        .filter((c) => ['32FT', 'OPEN_BODY', 'GENERAL'].includes(c.name))
        .map((c) => Number(c.capability_id));
      setSelectedCapabilityIds(ids);
      setWeightKg('24000');
    } else if (presetType === 'light-20ft') {
      const ids = capabilities
        .filter((c) => ['20FT', 'CONTAINER', 'WATERPROOF', 'GENERAL'].includes(c.name))
        .map((c) => Number(c.capability_id));
      setSelectedCapabilityIds(ids);
      setWeightKg('9000');
    }
  };

  const validate = () => {
    const errors = {};
    if (!selectedLaneId) {
      errors.lane = 'Please select a valid freight corridor.';
    }
    if (!pickupDate) {
      errors.pickupDate = 'Pickup date is required.';
    }
    if (!deliveryDate) {
      errors.deliveryDate = 'Delivery date is required.';
    }
    if (pickupDate && deliveryDate && deliveryDate < pickupDate) {
      errors.deliveryDate = 'Delivery date cannot precede pickup date.';
    }
    const weightNum = Number(weightKg);
    if (!weightKg || isNaN(weightNum) || weightNum <= 0) {
      errors.weightKg = 'Weight must be a positive integer in kilograms.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      laneId: Number(selectedLaneId),
      pickupDate,
      deliveryDate,
      weightKg: Number(weightKg),
      capabilityIds: selectedCapabilityIds,
    });
  };

  const selectedLane = lanes.find((l) => String(l.lane_id) === String(selectedLaneId));

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8 bg-white">
      {/* Route Corridor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#10183D] uppercase tracking-wider">
            1. Freight Corridor
          </label>
          {selectedLane && (
            <span className="text-xs text-[#2764D9] font-bold bg-[#EAF7FC] px-3 py-1 rounded-full border border-[#2764D9]/20 font-mono">
              Distance: {selectedLane.distance_km} km
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Origin City</span>
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => handleOriginChange(e.target.value)}
              disabled={isLoading || lanes.length === 0}
              className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#10183D] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9] transition-all cursor-pointer"
            >
              {origins.map((orig) => (
                <option key={orig} value={orig}>
                  {orig}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
              <span>Destination City</span>
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              disabled={isLoading || availableDestinations.length === 0}
              className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#10183D] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9] transition-all cursor-pointer"
            >
              {availableDestinations.map((d) => (
                <option key={d.city} value={d.city}>
                  {d.city} ({d.distance} km)
                </option>
              ))}
            </select>
          </div>
        </div>
        {validationErrors.lane && (
          <p className="text-xs text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{validationErrors.lane}</span>
          </p>
        )}
      </div>

      {/* Dates & Weight */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <label className="block text-xs font-bold text-[#10183D] uppercase tracking-wider">
          2. Schedule & Cargo Specifications
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pickup Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Pickup Date</span>
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              disabled={isLoading}
              className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#10183D] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9] transition-all"
            />
            {validationErrors.pickupDate && (
              <p className="text-xs text-red-600">{validationErrors.pickupDate}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Delivery Date</span>
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={isLoading}
              className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#10183D] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9] transition-all"
            />
            {validationErrors.deliveryDate && (
              <p className="text-xs text-red-600">{validationErrors.deliveryDate}</p>
            )}
          </div>

          {/* Cargo Weight */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Weight className="w-3.5 h-3.5 text-slate-400" />
              <span>Cargo Weight (kg)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="50000"
                step="500"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                disabled={isLoading}
                placeholder="18000"
                className="w-full h-12 px-4 pr-12 text-sm bg-slate-50 border border-slate-300 rounded-xl text-[#10183D] font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9] transition-all"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-400 font-bold">kg</span>
            </div>
            {validationErrors.weightKg && (
              <p className="text-xs text-red-600">{validationErrors.weightKg}</p>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Presets & MultiSelect */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-bold text-[#10183D] uppercase tracking-wider">
            3. Required Vehicle Capabilities
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset('general-32ft')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-[#10183D] hover:bg-slate-200 font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
              32FT Container
            </button>
            <button
              type="button"
              onClick={() => loadPreset('cold-chain')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#EAF7FC] text-[#2764D9] hover:bg-[#D5EBF5] font-semibold border border-[#2764D9]/20 cursor-pointer transition-colors"
            >
              Cold Chain Reefer
            </button>
            <button
              type="button"
              onClick={() => loadPreset('heavy-flatbed')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-[#10183D] hover:bg-slate-200 font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
              Heavy Flatbed
            </button>
            <button
              type="button"
              onClick={() => loadPreset('light-20ft')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-[#10183D] hover:bg-slate-200 font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
              20FT Light Haul
            </button>
          </div>
        </div>

        <CapabilityMultiSelect
          capabilities={capabilities}
          selectedIds={selectedCapabilityIds}
          onChange={setSelectedCapabilityIds}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading || lanes.length === 0}
          className={`w-full h-14 rounded-xl font-black text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
            isLoading
              ? 'bg-[#2764D9]/75 cursor-wait'
              : 'bg-[#2764D9] hover:bg-[#1E52B7] active:scale-[0.99] hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Calculating Instant Contractual Quotes...</span>
            </>
          ) : (
            <>
              <span>Find Eligible Trucks & Compare Quotes</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
