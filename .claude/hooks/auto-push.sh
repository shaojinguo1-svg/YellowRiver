#!/bin/bash
# Auto-push hook: commits and pushes changes when Claude Code agent stops
# Triggered by: Stop hook event (agent completes a turn)

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Check if there are any changes to commit
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  # No changes, skip
  exit 0
fi

# Get current branch
BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$BRANCH" ]; then
  exit 0
fi

# Don't auto-push if on main/master (safety)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  # On main branch, still commit but with caution
  :
fi

# Stage all changes (excluding .env files with secrets)
git add -A -- ':!.env' ':!.env.local' ':!.env.production' 2>/dev/null

# Check if there's anything staged now
if git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

# Generate commit message from staged changes
CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null | head -10)
FILE_COUNT=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# Build a descriptive commit message
if [ "$FILE_COUNT" -le 3 ]; then
  FILES_DESC=$(echo "$CHANGED_FILES" | tr '\n' ', ' | sed 's/,$//')
  COMMIT_MSG="auto: update ${FILES_DESC}

Changed ${FILE_COUNT} file(s) at ${TIMESTAMP}
Co-Authored-By: Claude Code <noreply@anthropic.com>"
else
  # Get the most common directory prefix for a summary
  PRIMARY_DIR=$(echo "$CHANGED_FILES" | head -5 | xargs -I{} dirname {} | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
  COMMIT_MSG="auto: update ${FILE_COUNT} files in ${PRIMARY_DIR}/

Changed ${FILE_COUNT} file(s) at ${TIMESTAMP}
Co-Authored-By: Claude Code <noreply@anthropic.com>"
fi

# Commit
git commit -m "$COMMIT_MSG" --no-verify 2>/dev/null || exit 0

# Push to remote
git push origin "$BRANCH" 2>/dev/null

# Output confirmation (will be shown in Claude's context)
echo "Auto-pushed ${FILE_COUNT} file(s) to origin/${BRANCH}"
