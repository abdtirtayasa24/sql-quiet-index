import { caseIdentities } from './case-identities.ts';
import { missionRng } from './seed.ts';

type Cell = string | number | boolean | null;
export interface DatasetInput {
  contentVersion: string;
  campaignSeed: string;
  caseId: string;
  missionId: string;
  variant: number;
}

export function generateDataset(input: DatasetInput) {
  const { contentVersion, campaignSeed, caseId, missionId, variant } = input;
  const identities = caseIdentities(contentVersion, campaignSeed, caseId);
  const rng = missionRng(campaignSeed, missionId, variant);
  if (
    Number(missionId) > 24 ||
    caseId !== `act${String(Math.ceil(Number(missionId) / 8)).padStart(2, '0')}`
  )
    throw new Error('MVP dataset requires a matching act01–act03 mission');
  const { staff: roles, vehicleId, eventAt } = identities;
  const inserts: { sql: string; params: Cell[] }[] = [];
  const counts: Record<string, number> = {};
  // Identifiers are constants at each call site, never content/player input.
  const add = (table: string, rows: Cell[][]) => {
    counts[table] = rows.length;
    for (let start = 0; start < rows.length; start += 100) {
      const params: Cell[] = [];
      const values = rows.slice(start, start + 100).map(
        (row) =>
          `(${row
            .map((value) => {
              params.push(value);
              return `$${params.length}`;
            })
            .join(',')})`,
      );
      inserts.push({
        sql: `INSERT INTO ${table} VALUES ${values.join(',')}`,
        params,
      });
    }
  };
  const rows = (n: number, make: (id: number) => Cell[]) =>
    Array.from({ length: n }, (_, i) => make(i + 1));
  const time = (minutes: number) =>
    new Date(Date.UTC(2028, 10, 4, 0, minutes)).toISOString();
  const person = (id: number) => ((id - 1) % 60) + 1;
  const money = () => (10000 + Math.floor(rng() * 90000)) / 100;
  const names = [
    'Ari Fen',
    'Em Vale',
    'Jo Ren',
    'Lian Moss',
    'Noor Lake',
    'Sam Reed',
  ];
  // Supervisor must be inserted before the references to it.
  const staffIds = [
    roles.supervisor,
    ...Array.from({ length: 60 }, (_, i) => i + 1).filter(
      (id) => id !== roles.supervisor,
    ),
  ];
  add(
    'staff',
    staffIds.map((id) => [
      id,
      names[(id - 1) % names.length]!,
      id === roles.guard ? 'Remote Records' : 'Harbor Office',
      id === roles.supervisor ? null : roles.supervisor,
      true,
    ]),
  );
  add(
    'incident_reports',
    rows(300, (id) => [
      id,
      id % 3 ? 'delivery' : 'missing_person',
      id % 2 ? 'North Quay' : 'South Quay',
      time(id - 150),
      id % 7 ? 'Delayed municipal record' : "Clerk's copied receipt ECHO-17",
      id % 5 ? 'open' : 'closed',
      person(id),
    ]),
  );
  add(
    'harbor_shipments',
    rows(600, (id) => [
      id,
      `PM-${id.toString().padStart(5, '0')}`,
      id % 2 ? 'North Quay' : 'South Quay',
      id % 7 ? time(id) : null,
      money(),
      ((id - 1) % 300) + 1,
    ]),
  );
  add(
    'dispatch_orders',
    rows(700, (id) => [
      id,
      ((id - 1) % 600) + 1,
      time(-60 + id),
      id % 9 ? time(-30 + id) : null,
      id === 1 ? roles.courier : person(id),
      id % 9 ? 'released' : 'pending',
    ]),
  );
  const scanned = Array.from({ length: 60 }, (_, i) => i + 1).filter(
    (id) => id !== roles.guard,
  );
  add(
    'badge_scans',
    rows(2000, (id) => {
      const staffId = scanned[(id - 1) % scanned.length]!;
      return [
        id,
        staffId,
        `B-${staffId}`,
        id % 3 ? 'NORTH' : 'SOUTH',
        time(-120 + Math.floor(rng() * 600)),
        id % 11 ? 'granted' : 'denied',
      ];
    }),
  );
  add(
    'shift_roster',
    rows(420, (id) => {
      const day = Math.floor((id - 1) / 60);
      return [
        id,
        person(id),
        new Date(Date.UTC(2028, 10, 4 + day)).toISOString().slice(0, 10),
        time(day * 1440 - 60),
        time(day * 1440 + 420),
        person(id) === roles.guard ? 'remote_archive' : 'gate_duty',
      ];
    }),
  );
  add(
    'payroll_entries',
    rows(600, (id) => [
      id,
      person(id),
      '2028-11-04',
      id % 5 ? '2.50' : '0.00',
      money(),
      time(600 + id),
      id % 7 ? null : 'Authorized correction — archived approval',
    ]),
  );
  add(
    'vehicle_registry',
    rows(100, (id) => [
      id,
      `PM-${id.toString().padStart(4, '0')}`,
      id % 3 ? 'van' : 'car',
      id % 9 ? 'Municipal Fleet' : null,
    ]),
  );
  add(
    'vehicle_assignments',
    rows(100, (id) => [
      id,
      id,
      id === vehicleId ? roles.guard : person(id),
      '2028-11-01T00:00:00Z',
      id % 9 ? null : '2028-12-01T00:00:00Z',
    ]),
  );
  add(
    'gate_events',
    rows(100, (id) => [
      id,
      id === 1 ? vehicleId : id,
      'NORTH',
      id === 1 ? eventAt : time(id + 120),
      id % 2 ? 'entry' : 'exit',
    ]),
  );
  add(
    'cctv_observations',
    rows(100, (id) => [
      id,
      id,
      id === 1 ? eventAt : time(id + 120),
      id === 1 ? roles.courier : id % 7 ? person(id) : null,
      id % 7 ? 'verified' : 'uncertain',
    ]),
  );
  add(
    'delivery_signatures',
    rows(700, (id) => [
      id,
      id,
      id === 1 ? roles.courier : id % 7 ? person(id) : null,
      id === 1
        ? new Date(Date.parse(eventAt) + 120000).toISOString()
        : time(id),
      id % 7 ? `W-${id}` : null,
    ]),
  );
  return { identities, counts, inserts };
}
