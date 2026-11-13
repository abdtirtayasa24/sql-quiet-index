import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { loadBaseData } from '../fixtures/base-data';
import { generateDataset } from '../../src/content/dataset';
import { BASE_COLUMNS } from '../../src/content/validate-content';

let pg: PGlite;
beforeAll(async () => {
  pg = await PGlite.create({ dataDir: 'memory://' });
}, 60000);
afterAll(async () => {
  await pg?.close();
});

it.each(
  ['00000001', '00000002', '00000003', '00000004', '00000005'].flatMap((seed) =>
    ['003', '015', '023'].map((missionId) => ({ seed, missionId })),
  ),
)(
  'loads constrained, relational PG18 data with coherent proof sources on $seed / $missionId',
  async ({ seed, missionId }) => {
    const { identities, counts } = await loadBaseData(pg, seed, missionId);
    expect(Object.keys(counts)).toHaveLength(12);
    for (const [table, count] of Object.entries(counts)) {
      const result = await pg.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table}`,
      );
      expect(result.rows[0]?.n).toBe(count);
    }
    const anomalies = await pg.query<{ n: number }>(`
      SELECT count(*)::int AS n FROM dispatch_orders d
      JOIN delivery_signatures s ON s.order_id=d.order_id
      WHERE s.signed_at < d.requested_at OR d.released_at < d.requested_at`);
    expect(anomalies.rows[0]?.n).toBe(0);
    const absent = await pg.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM badge_scans WHERE staff_id=$1',
      [identities.staff.guard],
    );
    expect(absent.rows[0]?.n).toBe(0);
    const courier = await pg.query<{ staff_id: number }>(
      'SELECT staff_id FROM delivery_signatures WHERE order_id=1',
    );
    expect(courier.rows[0]?.staff_id).toBe(identities.staff.courier);
    const vehicle = await pg.query<{ vehicle_id: number; event_at: string }>(
      'SELECT vehicle_id,event_at::text FROM gate_events WHERE event_id=1',
    );
    expect(vehicle.rows[0]?.vehicle_id).toBe(identities.vehicleId);
    expect(new Date(String(vehicle.rows[0]?.event_at)).toISOString()).toBe(
      identities.eventAt,
    );
    for (const sql of [
      'SELECT 1 FROM staff GROUP BY full_name HAVING count(*)>1',
      'SELECT 1 FROM badge_scans GROUP BY badge_code HAVING count(*)>1',
      'SELECT 1 FROM harbor_shipments WHERE received_at IS NULL',
      'SELECT 1 FROM harbor_shipments WHERE received_at IS NOT NULL',
      'SELECT 1 FROM payroll_entries WHERE correction_note IS NULL',
      'SELECT 1 FROM payroll_entries WHERE correction_note IS NOT NULL',
      "SELECT 1 FROM incident_reports WHERE neighborhood='North Quay' AND status='closed'",
      'SELECT 1 FROM staff a JOIN staff b ON a.supervisor_id=b.supervisor_id AND a.staff_id<b.staff_id',
    ])
      expect((await pg.query(sql)).rows.length).toBeGreaterThan(0);
    await expect(
      pg.query(
        "INSERT INTO shift_roster VALUES(99999,$1,'2028-11-04','2028-11-04 02:00Z','2028-11-04 01:00Z','decoy')",
        [identities.staff.guard],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pg.query(
        "INSERT INTO badge_scans VALUES(99999,999999,'bad','gate','2028-11-04Z','granted')",
      ),
    ).rejects.toMatchObject({ code: '23503' });
    expect(
      (
        await pg.query(
          "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
        )
      ).rows,
    ).toHaveLength(12);
  },
  60000,
);
it('retains actual shared rows across replay/mission/variant and matches the documented visible catalog', async () => {
  const core = async () => {
    const result: unknown[] = [];
    for (const sql of [
      'SELECT * FROM staff ORDER BY staff_id',
      'SELECT * FROM gate_events WHERE event_id=1',
      'SELECT * FROM cctv_observations WHERE observation_id=1',
      'SELECT * FROM delivery_signatures WHERE signature_id=1',
    ])
      result.push((await pg.query(sql)).rows);
    return result;
  };
  await loadBaseData(pg, '00000001');
  const before = await core();
  await loadBaseData(pg, '00000001', '023', 2);
  expect(await core()).toEqual(before);
  for (const [table, columns] of Object.entries(BASE_COLUMNS)) {
    const actual = await pg.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
      [table],
    );
    expect(actual.rows.map((r) => r.column_name)).toEqual(columns);
  }
  expect(
    (
      await pg.query(
        'SELECT 1 FROM delivery_signatures s JOIN gate_events g ON g.event_id=1 WHERE s.signature_id=1 AND s.signed_at>=g.event_at',
      )
    ).rows,
  ).toHaveLength(1);
}, 60000);
it('reproduces exact parameter streams, varies only local decoys, and bounds every table', () => {
  const input = {
    contentVersion: '2026.10.1',
    campaignSeed: '00000001',
    caseId: 'act03',
    missionId: '017',
    variant: 0,
  };
  const a = generateDataset(input);
  expect(generateDataset(input)).toEqual(a);
  const b = generateDataset({ ...input, missionId: '023', variant: 2 });
  expect(b.identities).toEqual(a.identities);
  expect(b.inserts).not.toEqual(a.inserts);
  const budgets: Record<string, [number, number]> = {
    staff: [50, 120],
    incident_reports: [300, 700],
    harbor_shipments: [600, 1500],
    dispatch_orders: [700, 1800],
    badge_scans: [2000, 5000],
    shift_roster: [400, 1100],
    payroll_entries: [600, 1200],
    vehicle_registry: [100, 1000],
    vehicle_assignments: [100, 1000],
    gate_events: [100, 1000],
    cctv_observations: [100, 1000],
    delivery_signatures: [100, 1000],
  };
  for (const [table, count] of Object.entries(a.counts)) {
    expect(count).toBeGreaterThanOrEqual(budgets[table]![0]);
    expect(count).toBeLessThanOrEqual(budgets[table]![1]);
  }
  expect(
    a.inserts.every(
      (s) => s.sql.includes('$1') && !s.sql.includes('North Quay'),
    ),
  ).toBe(true);
  expect(() =>
    generateDataset({ ...input, campaignSeed: "';DROP TABLE staff" }),
  ).toThrow();
  expect(() => generateDataset({ ...input, missionId: '003' })).toThrow();
  expect(() =>
    generateDataset({ ...input, missionId: '025', caseId: 'act04' }),
  ).toThrow();
});
