# Erster User wird automatisch Super-Admin

YAPPMA macht jetzt automatisch den **ersten registrierten User** zum Super-Admin.

## Wie es funktioniert

### Bei der Registrierung

1. **User öffnet Registrierungsseite**
2. **Backend prüft:** Gibt es bereits User in der Datenbank?
   - **Ja:** Neuer User bekommt Rolle `user`
   - **Nein:** Neuer User bekommt Rolle `super_admin` ✅
3. **User wird erstellt** mit entsprechender Rolle
4. **Automatischer Login** nach Registrierung

### Code-Logik

**In `backend/lib/wealth_backend/accounts.ex`:**

```elixir
def register_user(attrs) do
  # Prüfe ob erster User
  is_first = is_first_user?()
  
  # Wenn erster User: Setze Rolle auf super_admin
  attrs = if is_first do
    Map.put(attrs, :role, "super_admin")
  else
    attrs
  end

  %User{}
  |> User.registration_changeset(attrs)
  |> Repo.insert()
end

defp is_first_user? do
  User
  |> limit(1)
  |> Repo.aggregate(:count, :id) == 0
end
```

## Für bestehende Installationen

### Szenario 1: Du hast dich bereits registriert

**Problem:** Dein User hat noch Rolle `user` statt `super_admin`

**Lösung:** Rolle manuell ändern (einmalig)

```bash
# Option A: In PostgreSQL
docker exec -it [postgres-container] psql -U kreator yappma

UPDATE users 
SET role = 'super_admin' 
WHERE email = 'deine@email.de';

\q

# Option B: Via Backend (wenn Container läuft)
docker exec -it yappma /app/backend/bin/wealth_backend rpc \
  "WealthBackend.Repo.query!('UPDATE users SET role = \\'super_admin\\' WHERE id = 1')"
```

**Dann:**
1. Logout im Browser
2. Neu einloggen
3. Admin-Sektion sollte jetzt sichtbar sein

### Szenario 2: Frische Installation

**Du bist der erste User** → Automatisch Super-Admin! 🎉

1. Registriere dich
2. Du siehst sofort die Admin-Sektion in der Sidebar
3. Keine weiteren Schritte nötig

### Szenario 3: Datenbank zurücksetzen

Wenn du komplett neu starten möchtest:

```bash
# ACHTUNG: Löscht ALLE Daten!

# 1. Container stoppen
docker stop yappma

# 2. Datenbank löschen
docker exec [postgres-container] \
  psql -U kreator -c "DROP DATABASE yappma;"

# 3. Container starten (DB wird automatisch neu erstellt)
docker start yappma

# 4. Neu registrieren → Erster User = Super-Admin
```

## Nach der Registrierung

### Admin-Funktionen verfügbar

Als Super-Admin siehst du:

**In der Sidebar:**
```
Menü
  🏠 Dashboard
  💾 Konten
  📈 Assets
  ...

Administration  ← NEU!
  🛡️ Admin Dashboard
  👥 Benutzerverwaltung
```

**Im User-Dropdown:**
```
Dein Name
deine@email.de [Super-Admin]  ← Badge
```

**Verfügbare Admin-Aktionen:**
- ✅ Neue User erstellen
- ✅ User bearbeiten (Name, Email, Rolle)
- ✅ Passwörter zurücksetzen
- ✅ User deaktivieren/reaktivieren
- ✅ Zu Admin befördern
- ✅ Von Admin zurückstufen (nicht bei Super-Admin!)
- ✅ User permanent löschen
- ✅ System-Statistiken ansehen
- ✅ Audit-Log einsehen

## Sicherheit

### Super-Admin-Schutz

✅ **Super-Admin kann nicht:**
- Seine eigene Rolle ändern
- Sich selbst deaktivieren
- Sich selbst löschen
- Von anderen Admins bearbeitet werden

✅ **Nur Super-Admin kann:**
- Andere User zu Admin befördern
- Admins zu User zurückstufen
- Alle User-Daten sehen und ändern

### Rollen-Hierarchie

```
Super-Admin (erste registrierte User)
  ↓ kann ernennen
Admin
  ↓ kann verwalten
User (Standard)
Read-Only (optional)
```

## Testen

### Lokale Entwicklung

```bash
# 1. Änderungen holen
cd ~/projects/yappma-reload
git pull

# 2. Backend neu starten
cd backend
mix ecto.reset  # Löscht alle Daten!
mix phx.server

# 3. Frontend starten
cd ../frontend
npm run dev

# 4. Registrieren
http://localhost:5173/register

# 5. Prüfen
# - Sidebar zeigt "Administration"
# - User-Dropdown zeigt "Super-Admin" Badge
```

### Docker/Unraid

```bash
# 1. Code aktualisieren
cd ~/projects/yappma-reload
git pull

# 2. Docker-Image neu bauen
docker build --no-cache -t solaar45/yappma:latest .

# 3. Zu Docker Hub pushen
docker push solaar45/yappma:latest

# 4. In Unraid aktualisieren
# Docker → YAPPMA → Force Update

# 5. Container neu starten

# 6. Registrieren oder manuell Rolle setzen (siehe oben)
```

## Häufige Fragen

### Kann ich mehrere Super-Admins haben?

**Ja!** Ein Super-Admin kann andere User zu Super-Admin befördern:

1. Admin-Panel → Benutzerverwaltung
2. User auswählen
3. "Bearbeiten" → Rolle: Super-Admin
4. Speichern

### Was passiert, wenn ich den ersten User lösche?

**Kein Problem:** Die Rolle wird nicht automatisch neu vergeben. Du musst manuell einen anderen User zum Super-Admin machen.

### Kann ich das Feature deaktivieren?

**Ja**, wenn du möchtest, dass der erste User normal bleibt:

```elixir
# In backend/lib/wealth_backend/accounts.ex
# Kommentiere diese Zeilen aus:

# is_first = is_first_user?()
# attrs = if is_first do
#   Map.put(attrs, :role, "super_admin")
# else
#   attrs
# end
```

Dann wird jeder neue User als `user` erstellt.

### Funktioniert das auch bei Migration von alter Version?

**Ja!** Die Migration setzt den ältesten User zum Super-Admin:

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE id = (SELECT id FROM users ORDER BY inserted_at ASC LIMIT 1)
```

**Aber:** Neue Registrierungen nutzen die neue automatische Logik.

## Zusammenfassung

✅ **Erster registrierter User = Automatisch Super-Admin**  
✅ **Keine manuelle Konfiguration nötig**  
✅ **Funktioniert out-of-the-box**  
✅ **Sicher gegen versehentliche Rechte-Eskalation**  
✅ **Super-Admin kann weitere Admins ernennen**  

**Für neue Installationen:** Einfach registrieren und loslegen! 🚀  
**Für bestehende Installationen:** Einmalig Rolle manuell setzen (siehe oben)
