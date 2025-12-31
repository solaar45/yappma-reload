# 🔄 Frontend Testing Workflow

## Quick Start Testing Session

### Step-by-Step Testing Procedure

---

## 🎬 Session 1: Initial Setup & Smoke Test (15 min)

### Objective
Verify that the app starts and basic functionality works.

### Prerequisites
```bash
# Switch to main branch
git checkout main
git pull origin main

# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

### Smoke Test Checklist
```
URL: http://localhost:5173

✅ PASS / ❌ FAIL / ⚠️ ISSUE

[ ] App loads without errors
[ ] No console errors on initial load
[ ] Homepage/Dashboard renders
[ ] Navigation menu visible
[ ] Footer renders (if applicable)
[ ] i18n switcher visible
```

### Issue Template
```
❌ Issue: [Short description]
- Page: [URL or component]
- Browser: [Chrome/Firefox/etc]
- Console Error: [Copy error message]
- Screenshot: [Link or paste]
```

---

## 🎬 Session 2: Authentication Flow (20 min)

### Login Testing

```
Test Case 1: Valid Login
-------------------------
Steps:
1. Navigate to /login
2. Enter valid email: test@example.com
3. Enter valid password: password123
4. Click "Login" button

Expected: ✅
- Redirect to dashboard
- User menu shows username
- No error messages

Actual: [ ]
Notes: 
```

```
Test Case 2: Invalid Credentials
---------------------------------
Steps:
1. Navigate to /login
2. Enter invalid email: wrong@example.com
3. Enter invalid password: wrongpassword
4. Click "Login" button

Expected: ✅
- Error message displays
- "Invalid credentials" shown
- Form does not clear
- No redirect

Actual: [ ]
Notes: 
```

```
Test Case 3: Empty Form Validation
-----------------------------------
Steps:
1. Navigate to /login
2. Leave all fields empty
3. Click "Login" button

Expected: ✅
- Validation errors show
- "Email required" message
- "Password required" message
- Submit blocked

Actual: [ ]
Notes: 
```

### Registration Testing

```
Test Case 4: New User Registration
-----------------------------------
Steps:
1. Navigate to /register
2. Fill all required fields
3. Accept terms (if applicable)
4. Click "Register" button

Expected: ✅
- Account created
- Success message
- Auto-login OR redirect to login

Actual: [ ]
Notes: 
```

---

## 🎬 Session 3: Dashboard Testing (25 min)

### Data Display Testing

```
Test Case 5: Dashboard Data Load
---------------------------------
Steps:
1. Login successfully
2. Observe dashboard

Expected: ✅
- Net worth displays
- Account snapshots load
- Asset snapshots load
- Charts render
- Loading states shown during fetch

Actual: [ ]
Notes: 
```

### Chart Interaction

```
Test Case 6: Chart Interactivity
---------------------------------
Steps:
1. On dashboard, hover over charts
2. Click chart elements
3. Try zooming (if applicable)

Expected: ✅
- Tooltips show on hover
- Data updates on interaction
- Zoom/pan works smoothly

Actual: [ ]
Notes: 
```

### Empty State Testing

```
Test Case 7: No Data State
---------------------------
Prerequisites: Fresh user with no data

Steps:
1. Login with new/empty account
2. Navigate to dashboard

Expected: ✅
- Empty state message shows
- CTA to add first account/asset
- No JavaScript errors
- No broken UI elements

Actual: [ ]
Notes: 
```

---

## 🎬 Session 4: CRUD Operations (30 min)

### Accounts Management

```
Test Case 8: Create Account
----------------------------
Steps:
1. Navigate to Accounts page
2. Click "Add Account" button
3. Fill form:
   - Name: "Test Checking Account"
   - Type: "Checking"
   - Currency: "EUR"
   - Institution: [Select any]
4. Click "Save"

Expected: ✅
- Success message
- Account appears in list
- Modal closes
- Data persists on refresh

Actual: [ ]
Notes: 
```

```
Test Case 9: Edit Account
--------------------------
Steps:
1. Click edit on existing account
2. Change name to "Updated Account"
3. Click "Save"

Expected: ✅
- Success message
- Name updates in list
- Changes persist

Actual: [ ]
Notes: 
```

```
Test Case 10: Delete Account
-----------------------------
Steps:
1. Click delete on account
2. Confirm deletion

Expected: ✅
- Confirmation modal shows
- Account removed from list
- Success message
- Cannot be undone (or undo option works)

Actual: [ ]
Notes: 
```

### Snapshots Management

```
Test Case 11: Create Snapshot
------------------------------
Steps:
1. Navigate to Snapshots
2. Click "Add Snapshot"
3. Select account
4. Enter balance: 1234.56
5. Select today's date
6. Click "Save"

Expected: ✅
- Snapshot created
- Appears in list
- Dashboard updates

