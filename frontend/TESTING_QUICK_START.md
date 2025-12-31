# ⚡ Frontend Testing - Quick Start

> **Schnelleinstieg für sofortiges Testing**

---

## 🚀 Los geht's!

### 1. Setup (2 Minuten)

```bash
# Main branch pullen
git checkout main
git pull origin main

# Frontend starten
cd frontend
npm install  # Falls nötig
npm run dev
```

**Erwartung:** Server startet auf `http://localhost:5173`

---

## ✅ Quick Smoke Test (5 Minuten)

### Basis-Check

```
Browser: öffne http://localhost:5173

✅ App lädt ohne Fehler
✅ Keine roten Fehler in Console (F12)
✅ Dashboard/Homepage erscheint
✅ Navigation ist sichtbar
✅ Sprache wechseln funktioniert (DE/EN)
```

---

## 📋 Testing-Sessions

### Session 1: Core Features (15 min)

**Login**
```
1. Gehe zu /login
2. Eingabe: test@example.com / password123
3. Klick "Login"

✅ Redirect zu Dashboard?
✅ Kein Error?
✅ User-Menü sichtbar?
```

**Dashboard**
```
1. Dashboard ansehen
2. Daten laden

✅ Net Worth zeigt Zahl?
✅ Charts rendern?
✅ Loading States sichtbar?
✅ Keine JS Errors?
```

**Accounts**
```
1. Gehe zu Accounts
2. Klick "Add Account"
3. Fülle Form aus
4. Speichern

✅ Modal öffnet?
✅ Speichern funktioniert?
✅ Account erscheint in Liste?
✅ Success Message?
```

---

### Session 2: i18n Testing (10 min)

**Deutsch**
```
1. Klick Sprache-Switcher
2. Wähle "Deutsch"

✅ Alle Texte auf Deutsch?
✅ Keine "translation.key" sichtbar?
✅ Datum: DD.MM.YYYY?
✅ Zahlen: 1.234,56?
✅ Nach Reload noch Deutsch?
```

**English**
```
1. Switch to English

✅ All text in English?
✅ Date: MM/DD/YYYY?
✅ Numbers: 1,234.56?
✅ No German text?
```

---

### Session 3: Responsive Design (10 min)

**Mobile (Chrome DevTools)**
```
1. F12 → Device Toolbar (Cmd+Shift+M)
2. Wähle "iPhone 12 Pro"
3. Navigiere durch App

✅ Menü wird Hamburger?
✅ Content stapelt vertikal?
✅ Buttons groß genug?
✅ Kein horizontaler Scroll?
✅ Forms bedienbar?
```

**Tablet**
```
1. Wähle "iPad"
2. Teste Navigation

✅ Layout passt?
✅ Sidebar funktioniert?
✅ Tabellen scrollbar?
```

---

## 🐛 Issues dokumentieren

### Issue Template

```markdown
## ❌ [Kurze Beschreibung]

**Severity:** P0 (Critical) / P1 (Major) / P2 (Minor)

**Seite:** /dashboard (oder Komponente)

**Browser:** Chrome 120

**Schritte:**
1. Schritt 1
2. Schritt 2
3. Fehler tritt auf

**Erwartet:** Was sollte passieren

**Tatsächlich:** Was passiert

**Console Error:**
```
[Error-Text hier]
```

**Screenshot:** [Link oder einfügen]
```

---

## 🛠️ Hilfreiche Tools

### Browser DevTools

```bash
# Console öffnen
F12 oder Cmd+Opt+I

# Device Toolbar
Cmd+Shift+M (Mac)
Ctrl+Shift+M (Windows/Linux)

# Network Tab
- Offline Mode testen
- Throttling: Slow 3G
```

### Performance Check

```bash
# Production build testen
npm run build
npm run preview

# Lighthouse Audit
Chrome DevTools > Lighthouse Tab > Generate Report

Ziel:
- Performance: ≥ 90
- Accessibility: ≥ 90
```

---

## 📊 Test Report erstellen

### Vorlage (Kopieren in Issue/Markdown)

```markdown
# Frontend Test Report - [Datum]

## 📊 Übersicht

- **Tester:** [Dein Name]
- **Branch:** main
- **Browser:** Chrome 120 / Firefox 121
- **Datum:** 2024-12-31

## ✅ Ergebnisse

- **Getestet:** 20 Test Cases
- **Passed:** ✅ 18
- **Failed:** ❌ 2
- **Issues:** ⚠️ 3

## ❌ Critical Issues

1. **Login funktioniert nicht**
   - Severity: P0
   - Reproduktion: [...]
   - Screenshot: [...]

## ⚠️ Major Issues

1. **Dashboard Chart flackert**
   - Severity: P1
   - Reproduktion: [...]

## 📝 Minor Issues

1. **Button Spacing auf Mobile**
   - Severity: P2
   - Betrifft: /accounts

## 💡 Empfehlungen

- [ ] Fix P0 Issues sofort
- [ ] Improve Loading States
- [ ] Add more i18n keys

## ✍️ Notes

- Performance gut (Lighthouse 95)
- i18n fast vollständig
- Mobile UX sehr gut
```

---

## 🔄 Nach dem Testing

### 1. Issues anlegen

```bash
# Für jeden P0/P1 Fehler:
1. Gehe zu GitHub Issues
2. "New Issue"
3. Titel: [Bug] Kurzbeschreibung
4. Label: bug, priority-high
5. Screenshot anhängen
```

### 2. Zusammenfassung teilen

- Markdown Report erstellen
- In Team-Chat posten
- Diskussion für Fixes planen

### 3. Re-Test nach Fixes

```bash
# Nach Fix:
git pull origin main
npm run dev

# Betroffene Tests wiederholen
# Bei Success: Issue schließen
```

---

## 📚 Ausführliche Docs

- **[Testing Guide](docs/TESTING_GUIDE.md)** - Vollständige Checkliste
- **[Testing Workflow](docs/TESTING_WORKFLOW.md)** - Detaillierte Test Cases

---

## ❓ Probleme?

### App startet nicht

```bash
# Node modules neu installieren
rm -rf node_modules
npm install

# Cache leeren
npm cache clean --force
```

### Console Errors

1. Screenshot machen
2. Vollständige Error Message kopieren
3. GitHub Issue erstellen

### Build Fehler

```bash
# TypeScript Check
npm run type-check

# Linting
npm run lint
```

---

**Los geht's! Happy Testing! 🎉**
