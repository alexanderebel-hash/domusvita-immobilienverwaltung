"""
PostgreSQL JSONB Database Layer
MongoDB-compatible interface backed by PostgreSQL with JSONB storage.
Allows near-zero changes to existing server.py code.

Each "collection" maps to a PostgreSQL table with a single JSONB column.
MongoDB operations (find_one, insert_one, update_one, etc.) are translated to SQL.

Extended version for Immobilienverwaltung with:
- $or / $regex query operators
- $inc update operator
- upsert support
- distinct() method
- Field exclusion/inclusion projections
"""

import asyncpg
import json
import os
import logging
import re

logger = logging.getLogger(__name__)


class UpdateResult:
    """Mimics pymongo UpdateResult / DeleteResult."""
    def __init__(self, matched_count: int):
        self.matched_count = matched_count
        self.deleted_count = matched_count  # Alias for delete operations


def _validate_table_name(name: str):
    """Prevent SQL injection via table names."""
    if not re.match(r'^[a-z_][a-z0-9_]*$', name):
        raise ValueError(f"Invalid table name: {name}")


def _validate_field_name(name: str):
    """Prevent SQL injection via field names."""
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name):
        raise ValueError(f"Invalid field name: {name}")


def _build_select(projection: dict = None) -> str:
    """Build SQL SELECT expression handling field exclusions/inclusions.

    Supports MongoDB-style projections:
    - Exclusion: {"field": 0} removes fields from result
    - Inclusion: {"field": 1} returns only specified fields
    Uses PostgreSQL JSONB operators for efficient field handling.
    """
    if not projection:
        return "data"

    fields = {k: v for k, v in projection.items() if k != "_id"}

    if not fields:
        return "data"

    values = set(fields.values())

    if values == {0}:
        # Exclusion projection: data - 'field1' - 'field2'
        expr = "data"
        for field in fields:
            _validate_field_name(field)
            expr = f"{expr} - '{field}'"
        return f"{expr} AS data"
    elif values == {1}:
        # Inclusion projection: jsonb_build_object('f1', data->'f1', ...)
        parts = []
        for field in fields:
            _validate_field_name(field)
            parts.append(f"'{field}', data->'{field}'")
        return f"jsonb_build_object({', '.join(parts)}) AS data"

    # Mixed or unknown - return full data
    return "data"


def _build_where(query: dict, _idx_ref=None) -> tuple:
    """Convert MongoDB-style query dict to SQL WHERE clause + params.

    Supports:
    - Simple equality: {"field": "value"} -> data @> '{"field":"value"}'::jsonb
    - $gte, $lte, $gt, $lt: comparison operators
    - $in: {"field": {"$in": ["a","b"]}} -> data->>'field' IN ('a','b')
    - $ne: {"field": {"$ne": "value"}} -> data->>'field' != 'value'
    - $regex + $options: {"field": {"$regex": "pat", "$options": "i"}} -> ILIKE
    - $or: {"$or": [{...}, {...}]} -> (... OR ...)
    """
    if not query:
        return "", []

    if _idx_ref is None:
        _idx_ref = [1]

    conditions = []
    params = []

    for key, value in query.items():
        if key == "$or":
            or_parts = []
            for sub_query in value:
                sub_where, sub_params = _build_where(sub_query, _idx_ref)
                if sub_where:
                    or_parts.append(f"({sub_where})")
                    params.extend(sub_params)
            if or_parts:
                conditions.append(f"({' OR '.join(or_parts)})")
            continue

        _validate_field_name(key)

        if isinstance(value, dict):
            for op, op_value in value.items():
                if op == "$gte":
                    conditions.append(f"data->>'{key}' >= ${_idx_ref[0]}")
                    params.append(str(op_value))
                    _idx_ref[0] += 1
                elif op == "$lte":
                    conditions.append(f"data->>'{key}' <= ${_idx_ref[0]}")
                    params.append(str(op_value))
                    _idx_ref[0] += 1
                elif op == "$gt":
                    conditions.append(f"data->>'{key}' > ${_idx_ref[0]}")
                    params.append(str(op_value))
                    _idx_ref[0] += 1
                elif op == "$lt":
                    conditions.append(f"data->>'{key}' < ${_idx_ref[0]}")
                    params.append(str(op_value))
                    _idx_ref[0] += 1
                elif op == "$in":
                    if not op_value:
                        conditions.append("FALSE")
                    else:
                        placeholders = ", ".join(f"${_idx_ref[0] + i}" for i in range(len(op_value)))
                        conditions.append(f"data->>'{key}' IN ({placeholders})")
                        for v in op_value:
                            params.append(str(v))
                        _idx_ref[0] += len(op_value)
                elif op == "$ne":
                    conditions.append(f"data->>'{key}' != ${_idx_ref[0]}")
                    params.append(str(op_value))
                    _idx_ref[0] += 1
                elif op == "$regex":
                    options = value.get("$options", "")
                    if "i" in options:
                        conditions.append(f"data->>'{key}' ILIKE ${_idx_ref[0]}")
                    else:
                        conditions.append(f"data->>'{key}' LIKE ${_idx_ref[0]}")
                    params.append(f"%{op_value}%")
                    _idx_ref[0] += 1
                elif op == "$options":
                    pass  # Handled together with $regex
                else:
                    raise ValueError(f"Unsupported operator: {op}")
        else:
            # Simple equality - use @> for type-safe JSONB comparison
            contains = json.dumps({key: value})
            conditions.append(f"data @> ${_idx_ref[0]}::jsonb")
            params.append(contains)
            _idx_ref[0] += 1

    return " AND ".join(conditions), params


