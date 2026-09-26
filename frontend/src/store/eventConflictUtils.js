/**
 * Event Scheduling and Resource Conflict Detection Utilities
 * Protects against venue double-booking, speaker overlap, buffer violations, and capacity issues.
 */

export function hasDateOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return false;
  if (e1 <= s1 || e2 <= s2) return false;

  return s1 < e2 && s2 < e1;
}

export function detectVenueConflict(venueId, newEventStart, newEventEnd, existingBookings = []) {
  if (!venueId || !newEventStart || !newEventEnd) {
    return { hasConflict: false, conflictingBookings: [] };
  }

  const conflicts = (existingBookings || []).filter(booking => {
    if (booking.venueId !== venueId && booking.venue?.id !== venueId) return false;
    if (booking.status === 'cancelled') return false;
    return hasDateOverlap(newEventStart, newEventEnd, booking.startDate || booking.start, booking.endDate || booking.end);
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictCount: conflicts.length,
    conflictingBookings: conflicts
  };
}

export function detectSpeakerConflict(speakerId, sessionStart, sessionEnd, existingSessions = []) {
  if (!speakerId || !sessionStart || !sessionEnd) {
    return { hasConflict: false, conflictingSessions: [] };
  }

  const conflicts = (existingSessions || []).filter(session => {
    const isAssigned = session.speakerId === speakerId ||
      (Array.isArray(session.speakerIds) && session.speakerIds.includes(speakerId));
    if (!isAssigned) return false;
    return hasDateOverlap(sessionStart, sessionEnd, session.startTime || session.start, session.endTime || session.end);
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictCount: conflicts.length,
    conflictingSessions: conflicts
  };
}

export function isCapacityExceeded(attendeeCount, venueCapacity) {
  const count = Number(attendeeCount) || 0;
  const capacity = Number(venueCapacity) || 0;

  if (capacity <= 0) return { exceeded: false, utilization: 0, overflow: 0 };

  const exceeded = count > capacity;
  const overflow = exceeded ? count - capacity : 0;
  const utilization = Math.round((count / capacity) * 10000) / 100;

  return {
    attendeeCount: count,
    venueCapacity: capacity,
    exceeded,
    overflow,
    utilization
  };
}

export function hasBufferViolation(event1End, event2Start, bufferMinutes = 30) {
  const e1 = new Date(event1End).getTime();
  const s2 = new Date(event2Start).getTime();

  if (isNaN(e1) || isNaN(s2)) return false;
  if (s2 < e1) return true; // Direct overlap

  const diffMinutes = (s2 - e1) / (1000 * 60);
  return diffMinutes < bufferMinutes;
}

export function validateEventTimeWindow(startDate, endDate, minMinutes = 30, maxDays = 14) {
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();

  if (isNaN(s) || isNaN(e)) {
    return { valid: false, error: 'Invalid start or end date' };
  }

  if (e <= s) {
    return { valid: false, error: 'End time must be after start time' };
  }

  const durationMinutes = (e - s) / (1000 * 60);
  if (durationMinutes < minMinutes) {
    return { valid: false, error: `Event duration must be at least ${minMinutes} minutes` };
  }

  const durationDays = durationMinutes / (60 * 24);
  if (durationDays > maxDays) {
    return { valid: false, error: `Event duration cannot exceed ${maxDays} days` };
  }

  return { valid: true, durationMinutes, durationDays };
}
