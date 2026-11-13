export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assertCampaignSeed(seed: string): void {
  if (!/^[0-9a-f]{8,16}$/.test(seed)) throw new Error('Invalid campaign seed');
}

export function missionRng(
  campaignSeed: string,
  missionId: string,
  variant = 0,
): () => number {
  assertCampaignSeed(campaignSeed);
  if (!/^(00[1-9]|0[1-7][0-9]|080)$/.test(missionId))
    throw new Error('Invalid mission ID');
  if (!Number.isSafeInteger(variant) || variant < 0)
    throw new Error('Invalid variant');
  return mulberry32(hashSeed(`${campaignSeed}:${missionId}:${variant}`));
}
