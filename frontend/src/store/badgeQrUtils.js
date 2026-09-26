/**
 * Attendee Badging and QR Security Payload
 */
export function generateBadgePayload(ticketRef, eventId, attendeeId, salt = 'amen_secure') {
  if (!ticketRef || !eventId || !attendeeId) return null;
  const raw = `${ticketRef}:${eventId}:${attendeeId}:${salt}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(16).padStart(8, '0');
  return {
    ticketRef,
    eventId,
    attendeeId,
    checksum,
    qrDataString: `AMEN:${ticketRef}:${checksum}`
  };
}

export function verifyBadgeQr(qrDataString, expectedTicketRef, eventId, attendeeId, salt = 'amen_secure') {
  if (!qrDataString || !qrDataString.startsWith('AMEN:')) return false;
  const expected = generateBadgePayload(expectedTicketRef, eventId, attendeeId, salt);
  if (!expected) return false;
  return qrDataString === expected.qrDataString;
}
