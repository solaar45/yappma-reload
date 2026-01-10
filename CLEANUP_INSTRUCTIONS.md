# Git Cleanup Instructions

## Problem: Accidentally Committed Files

The following files/directories were accidentally committed and need to be removed from Git history:

1. **Root `node_modules/`** - Should never be in version control
2. **Root `.env`** - Contains secrets, should not be committed
3. **Root `package-lock.json`** - May be redundant if using workspaces

## Solution: Remove from Git (Keep Local Files)

### Quick Fix (Recommended)

Run these commands to remove files from Git tracking while keeping them locally:

```bash
# Navigate to repository root
cd /path/to/yappma-reload

# Remove from Git (keeps local files)
git rm -r --cached node_modules
git rm --cached .env
git rm --cached package-lock.json

# Commit the removal
git commit -m "chore: Remove accidentally committed files from version control

- Remove node_modules/ (dependencies should not be committed)
- Remove .env (secrets should not be committed)
- Remove package-lock.json (may be redundant)

These files are now protected by .gitignore"

# Push changes
git push origin ux/simplified-institution-flow
```

### Verify Files Are Ignored

```bash
# Check git status - these should not appear
git status

# Should show nothing for:
# - node_modules/
# - .env
# - package-lock.json

# Verify .gitignore is working
cat .gitignore | grep -E "node_modules|.env|package-lock"
```

## Why These Files Were Committed

### Root node_modules/

**Issue:** A root `package.json` exists, which caused npm to install dependencies in root.

**Analysis:**
```bash
# Check if root package.json is needed
cat package.json
```

**Options:**

1. **If it's a workspace root (monorepo):**
   - Keep `package.json`
   - Add to `.gitignore`: Already done ✅
   - Remove from git: See commands above

2. **If it's unnecessary:**
   - Delete `package.json` and `package-lock.json`
   - Run cleanup commands above

### Root .env

**Issue:** `.env` was created in root but also accidentally committed.

**Fix:**
- `.gitignore` now includes `.env` ✅
- Remove from Git tracking (see commands above)
- File stays local with your secrets

## Alternative: Complete History Rewrite (Advanced)

⚠️ **Warning:** Only use if you need to remove sensitive data from entire Git history.

### Using BFG Repo-Cleaner

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror git@github.com:solaar45/yappma-reload.git
cd yappma-reload.git

# Remove .env from all commits
bfg --delete-files .env

# Remove node_modules from all commits
bfg --delete-folders node_modules

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ DANGEROUS - rewrites history)
git push --force
```

### Using git filter-branch (Alternative)

```bash
# Remove .env from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Remove node_modules from all history  
git filter-branch --force --index-filter \
  "git rm -r --cached --ignore-unmatch node_modules" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push --force --all
```

## Recommended Action

**Use the Quick Fix** unless:
- `.env` contains highly sensitive production secrets
- Repository is public (it's not)
- You need to remove files from shared history

The Quick Fix is sufficient because:
- Repository is private
- Branch is a feature branch (not in production)
- Files will be immediately protected by `.gitignore`
- Future commits won't include these files

## After Cleanup

### Verify Everything Works

```bash
# Pull latest changes
git pull origin ux/simplified-institution-flow

# Verify node_modules is gone from git
ls -la | grep node_modules  # Should exist locally
git ls-files | grep node_modules  # Should return nothing

# Verify .env is protected
ls -la .env  # Should exist locally
git ls-files | grep .env  # Should return nothing (except .env.example)

# Test that everything still works
cd backend && mix phx.server &
cd frontend && npm run dev
```

## Prevention

✅ **Already Done:**
- Comprehensive `.gitignore` in root
- `.env.example` for template (safe to commit)
- Documentation in `ENV_SETUP.md`

🔮 **Future Steps:**
- Add pre-commit hook to prevent `.env` commits
- Add CI check for sensitive files
- Regular `.gitignore` audits

## Questions?

If unsure which approach to take, use the **Quick Fix**. It's safe, reversible, and sufficient for this situation.
