import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        user="postgres",
        password="aaa123",
        dbname="postgres",
        connect_timeout=3
    )
    print("SUCCESS: Connected to PostgreSQL with password 'aaa123'!")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datname = 'c2l_qc';")
    row = cur.fetchone()
    if not row:
        print("Creating database c2l_qc...")
        cur.execute("CREATE DATABASE c2l_qc;")
        print("Database c2l_qc created successfully!")
    else:
        print("Database c2l_qc already exists.")
    cur.close()
    conn.close()
except Exception as e:
    print("PostgreSQL connection error:", e)
