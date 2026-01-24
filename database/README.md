# DomusVita PostgreSQL Datenbank

## Übersicht

Dieses Verzeichnis enthält alle SQL-Dateien für die Azure PostgreSQL Datenbank.

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `schema.sql` | Vollständiges Datenbankschema mit allen Tabellen, Indizes, Views und Triggern |
| `seed_data.sql` | Echte DomusVita-Immobiliendaten für die initiale Befüllung |

## Azure PostgreSQL Einrichtung

### 1. Azure PostgreSQL Server erstellen

```bash
# Mit Azure CLI
az postgres flexible-server create \
  --name domusvita-db \
  --resource-group domusvita-rg \
  --location germanywestcentral \
  --admin-user domusvita_admin \
  --admin-password <IHR_SICHERES_PASSWORT> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15
```

### 2. Firewall-Regeln konfigurieren

```bash
# Zugriff von Azure-Diensten erlauben
az postgres flexible-server firewall-rule create \
  --name AllowAzureServices \
  --resource-group domusvita-rg \
  --server-name domusvita-db \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Ihre IP-Adresse hinzufügen (für lokale Entwicklung)
az postgres flexible-server firewall-rule create \
  --name AllowMyIP \
  --resource-group domusvita-rg \
  --server-name domusvita-db \
  --start-ip-address <IHRE_IP> \
  --end-ip-address <IHRE_IP>
```

### 3. Datenbank erstellen

```bash
az postgres flexible-server db create \
  --resource-group domusvita-rg \
  --server-name domusvita-db \
  --database-name domusvita
```

### 4. Schema und Daten importieren

```bash
# Verbindungsstring
export PGHOST=domusvita-db.postgres.database.azure.com
export PGUSER=domusvita_admin
export PGDATABASE=domusvita
export PGPASSWORD=<IHR_PASSWORT>

# Schema importieren
psql -f schema.sql

# Seed-Daten importieren
psql -f seed_data.sql
```

## Datenbankstruktur

### Haupttabellen

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   properties    │────<│     units       │────<│    contacts     │
│  (Immobilien)   │     │   (Einheiten)   │     │   (Kontakte)    │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────>│   contracts     │<─────────────┘
                        │   (Verträge)    │
                        └─────────────────┘
         │
         │              ┌─────────────────┐
         └─────────────>│ maintenance_    │──────┐
                        │ tickets         │      │
                        └────────┬────────┘      │
                                 │               │
         ┌───────────────────────┼───────────────┼───────────────────────┐
         │                       │               │                       │
┌────────▼────────┐     ┌────────▼────────┐     │              ┌────────▼────────┐
│  ticket_photos  │     │ status_updates  │     │              │  work_reports   │
│    (Fotos)      │     │ (Statusverlauf) │     │              │(Arbeitsberichte)│
└─────────────────┘     └─────────────────┘     │              └─────────────────┘
                                                │
                                       ┌────────▼────────┐
                                       │notification_logs│
                                       │ (E-Mail-Log)    │
                                       └─────────────────┘
```

### Enum-Typen

| Typ | Werte |
|-----|-------|
| `property_type` | Pflegewohngemeinschaft, Wohnung, Mehrfamilienhaus, Büro, Gewerbe |
| `property_status` | Eigentum, Gemietet, Untervermietet |
| `contact_role` | Mieter, Eigentümer, Handwerker, Versorger, Behörde |
| `ticket_status` | Offen, In Bearbeitung, Erledigt |
| `ticket_priority` | Niedrig, Normal, Hoch, Dringend |
| `handwerker_status` | Unterwegs, Vor Ort, In Arbeit, Erledigt, Material fehlt |
| `photo_category` | Vorher, Während, Nachher |
| `contract_type` | Mietvertrag, Hauptmietvertrag, Versicherung, Wartungsvertrag |

### Benachrichtigungseinstellungen

Jede Immobilie kann individuelle Benachrichtigungseinstellungen haben:

```sql
-- In der properties Tabelle:
notification_email VARCHAR(255)  -- E-Mail-Empfänger
notify_on_status_change BOOLEAN  -- Benachrichtigungen aktiviert?
notify_statuses handwerker_status[]  -- Bei welchen Status benachrichtigen?
```

Standardmäßig wird bei folgenden Status-Änderungen benachrichtigt:
- **Vor Ort** - Handwerker ist angekommen
- **Erledigt** - Arbeit abgeschlossen
- **Material fehlt** - Verzögerung wegen fehlendem Material

## Verbindungsstring für FastAPI

```python
# .env Datei
DATABASE_URL=postgresql://domusvita_admin:<PASSWORT>@domusvita-db.postgres.database.azure.com:5432/domusvita?sslmode=require
```

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

## Backup & Wiederherstellung

### Backup erstellen

```bash
pg_dump -h domusvita-db.postgres.database.azure.com \
  -U domusvita_admin \
  -d domusvita \
  -F c \
  -f backup_$(date +%Y%m%d).dump
```

### Backup wiederherstellen

```bash
pg_restore -h domusvita-db.postgres.database.azure.com \
  -U domusvita_admin \
  -d domusvita \
  -c \
  backup_20250124.dump
```

## Nächste Schritte

1. ✅ Schema erstellt
2. ✅ Seed-Daten vorbereitet
3. ⏳ Azure PostgreSQL Server erstellen
4. ⏳ Schema in Azure importieren
5. ⏳ Backend auf SQLAlchemy/PostgreSQL umstellen
6. ⏳ E-Mail-Benachrichtigungen aktivieren
