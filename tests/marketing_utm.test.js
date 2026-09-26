import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCampaignUrl, parseUtmParameters } from '../frontend/src/store/marketingUtmUtils.js';

describe('Marketing Campaign Tracking Suite', () => {
  it('builds valid UTM URL', () => {
    const url = buildCampaignUrl('https://amen.et', 'gala2026', 'linkedin', 'cpc');
    assert.ok(url.includes('utm_campaign=gala2026'));
  });
  it('parses UTM parameters from URL', () => {
    const utms = parseUtmParameters('https://amen.et?utm_campaign=launch&utm_source=meta');
    assert.equal(utms.campaign, 'launch');
    assert.equal(utms.source, 'meta');
  });
});