Actual: [ ]
Notes: 
```

---

## 🎬 Session 5: i18n Testing (15 min)

### Language Switching

```
Test Case 12: Switch to German
-------------------------------
Steps:
1. Click language switcher
2. Select "Deutsch" (DE)

Expected: ✅
- All text translates to German
- No missing keys (no "translation.key.name")
- Date format changes (DD.MM.YYYY)
- Number format changes (1.234,56)
- Selection persists on reload

Actual: [ ]
Notes: 
```

```
Test Case 13: Switch to English
--------------------------------
Steps:
1. Click language switcher
2. Select "English" (EN)

Expected: ✅
- All text translates to English
- Date format: MM/DD/YYYY
- Number format: 1,234.56
- No German text visible

Actual: [ ]
Notes: 
```

---

## 🎬 Session 6: Responsive Design (20 min)

### Mobile Testing

```
Test Case 14: Mobile View (375px)
----------------------------------
Steps:
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd/Ctrl + Shift + M)
3. Select "iPhone 12 Pro"
4. Test all pages

Expected: ✅
- Navigation collapses to hamburger
- Content stacks vertically
- Buttons are tappable (44x44px min)
- Text readable (16px min)
- No horizontal scroll
- Forms usable

Actual: [ ]
Notes: 
```

### Tablet Testing

```
Test Case 15: Tablet View (768px)
----------------------------------
Device: iPad

Expected: ✅
- Layout adjusts appropriately
- Tables scroll or stack
- Sidebar visible or toggleable

Actual: [ ]
Notes: 
```

---

## 🎬 Session 7: Performance Testing (15 min)

### Lighthouse Audit

```
Test Case 16: Performance Score
--------------------------------
Steps:
1. Build production: npm run build
2. Preview: npm run preview
3. Open Chrome DevTools
4. Lighthouse tab > Generate report

Expected: ✅
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 80

Actual:
- Performance: [ ]
- Accessibility: [ ]
- Best Practices: [ ]
- SEO: [ ]

Notes: 
```

### Load Time Testing

```
Test Case 17: Initial Load
---------------------------
Steps:
1. Clear browser cache
2. Open Network tab
3. Hard reload (Cmd/Ctrl + Shift + R)
4. Check timing

Expected: ✅
- DOMContentLoaded: < 1.5s
- Load: < 3s
- First Contentful Paint: < 1.8s

Actual:
- DOMContentLoaded: [ ]s
- Load: [ ]s
- FCP: [ ]s

Notes: 
```

---

## 🎬 Session 8: Error Handling (15 min)

### Network Error Simulation

```
Test Case 18: API Down Scenario
--------------------------------
Steps:
1. Open DevTools > Network tab
2. Enable "Offline" mode
3. Try to load dashboard

Expected: ✅
- Error message displays
- "Unable to connect" shown
- Retry button available
- No JavaScript crash

Actual: [ ]
Notes: 
```

```
Test Case 19: Slow Connection
------------------------------
Steps:
1. DevTools > Network > Throttling
2. Select "Slow 3G"
3. Navigate pages

Expected: ✅
- Loading indicators show
- Content loads eventually
- No timeout errors (or handled gracefully)

Actual: [ ]
Notes: 
```

---

## 📊 Session Summary Template

```
Testing Session Report
======================
Date: [YYYY-MM-DD]
Tester: [Name]
Branch: main
Commit: [SHA]
Browser: [Chrome 120 / etc]

### Summary
Total Tests: [ ]
Passed: ✅ [ ]
Failed: ❌ [ ]
Issues: ⚠️ [ ]

### Critical Issues (P0)
1. [Issue description]
2. ...

### Major Issues (P1)
1. [Issue description]
2. ...

### Minor Issues (P2)
1. [Issue description]
2. ...

### Observations
- [General feedback]
- [Performance notes]
- [UX suggestions]

### Recommendations
- [ ] Action item 1
- [ ] Action item 2

### Next Steps
- [ ] File GitHub issues for P0/P1
- [ ] Re-test after fixes
- [ ] Proceed to next testing phase
```

---

## 🎯 Priority Guidelines

### P0 - Critical (Blocker)
- App doesn't start
- Login broken
- Data loss
- Security vulnerabilities

### P1 - Major (Fix before release)
- Core features broken
- Poor performance
- Accessibility issues
- i18n missing

### P2 - Minor (Nice to fix)
- UI polish
- Edge cases
- Enhancement ideas

---

## 🚀 Next Steps After Testing

1. **Document Issues**
   - Create GitHub issues for P0/P1
   - Attach screenshots/videos
   - Tag with priority labels

2. **Share Results**
   - Post summary in team chat
   - Discuss critical issues
   - Plan fixes

3. **Re-test**
   - After fixes, re-run failed tests
   - Verify fixes work
   - Sign off on completion

4. **Prepare for Production**
   - Final smoke test
   - Performance audit
   - Security review