class PgCursor:
    """Async cursor mimicking Motor's cursor with sort() and to_list()."""

    def __init__(self, collection, query: dict, projection: dict = None):
        self.collection = collection
        self.query = query
        self.projection = projection
        self._sort_field = None
        self._sort_dir = "ASC"
        self._skip = 0

    def sort(self, field: str, direction: int):
        _validate_field_name(field)
        self._sort_field = field
        self._sort_dir = "ASC" if direction == 1 else "DESC"
        return self

    def skip(self, offset: int):
        """Skip N documents (for pagination). Translates to SQL OFFSET."""
        self._skip = max(0, int(offset))
        return self

    async def to_list(self, limit: int) -> list:
        await self.collection._ensure_table()
        where, params = _build_where(self.query)
        select_expr = _build_select(self.projection)
        sql = f"SELECT {select_expr} FROM {self.collection.table}"
        if where:
            sql += f" WHERE {where}"
        if self._sort_field:
            # Use -> (JSONB) for type-aware sorting (numbers sort numerically)
            sql += f" ORDER BY data->'{self._sort_field}' {self._sort_dir}"
        sql += f" LIMIT {int(limit)}"
        if self._skip > 0:
            sql += f" OFFSET {self._skip}"

        async with self.collection.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [json.loads(row["data"]) for row in rows]


