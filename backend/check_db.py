import sqlite3
conn = sqlite3.connect('smartqueue.db')
print(conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").fetchone()[0])
