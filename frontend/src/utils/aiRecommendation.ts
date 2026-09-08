export interface SlotForAI {
  id: string;
  number: string;
  category: string;
  status: string;
  floor: number;
  x: number;
  z: number;
  pricePerHour?: number;
}

export interface AIRecommendationResult {
  recommendedSlotId: string | null;
  recommendedSlotNumber: string | null;
  score: number;
  reasons: string[];
}

export const getAISmartSlotRecommendation = (
  slots: SlotForAI[],
  userVehicleType: string = 'four-wheeler',
  options: {
    requiresEV?: boolean;
    requiresDisabled?: boolean;
    requiresVIP?: boolean;
  } = {}
): AIRecommendationResult => {
  const availableSlots = slots.filter((s) => s.status === 'available');

  if (availableSlots.length === 0) {
    return {
      recommendedSlotId: null,
      recommendedSlotNumber: null,
      score: 0,
      reasons: ['No slots available currently.'],
    };
  }

  let bestSlot: SlotForAI | null = null;
  let bestScore = -9999;
  let bestReasons: string[] = [];

  // Entrance is at X = -12, Z = 0
  const ENTRANCE_X = -12;
  const ENTRANCE_Z = 0;

  availableSlots.forEach((slot) => {
    let score = 100;
    const reasons: string[] = [];

    // Distance calculation to entrance
    const dist = Math.sqrt(Math.pow(slot.x - ENTRANCE_X, 2) + Math.pow(slot.z - ENTRANCE_Z, 2));
    const distScore = Math.max(0, 50 - dist * 2);
    score += distScore;

    if (dist < 10) {
      reasons.push('⚡ Closest to entrance gate');
    } else {
      reasons.push('🏃 Minimal walking distance');
    }

    // Category matching logic
    if (options.requiresEV || userVehicleType === 'ev') {
      if (slot.category === 'ev') {
        score += 80;
        reasons.push('🔌 Equipped with 50kW EV Fast Charger');
      } else {
        score -= 40;
      }
    } else if (options.requiresVIP || userVehicleType === 'vip') {
      if (slot.category === 'vip') {
        score += 80;
        reasons.push('👑 VIP Covered Executive Bay');
      }
    } else if (options.requiresDisabled || userVehicleType === 'disabled') {
      if (slot.category === 'disabled') {
        score += 80;
        reasons.push('♿ Accessible Bay near Ramp & Elevator');
      }
    } else if (slot.category === userVehicleType) {
      score += 40;
      reasons.push(`🚗 Perfectly suitable for your ${userVehicleType}`);
    }

    // Floor Preference (Ground Floor preferred)
    if (slot.floor === 1) {
      score += 20;
      reasons.push('🏢 Ground Floor (Direct Street Access)');
    }

    if (score > bestScore) {
      bestScore = score;
      bestSlot = slot;
      bestReasons = reasons;
    }
  });

  const finalSlot = bestSlot as SlotForAI | null;

  return {
    recommendedSlotId: finalSlot ? finalSlot.id : null,
    recommendedSlotNumber: finalSlot ? finalSlot.number : null,
    score: Math.min(99, Math.round(bestScore / 2)),
    reasons: bestReasons,
  };
};
