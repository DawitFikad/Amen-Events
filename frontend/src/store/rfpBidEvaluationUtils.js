export function rankVendorBids(bids = []) {
  if (!Array.isArray(bids)) return [];
  return [...bids].map(b => {
    const costScore = Math.max(0, 100 - ((Number(b.price) || 0) / 1000));
    const technicalScore = Number(b.technicalRating) || 0;
    const finalScore = Math.round((costScore * 0.4 + technicalScore * 0.6) * 100) / 100;
    return { ...b, compositeScore: finalScore };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}