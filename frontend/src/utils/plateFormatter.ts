/**
 * Indian RTO License Plate Auto-Formatter & Validator
 * Format: XX-00-XX-0000 (e.g., GJ-01-AB-1234 or MH-12-C-5678)
 * 
 * Auto-inserts '-' as the user types:
 * 1. State Code: 2 Letters (A-Z)
 * 2. District/RTO Code: 2 Digits (0-9)
 * 3. Series: 1-2 Letters (A-Z)
 * 4. Number: 4 Digits (0-9)
 */

export function formatIndianLicensePlate(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean) return '';

  let state = '';
  let rto = '';
  let series = '';
  let number = '';
  let idx = 0;

  // 1. Extract 2 State letters (A-Z only)
  while (idx < clean.length && state.length < 2) {
    const ch = clean[idx];
    if (/[A-Z]/.test(ch)) {
      state += ch;
    }
    idx++;
  }

  // 2. Extract 2 RTO digits (0-9 only)
  while (idx < clean.length && rto.length < 2) {
    const ch = clean[idx];
    if (/[0-9]/.test(ch)) {
      rto += ch;
    }
    idx++;
  }

  // 3. Extract 1 or 2 Series letters (A-Z only)
  while (idx < clean.length && series.length < 2) {
    const ch = clean[idx];
    if (/[A-Z]/.test(ch)) {
      series += ch;
      idx++;
    } else {
      break; // Transition to number digits
    }
  }

  // 4. Extract 4 Vehicle Number digits (0-9 only)
  while (idx < clean.length && number.length < 4) {
    const ch = clean[idx];
    if (/[0-9]/.test(ch)) {
      number += ch;
    }
    idx++;
  }

  // Assemble formatted string with hyphens
  let formatted = state;

  if (state.length === 2 && (rto.length > 0 || clean.length > 2)) {
    formatted += `-${rto}`;
  } else if (rto.length > 0) {
    formatted += `-${rto}`;
  }

  if (rto.length === 2 && (series.length > 0 || clean.length > 4)) {
    formatted += `-${series}`;
  } else if (series.length > 0) {
    formatted += `-${series}`;
  }

  if (series.length > 0 && (number.length > 0 || clean.length > 6)) {
    formatted += `-${number}`;
  } else if (number.length > 0) {
    formatted += `-${number}`;
  }

  return formatted;
}

export function isValidIndianLicensePlate(plate: string): boolean {
  if (!plate) return false;
  return /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/.test(plate.trim().toUpperCase());
}

/**
 * Helper to handle Backspace keypress smoothly on formatted plate inputs
 */
export function handlePlateKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  onChange: (formatted: string) => void
) {
  if (e.key === 'Backspace') {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    // If cursor is right after a hyphen with no text selected
    if (start !== null && start === end && start > 0) {
      if (currentValue[start - 1] === '-') {
        e.preventDefault();
        // Remove both the hyphen and the preceding character
        const rawClean = currentValue.slice(0, start - 2) + currentValue.slice(start);
        onChange(formatIndianLicensePlate(rawClean));
      }
    }
  }
}
