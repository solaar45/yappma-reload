# 🧪 YAPPMA Frontend Testing Guide

## 📋 Testing Strategy Overview

### Testing Pyramid

```
       /\        E2E Tests (5%)
      /  \       - Critical user flows
     /    \      - Full app integration
    /------\     
   /        \    Integration Tests (15%)
  /          \   - Component interactions
 /-----------\   - API integration
/             \  Unit Tests (80%)
----------------  - Pure functions
                  - Isolated components
```

---

## 🎯 Testing Objectives

### 1. Functionality Testing
- ✅ All features work as expected
- ✅ Navigation flows correctly
- ✅ Forms validate properly
- ✅ API calls handle success/error states
- ✅ State management works correctly

### 2. UI/UX Testing
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Cross-browser compatibility
- ✅ Accessibility (a11y)
- ✅ Visual consistency
- ✅ Loading states and feedback

### 3. Performance Testing
- ✅ Load times < 3s
- ✅ No memory leaks
- ✅ Smooth animations (60fps)
- ✅ Bundle size optimization

### 4. i18n Testing
- ✅ German translations complete
- ✅ English translations complete
- ✅ Language switching works
- ✅ No missing translation keys

---

## 📝 Testing Checklist

### Phase 1: Manual Testing (Exploratory)

#### Setup
- [ ] Fresh install (`npm install`)
- [ ] Development server starts without errors
- [ ] No console errors on load
- [ ] Environment variables loaded correctly

#### Authentication & User Management
- [ ] **Login**
  - [ ] Valid credentials work
  - [ ] Invalid credentials show error
  - [ ] Form validation works
  - [ ] Remember me checkbox works
  - [ ] Password visibility toggle works
  
- [ ] **Registration**
  - [ ] New user can register
  - [ ] Email validation works
  - [ ] Password requirements enforced
  - [ ] Duplicate email shows error
  
- [ ] **Logout**
  - [ ] User can logout
  - [ ] Session cleared properly
  - [ ] Redirect to login works

#### Dashboard
- [ ] **Data Display**
  - [ ] Net worth displays correctly
  - [ ] Account snapshots load
  - [ ] Asset snapshots load
  - [ ] Loading states show during fetch
  - [ ] Empty states show when no data
  
- [ ] **Charts & Visualizations**
  - [ ] Net worth chart renders
  - [ ] Account breakdown chart renders
  - [ ] Asset allocation chart renders
  - [ ] Charts are interactive
  - [ ] Chart tooltips work
  
- [ ] **Filters & Date Range**
  - [ ] Date range picker works
  - [ ] Date selection updates data
  - [ ] Reset filters works

#### Accounts Management
- [ ] **List View**
  - [ ] All accounts display
  - [ ] Sorting works (name, balance, date)
  - [ ] Filtering works (type, status)
  - [ ] Search functionality works
  - [ ] Pagination works (if applicable)
  
- [ ] **Create Account**
  - [ ] Form opens correctly
  - [ ] All fields validate
  - [ ] Institution dropdown works
  - [ ] Type selection works
  - [ ] Currency selection works
  - [ ] Save creates account
  - [ ] Success message shows
  - [ ] List updates after creation
  
- [ ] **Edit Account**
  - [ ] Form pre-fills with data
  - [ ] Changes save correctly
  - [ ] Success message shows
  - [ ] List updates after edit
  
- [ ] **Delete Account**
  - [ ] Confirmation modal shows
  - [ ] Cancel preserves account
  - [ ] Confirm deletes account
  - [ ] Success message shows
  - [ ] List updates after deletion

#### Snapshots Management
- [ ] **List View**
  - [ ] All snapshots display
  - [ ] Grouped by account/asset
  - [ ] Date sorting works
  - [ ] Filter by date range works
  
- [ ] **Create Snapshot**
  - [ ] Form opens correctly
  - [ ] Account/Asset selection works
  - [ ] Date picker works
  - [ ] Balance/Value input validates
  - [ ] Currency shows correctly
  - [ ] Save creates snapshot
  - [ ] Success message shows
  
- [ ] **Edit Snapshot**
  - [ ] Form pre-fills correctly
  - [ ] Changes save
  - [ ] Validation works
  
