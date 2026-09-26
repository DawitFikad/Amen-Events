/**
 * Sponsorship Tier Benefits and Fulfillment Engine
 */
export const SPONSOR_TIERS = {
  TITLE: 'Title Partner',
  PLATINUM: 'Platinum Sponsor',
  GOLD: 'Gold Sponsor',
  SILVER: 'Silver Sponsor'
};

export function getTierDeliverables(tier) {
  const t = (tier || '').toLowerCase();
  if (t.includes('title')) return ['Main Stage Keynote', 'Logo on All Badges', 'VIP Dinner Table', 'Prime Expo Booth'];
  if (t.includes('platinum')) return ['Keynote Panel', 'Logo on Website', 'VIP Passes (x5)', 'Expo Booth'];
  if (t.includes('gold')) return ['Logo on Screen', 'VIP Passes (x2)', 'Expo Booth'];
  return ['Logo on Website', 'General Passes (x2)'];
}

export function calculateFulfillmentProgress(deliverables = []) {
  if (!Array.isArray(deliverables) || deliverables.length === 0) return 0;
  const completed = deliverables.filter(d => d.completed).length;
  return Math.round((completed / deliverables.length) * 100);
}
