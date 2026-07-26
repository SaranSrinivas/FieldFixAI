import sqlite3
import os

p = 'manuals/manuals.sqlite'
print('exists', os.path.exists(p))
conn = sqlite3.connect(p)
cur = conn.cursor()
print('tables', cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
for (name,) in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
    try:
        cols = cur.execute(f'PRAGMA table_info({name})').fetchall()
        print(name, cols)
        print('rows', cur.execute(f'SELECT COUNT(*) FROM {name}').fetchone()[0])
    except Exception as e:
        print('err', name, e)

print('--- animations ---')
for row in cur.execute('SELECT id, machine_id, file_path, duration, fps, resolution, sequence_type, notes FROM animations ORDER BY id'):
    print(row)

for table in ['components', 'component_tags', 'embeddings', 'machines']:
    print(f'--- {table} schema ---')
    for row in cur.execute(f'PRAGMA table_info({table})'):
        print(row)
    print(f'--- {table} sample ---')
    for row in cur.execute(f'SELECT * FROM {table} LIMIT 5'):
        print(row)
