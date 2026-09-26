export function calculateNps(ratings = []) {
  if (!Array.isArray(ratings) || ratings.length === 0) return { nps: 0, promoters: 0, detractors: 0, passives: 0 };
  let p = 0, d = 0, pas = 0;
  ratings.forEach(r => {
    const val = Number(r);
    if (val >= 9) p++;
    else if (val <= 6) d++;
    else pas++;
  });
  const total = ratings.length;
  const nps = Math.round(((p - d) / total) * 100);
  return { nps, promoters: p, detractors: d, passives: pas, totalResponses: total };
}