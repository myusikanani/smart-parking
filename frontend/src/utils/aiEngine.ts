export interface SlotScore {
  slotId: string;
  number: string;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface UserPreferences {
  preferredFloor?: number;
  preferredZone?: string;
  hasEV?: boolean;
  isVIP?: boolean;
  needsDisabledAccess?: boolean;
  arrivalTime?: string;
  expectedDuration?: number;
  pastSlotIds?: string[];
}

export interface ParkingContext {
  availableSlots: { id: string; number: string; floor: number; x: number; z: number; zone?: string }[];
  totalSlots: number;
  occupiedCount: number;
  timeOfDay: number;
  dayOfWeek: number;
  recentBookings: { slotId: string; duration: number; timestamp: number }[];
  currentOccupancy: Record<string, number>;
}

function distanceToEntrance(x: number, z: number): number {
  return Math.sqrt(x * x + (z + 5.5) * (z + 5.5));
}

function distanceToExit(x: number, z: number): number {
  return Math.sqrt(x * x + (z - 7.5) * (z - 7.5));
}

export function calculateSlotScores(
  slots: ParkingContext['availableSlots'],
  context: ParkingContext,
  preferences?: UserPreferences
): SlotScore[] {
  const peakHour = context.timeOfDay >= 8 && context.timeOfDay <= 18;
  const occupancyRate = context.occupiedCount / context.totalSlots;

  return slots.map((slot) => {
    let score = 50;
    const reasons: string[] = [];
    const distToEntrance = distanceToEntrance(slot.x, slot.z);
    const distToExit = distanceToExit(slot.x, slot.z);

    if (distToEntrance < 4) {
      score += 20;
      reasons.push('Near entrance');
    } else if (distToEntrance < 8) {
      score += 10;
      reasons.push('Moderate distance to entrance');
    }

    if (distToExit < 4) {
      score += 10;
      reasons.push('Near exit');
    }

    if (slot.floor === 1) {
      score += 15;
      reasons.push('Ground floor');
    } else if (slot.floor === 2) {
      score += 5;
      reasons.push('First upper floor');
    }

    if (preferences?.preferredFloor === slot.floor) {
      score += 10;
      reasons.push('Matches your preferred floor');
    }

    if (preferences?.preferredZone && slot.zone === preferences.preferredZone) {
      score += 10;
      reasons.push('In your preferred zone');
    }

    if (peakHour) {
      score += 10;
      reasons.push('Peak hour — reserved nearby');
    }

    if (occupancyRate > 0.8) {
      score += occupancyRate * 10;
      reasons.push('High demand period');
    }

    if (context.recentBookings.filter((b) => b.slotId === slot.id).length > 0) {
      score -= 15;
      reasons.push('Freed recently — may be contested');
    }

    if (peakHour && slot.floor === 1 && distToEntrance < 6) {
      score += 15;
      reasons.push('Prime spot for peak hours');
    }

    if (context.timeOfDay >= 22 || context.timeOfDay <= 6) {
      score += 10;
      reasons.push('Low traffic — premium spot available');
    }

    score = Math.min(100, Math.max(0, score));

    const noise = (Math.random() - 0.5) * 6;
    const finalScore = Math.min(100, Math.max(0, score + noise));

    const confidenceBase = 0.7 + (occupancyRate < 0.9 ? 0.2 : 0);
    const confidencePeak = peakHour ? 0.05 : 0;
    const confidenceHistory = context.recentBookings.length > 10 ? 0.05 : 0;
    const confidence = Math.min(1, confidenceBase - confidencePeak + confidenceHistory);

    return {
      slotId: slot.id,
      number: slot.number,
      score: Math.round(finalScore),
      reasons,
      confidence: Math.round(confidence * 100) / 100,
    };
  }).sort((a, b) => b.score - a.score);
}

export function predictOccupancy(
  historicalData: { hour: number; occupancy: number }[]
): { hour: number; predicted: number }[] {
  const upcomingHours = [];
  const now = new Date().getHours();
  const overallAvg = historicalData.length > 0
    ? historicalData.reduce((s, e) => s + e.occupancy, 0) / historicalData.length
    : 0;
  const recentEntries = historicalData.slice(-3);
  const recentAvg = recentEntries.length > 0
    ? recentEntries.reduce((s, e) => s + e.occupancy, 0) / recentEntries.length
    : overallAvg;
  const trend = recentAvg > overallAvg ? 0.1 : recentAvg < overallAvg ? -0.1 : 0;

  for (let h = 0; h < 24; h++) {
    const hour = (now + h) % 24;
    const entries = historicalData.filter((d) => d.hour === hour);
    const avg = entries.length > 0
      ? entries.reduce((s, e) => s + e.occupancy, 0) / entries.length
      : 0;
    const predicted = Math.min(1, avg + (h < 4 ? trend : 0));
    upcomingHours.push({ hour, predicted: Math.round(predicted * 100) });
  }

  return upcomingHours;
}

export function estimateWaitTime(
  occupancy: number,
  _totalWorkers: number = 2
): number {
  if (occupancy < 0.5) return Math.round(Math.random() * 3);
  if (occupancy < 0.8) return Math.round(3 + Math.random() * 5);
  return Math.round(8 + Math.random() * 7);
}

export function getPeakHours(
  bookings: { hour: number; count: number }[]
): { hour: number; count: number; isPeak: boolean }[] {
  const maxCount = Math.max(...bookings.map((b) => b.count), 1);
  const threshold = maxCount * 0.7;
  return bookings.map((b) => ({
    hour: b.hour,
    count: b.count,
    isPeak: b.count >= threshold,
  }));
}
