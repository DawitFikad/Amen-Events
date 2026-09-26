export function buildCampaignUrl(baseUrl, campaign, source, medium) {
  if (!baseUrl) return '';
  const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
  if (campaign) url.searchParams.set('utm_campaign', campaign);
  if (source) url.searchParams.set('utm_source', source);
  if (medium) url.searchParams.set('utm_medium', medium);
  return url.toString();
}
export function parseUtmParameters(urlString) {
  try {
    const url = new URL(urlString);
    return {
      campaign: url.searchParams.get('utm_campaign') || null,
      source: url.searchParams.get('utm_source') || null,
      medium: url.searchParams.get('utm_medium') || null
    };
  } catch { return { campaign: null, source: null, medium: null }; }
}