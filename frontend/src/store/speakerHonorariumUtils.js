export function calculateSpeakerPayout(honorarium, perDiem, days, travelReimbursement = 0) {
  const h = Math.max(0, Number(honorarium) || 0);
  const p = Math.max(0, Number(perDiem) || 0);
  const d = Math.max(1, Number(days) || 1);
  const t = Math.max(0, Number(travelReimbursement) || 0);
  const perDiemTotal = Math.round(p * d * 100) / 100;
  return { honorarium: h, perDiemTotal, travelReimbursement: t, grandTotal: Math.round((h + perDiemTotal + t) * 100) / 100 };
}