- [ ] **Delete Snapshot**
  - [ ] Confirmation works
  - [ ] Deletion successful

#### Assets Management
- [ ] **List View**
  - [ ] All assets display
  - [ ] Type filtering works
  - [ ] Status filtering (active/inactive)
  - [ ] Search works
  
- [ ] **Create Asset**
  - [ ] Form works for all asset types:
    - [ ] Securities (ISIN, WKN, Ticker)
    - [ ] Insurance
    - [ ] Real Estate
    - [ ] Loan
    - [ ] Cash
  - [ ] Type-specific fields show/hide
  - [ ] Validation works
  - [ ] Save creates asset
  
- [ ] **Edit Asset**
  - [ ] Pre-fills correctly
  - [ ] Changes save
  
- [ ] **Delete Asset**
  - [ ] Confirmation works
  - [ ] Deletion successful

#### Institutions Management
- [ ] **List View**
  - [ ] All institutions display
  - [ ] Type filtering works
  - [ ] Country filtering works
  
- [ ] **CRUD Operations**
  - [ ] Create works
  - [ ] Edit works
  - [ ] Delete works (if no linked accounts)
  - [ ] Delete blocked if accounts exist

#### Settings
- [ ] **User Profile**
  - [ ] Current data displays
  - [ ] Name change works
  - [ ] Email change works
  - [ ] Default currency change works
  - [ ] Save updates profile
  
- [ ] **Password Change**
  - [ ] Current password validates
  - [ ] New password validates
  - [ ] Confirm password matches
  - [ ] Password updates successfully
  
- [ ] **Preferences**
  - [ ] Theme toggle works (if implemented)
  - [ ] Notification settings work
  - [ ] Display preferences save

#### i18n (Internationalization)
- [ ] **Language Switching**
  - [ ] Switch to German works
  - [ ] Switch to English works
  - [ ] Selection persists on reload
  - [ ] All pages translate
  
- [ ] **Translation Quality**
  - [ ] No missing translation keys
  - [ ] No English in German mode
  - [ ] No German in English mode
  - [ ] Pluralization works
  - [ ] Date/number formatting correct

---

### Phase 2: Responsive Design Testing

#### Breakpoints to Test
- [ ] **Mobile (320px - 767px)**
  - [ ] iPhone SE (375x667)
  - [ ] iPhone 12 Pro (390x844)
  - [ ] Samsung Galaxy (360x740)
  
- [ ] **Tablet (768px - 1023px)**
  - [ ] iPad (768x1024)
  - [ ] iPad Pro (1024x1366)
  
- [ ] **Desktop (1024px+)**
  - [ ] Laptop (1366x768)
  - [ ] Desktop (1920x1080)
  - [ ] Large Desktop (2560x1440)

#### Responsive Checks
- [ ] Navigation menu adapts
- [ ] Tables scroll/stack appropriately
- [ ] Forms are usable on mobile
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Text is readable (min 16px)
- [ ] Images scale properly
- [ ] No horizontal scroll
- [ ] Modal/dialogs fit screen

---

### Phase 3: Cross-Browser Testing

#### Browsers to Test
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest, macOS/iOS)
- [ ] **Edge** (latest)
- [ ] **Chrome Mobile** (Android)
- [ ] **Safari Mobile** (iOS)

#### Browser-Specific Checks
- [ ] CSS renders correctly
- [ ] JavaScript executes properly
- [ ] API calls work
- [ ] LocalStorage/SessionStorage works
- [ ] Date pickers work
- [ ] File uploads work (if applicable)

---

### Phase 4: Performance Testing

#### Load Time
- [ ] Initial load < 3s (on 4G)
- [ ] Time to Interactive < 5s
- [ ] First Contentful Paint < 1.8s

#### Runtime Performance
- [ ] No memory leaks after 10 min usage
- [ ] Smooth scrolling (60fps)
- [ ] Animations smooth
- [ ] No layout shifts

#### Bundle Size
- [ ] Main bundle < 300KB (gzipped)
- [ ] Vendor bundle < 500KB (gzipped)
- [ ] Code splitting implemented
- [ ] Lazy loading works

