# Repository Cleanup Plan

## Issues Identified

1. **Large Binary Files**:
   - `awscliv2.zip` (62MB) - AWS CLI installer that shouldn't be in the repository
   - `bin/yq` (9.6MB) - Binary executable that should be installed via package manager
   - `aws/dist/` directory with compiled binaries

2. **Unnecessary Files**:
   - TODO comment in `edge/Caddyfile` about HMAC validation
   - Incomplete documentation in `edge/README.md`

3. **Git Ignore Issues**:
   - Some files that should be ignored are not properly ignored

## Cleanup Actions

### 1. Remove Large Binary Files
- Remove `awscliv2.zip` from repository
- Remove `bin/yq` from repository
- Remove `aws/dist/` directory from repository
- Update `.gitignore` to prevent these files from being committed

### 2. Update Documentation
- Complete the TODO in `edge/Caddyfile` or remove it
- Update `edge/README.md` to reflect current implementation

### 3. Improve .gitignore
- Add patterns to ignore AWS CLI binaries and other unnecessary files

### 4. Verify CI/CD Workflows
- Ensure all workflows are functioning correctly after cleanup

## Implementation Steps

1. Create backup branch
2. Remove large files from git history
3. Update .gitignore
4. Fix documentation issues
5. Verify all services still work correctly
6. Commit changes with clear message