class PgCollection:
    """MongoDB-compatible collection backed by a PostgreSQL table with JSONB."""

    def __init__(self, pool, table_name: str):
        _validate_table_name(table_name)
        self.pool = pool
        self.table = table_name
        self._table_created = False

    async def _ensure_table(self):
        if self._table_created:
            return
        async with self.pool.acquire() as conn:
            await conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.table} (
                    data JSONB NOT NULL
                )
            """)
            # GIN index for efficient @> (contains) queries
            await conn.execute(f"""
                CREATE INDEX IF NOT EXISTS idx_{self.table}_gin
                ON {self.table} USING GIN (data)
            """)
        self._table_created = True

    async def find_one(self, query=None, projection=None):
        await self._ensure_table()
        where, params = _build_where(query or {})
        select_expr = _build_select(projection)
        sql = f"SELECT {select_expr} FROM {self.table}"
        if where:
            sql += f" WHERE {where}"
        sql += " LIMIT 1"

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(sql, *params)
            return json.loads(row["data"]) if row else None

    def find(self, query=None, projection=None):
        return PgCursor(self, query or {}, projection)

    async def insert_one(self, doc):
        await self._ensure_table()
        async with self.pool.acquire() as conn:
            await conn.execute(
                f"INSERT INTO {self.table} (data) VALUES ($1::jsonb)",
                json.dumps(doc, default=str)
            )

    async def insert_many(self, docs):
        await self._ensure_table()
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for doc in docs:
                    await conn.execute(
                        f"INSERT INTO {self.table} (data) VALUES ($1::jsonb)",
                        json.dumps(doc, default=str)
                    )

    async def update_one(self, query, update, upsert=False):
        await self._ensure_table()
        set_data = update.get("$set", {})
        inc_data = update.get("$inc", {})
        where, where_params = _build_where(query)
        where_clause = where if where else "TRUE"

        # Build the data expression
        data_expr = "data"
        params = list(where_params)
        idx = len(params) + 1

        # Apply $set
        if set_data:
            set_json = json.dumps(set_data, default=str)
            data_expr = f"{data_expr} || ${idx}::jsonb"
            params.append(set_json)
            idx += 1

        # Apply $inc
        for field, amount in inc_data.items():
            _validate_field_name(field)
            safe_amount = int(amount)
            data_expr = (
                f"jsonb_set({data_expr}, '{{{field}}}', "
                f"to_jsonb(COALESCE((data->>'{field}')::int, 0) + {safe_amount}))"
            )

        sql = f"""
            UPDATE {self.table}
            SET data = {data_expr}
            WHERE ctid = (
                SELECT ctid FROM {self.table} WHERE {where_clause} LIMIT 1
            )
        """

        async with self.pool.acquire() as conn:
            result = await conn.execute(sql, *params)
            count = int(result.split()[-1])

            if count == 0 and upsert:
                # No match found - insert new document
                doc = dict(query)
                doc.update(set_data)
                for field, amount in inc_data.items():
                    doc[field] = doc.get(field, 0) + int(amount)
                await conn.execute(
                    f"INSERT INTO {self.table} (data) VALUES ($1::jsonb)",
                    json.dumps(doc, default=str)
                )
                return UpdateResult(1)

            return UpdateResult(count)

    async def delete_one(self, query):
        await self._ensure_table()
        where, params = _build_where(query)
        where_clause = where if where else "TRUE"

        sql = f"""
            DELETE FROM {self.table}
            WHERE ctid = (
                SELECT ctid FROM {self.table} WHERE {where_clause} LIMIT 1
            )
        """

        async with self.pool.acquire() as conn:
            result = await conn.execute(sql, *params)
            count = int(result.split()[-1])
            return UpdateResult(count)

    async def delete_many(self, query=None):
        await self._ensure_table()
        where, params = _build_where(query or {})
        sql = f"DELETE FROM {self.table}"
        if where:
            sql += f" WHERE {where}"

        async with self.pool.acquire() as conn:
            result = await conn.execute(sql, *params)
            count = int(result.split()[-1])
            return UpdateResult(count)

    async def count_documents(self, query=None):
        await self._ensure_table()
        where, params = _build_where(query or {})
        sql = f"SELECT COUNT(*) FROM {self.table}"
        if where:
            sql += f" WHERE {where}"

        async with self.pool.acquire() as conn:
            return await conn.fetchval(sql, *params)

    async def distinct(self, field: str) -> list:
        """Get distinct values for a field across all documents."""
        await self._ensure_table()
        _validate_field_name(field)
        sql = f"SELECT DISTINCT data->>'{field}' FROM {self.table} WHERE data->>'{field}' IS NOT NULL"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql)
            return [row[0] for row in rows]

    async def create_index(self, field: str, unique: bool = False):
        await self._ensure_table()
        _validate_field_name(field)
        index_name = f"idx_{self.table}_{field}"
        unique_str = "UNIQUE" if unique else ""

        sql = f"""
            CREATE {unique_str} INDEX IF NOT EXISTS {index_name}
            ON {self.table} ((data->>'{field}'))
        """

        async with self.pool.acquire() as conn:
            try:
                await conn.execute(sql)
            except Exception as e:
                logger.warning(f"Index creation for {self.table}.{field}: {e}")


class PgDatabase:
    """MongoDB-compatible database object backed by PostgreSQL.

    Usage is identical to Motor's database object:
        db.users.find_one({"email": "..."})
        db.properties.find({}).sort("created_at", -1).to_list(100)
    """

    def __init__(self, pool):
        self.pool = pool
        self._collections = {}

    def __getattr__(self, name: str):
        if name.startswith("_") or name in ("pool",):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = PgCollection(self.pool, name)
        return self._collections[name]

    async def command(self, cmd: str):
        """Execute a database command (supports 'ping' for health checks)."""
        if cmd == "ping":
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            return {"ok": 1}
        raise ValueError(f"Unsupported command: {cmd}")

    async def close(self):
        await self.pool.close()

    @classmethod
    async def create(cls):
        """Create database connection pool from PG* environment variables."""
        ssl_mode = os.environ.get("PGSSLMODE", "")
        ssl = "require" if ssl_mode == "require" else None

        pool = await asyncpg.create_pool(
            host=os.environ.get("PGHOST", "localhost"),
            port=int(os.environ.get("PGPORT", "5432")),
            database=os.environ.get("PGDATABASE", "domusvita"),
            user=os.environ.get("PGUSER", "postgres"),
            password=os.environ.get("PGPASSWORD", ""),
            ssl=ssl,
            min_size=2,
            max_size=10,
        )
        logger.info(f"PostgreSQL pool created: {os.environ.get('PGHOST')}:{os.environ.get('PGPORT')}/{os.environ.get('PGDATABASE')}")
        return cls(pool)