#### Tools
```bash
# Lighthouse audit
npm run build
npx lighthouse http://localhost:4173 --view

# Bundle analyzer
npm run build -- --analyze

# Performance profiling
# Chrome DevTools > Performance tab
```

---

### Phase 5: Accessibility (a11y) Testing

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] All interactive elements reachable
- [ ] Focus indicators visible
- [ ] Escape closes modals
- [ ] Enter submits forms

#### Screen Reader Testing
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Forms have labels
- [ ] ARIA attributes correct
- [ ] Landmarks present

#### Color & Contrast
- [ ] Text contrast ratio ≥ 4.5:1
- [ ] Interactive elements ≥ 3:1
- [ ] Color not sole indicator

#### Tools
```bash
# axe DevTools extension
# Install in Chrome/Firefox

# Lighthouse accessibility audit
npx lighthouse http://localhost:5173 --only-categories=accessibility

# WAVE extension
# https://wave.webaim.org/extension/
```

---

### Phase 6: Error Handling Testing

#### Network Errors
- [ ] **API Down**
  - [ ] Graceful error message
  - [ ] Retry mechanism works
  - [ ] Offline mode (if applicable)
  
- [ ] **Slow Connection**
  - [ ] Loading indicators show
  - [ ] Timeouts handled
  - [ ] User can cancel requests
  
- [ ] **400 Errors**
  - [ ] Validation errors display
  - [ ] User can correct input
  
- [ ] **401/403 Errors**
  - [ ] Redirect to login
  - [ ] Session expired message
  
- [ ] **404 Errors**
  - [ ] Custom 404 page
  - [ ] Navigation back works
  
- [ ] **500 Errors**
  - [ ] Generic error message
  - [ ] Error logged (Sentry/etc)

#### Edge Cases
- [ ] Empty data states
- [ ] Very long text
- [ ] Special characters in input
- [ ] Large numbers
- [ ] Negative numbers
- [ ] Date boundaries (leap years, etc)

---

### Phase 7: Security Testing

#### Input Validation
- [ ] XSS prevention (no script execution)
- [ ] SQL injection prevention (sanitized)
- [ ] CSRF tokens present

#### Authentication
- [ ] Tokens stored securely (httpOnly cookies)
- [ ] Logout clears all tokens
- [ ] Protected routes redirect unauthorized

#### Data Exposure
- [ ] No sensitive data in console logs
- [ ] No API keys in source
- [ ] No sensitive data in URLs

---

## 🛠️ Testing Tools & Scripts

### Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Browser DevTools Checklist

#### Console Tab
- [ ] No errors
- [ ] No warnings (or justified)
- [ ] No uncaught promises

#### Network Tab
- [ ] All requests successful
- [ ] No 4xx/5xx errors
- [ ] Reasonable payload sizes
- [ ] Caching works

#### Application Tab
- [ ] LocalStorage data correct
- [ ] SessionStorage data correct
- [ ] Cookies set properly

#### Performance Tab
- [ ] No long tasks (>50ms)
- [ ] No layout thrashing
- [ ] Memory usage stable

---

## 📊 Test Results Template

### Test Report: [Date]

**Tester:** [Your Name]  
**Environment:** Development / Production  
**Browser:** Chrome 120 / Firefox 121 / Safari 17  
**Device:** Desktop / Mobile / Tablet  

#### Summary
- **Total Tests:** X
- **Passed:** ✅ X
- **Failed:** ❌ X
- **Blocked:** ⚠️ X

#### Critical Issues
1. **[Issue Title]**
   - Severity: High / Medium / Low
   - Steps to reproduce:
     1. Step 1
     2. Step 2
   - Expected: ...
   - Actual: ...
   - Screenshot: [link]

#### Recommendations
- [ ] Fix critical issues before production
- [ ] Improve loading performance
- [ ] Add missing translations
- [ ] etc.

---

## 🚀 Continuous Testing

### Pre-Commit
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build succeeds

### Pre-Deploy
- [ ] All manual tests passed
- [ ] Performance audit passed
- [ ] Accessibility audit passed
- [ ] Cross-browser tested

### Post-Deploy
- [ ] Smoke test production
- [ ] Monitor error logs
- [ ] Check analytics

---

## 📚 Resources

- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
