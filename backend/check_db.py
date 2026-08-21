import asyncio
from database import patients_col, scans_col, users_col, review_queue_col, audit_logs_col, init_db

async def main():
    await init_db()
    u = await users_col.count_documents({})
    p = await patients_col.count_documents({})
    s = await scans_col.count_documents({})
    r = await review_queue_col.count_documents({})
    a = await audit_logs_col.count_documents({})
    print(f"Users: {u}")
    print(f"Patients: {p}")
    print(f"Scans: {s}")
    print(f"ReviewQueue: {r}")
    print(f"AuditLogs: {a}")

if __name__ == "__main__":
    asyncio.run(main())
