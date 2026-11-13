import { assertCampaignSeed, hashSeed, mulberry32 } from './seed.ts';

export function caseIdentities(
  contentVersion: string,
  campaignSeed: string,
  caseId: string,
) {
  assertCampaignSeed(campaignSeed);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,39}$/.test(contentVersion))
    throw new Error('Invalid content version');
  if (!/^act(0[1-9]|10)$/.test(caseId)) throw new Error('Invalid case ID');
  const rng = mulberry32(
    hashSeed(`${contentVersion}:${campaignSeed}:${caseId}`),
  );
  // Start with sorted IDs; sampling without replacement preserves distinct roles.
  const ids = Array.from({ length: 60 }, (_, i) => i + 1);
  const take = () => ids.splice(Math.floor(rng() * ids.length), 1)[0]!;
  return {
    staff: {
      supervisor: take(),
      guard: take(),
      courier: take(),
      clerk: take(),
      colleague: take(),
    },
    vehicleId: 1 + Math.floor(rng() * 100),
    eventAt: new Date(
      Date.UTC(2028, 10, 4, 0, 40 + Math.floor(rng() * 15)),
    ).toISOString(),
  };
}
