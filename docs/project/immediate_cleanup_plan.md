# Immediate Cleanup Implementation Plan

## Task 1: Remove Large Binary Files from Repository

### Objective
Remove awscliv2.zip and bin/yq from the git repository to reduce repository size and improve cloning speed.

### Files to Remove
1. awscliv2.zip (62MB) - AWS CLI installer
2. bin/yq (9.6MB) - Binary executable

### Implementation Steps

1. Create a new branch for cleanup work:
   ```bash
   git checkout -b cleanup-large-files
   ```

2. Remove files from git repository:
   ```bash
   git rm --cached awscliv2.zip bin/yq
   ```

3. Commit the removal:
   ```bash
   git commit -m "chore: remove large binary files from repository"
   ```

## Task 2: Update .gitignore

### Objective
Prevent large binary files from being committed to the repository in the future.

### Implementation Steps

1. Add patterns to .gitignore:
   ```
   # AWS CLI
   awscliv2.zip
   aws/dist/
   
   # Binaries
   bin/yq
   *.exe
   *.dll
   *.so
   *.dylib
   ```

2. Commit the .gitignore update:
   ```bash
   git commit -am "chore: update .gitignore to prevent binary file commits"
   ```

## Task 3: Document Proper Installation Methods

### Objective
Ensure team members know how to properly install required tools instead of using committed binaries.

### Implementation Steps

1. Update documentation to include installation instructions:
   - For yq: `curl -fsSL https://github.com/mikefarah/yq/releases/download/v4.44.3/yq_linux_amd64 -o /usr/local/bin/yq && chmod +x /usr/local/bin/yq`
   - For AWS CLI: Follow official AWS installation guide

2. Update README or appropriate documentation files with installation instructions.

3. Commit documentation updates:
   ```bash
   git commit -am "docs: add installation instructions for required tools"
   ```

## Task 4: Address Documentation Issues

### Objective
Complete or remove TODO comments in documentation files.

### Files to Address
1. edge/Caddyfile - TODO comment about HMAC validation
2. edge/README.md - Incomplete documentation

### Implementation Steps

1. Review edge service implementation to understand HMAC validation:
   - Check if application-level validation is sufficient
   - Determine if Caddyfile validation is needed

2. Update or remove TODO comment in edge/Caddyfile.

3. Complete edge/README.md documentation.

4. Commit documentation updates:
   ```bash
   git commit -am "docs: complete edge service documentation"
   ```

## Task 5: Verify Changes

### Objective
Ensure all changes work correctly and don't break existing functionality.

### Implementation Steps

1. Verify that all services can still be built and run:
   ```bash
   make install
   make build
   ```

2. Test CI workflows to ensure they still function correctly.

3. Verify that removed files are properly ignored.

## Task 6: Create Pull Request

### Objective
Submit changes for review and approval.

### Implementation Steps

1. Push changes to remote repository:
   ```bash
   git push origin cleanup-large-files
   ```

2. Create pull request with detailed description of changes.

3. Request review from team members.

## Rollback Plan

If issues are discovered after merging:

1. Revert the commits:
   ```bash
   git revert <commit-hash>
   ```

2. If necessary, restore the binary files (though this should be avoided).

3. Document the issue and implement a proper fix.

## Success Criteria

1. Repository size is reduced by approximately 71MB
2. Large binary files are no longer tracked by git
3. .gitignore properly prevents future binary commits
4. All services continue to build and function correctly
5. Documentation is complete and accurate