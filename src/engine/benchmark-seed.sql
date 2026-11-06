-- Synthetic T08 load fixture only: not a mission, case schema or grading oracle.
CREATE TABLE benchmark_records (
  record_id INTEGER PRIMARY KEY,
  group_id INTEGER NOT NULL,
  label TEXT NOT NULL
);
INSERT INTO benchmark_records
SELECT i, i % 50, 'record-' || i FROM generate_series(1, 5000) AS i;
CREATE INDEX benchmark_group ON benchmark_records (group_id);
