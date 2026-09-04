#!/usr/bin/env bash
# Prints the tag the next release should carry, or nothing at all when there
# should not be one.
#
# Lives here rather than inside the workflow so it can be run against the real
# history on a laptop - a version scheme you can only exercise by pushing to main
# is a version scheme nobody checks.
#
#   scripts/next-version.sh            # decide for HEAD
#   scripts/next-version.sh --explain  # and say why, on stderr
#
# Exit 0 with empty output means "no release": either HEAD is already tagged (a
# re-run) or its subject carries [skip release].
set -euo pipefail

explain=false
[ "${1:-}" = "--explain" ] && explain=true
say() { $explain && printf '%s\n' "$1" >&2 || true; }

subject=$(git log -1 --pretty=%s)

# The manual markers are honoured only in the HEAD commit SUBJECT. A body that
# merely mentions them - a changelog, a doc about this very file - must not
# trigger a major bump.
if printf '%s' "$subject" | grep -qiF '[skip release]'; then
  say "skipped: HEAD subject carries [skip release]"
  exit 0
fi

if [ -n "$(git tag --points-at HEAD -l 'v*')" ]; then
  say "skipped: HEAD is already released as $(git tag --points-at HEAD -l 'v*' | head -1)"
  exit 0
fi

latest=$(git tag -l 'v*' --sort=-v:refname | head -1)

if [ -z "$latest" ]; then
  # First release. v1.0.0 rather than v0.1.0: the game is playable, and a 0.x
  # would only invite the question of what 1.0 is waiting for.
  say "first release, no previous v* tag"
  printf 'v1.0.0\n'
  exit 0
fi

IFS=. read -r major minor patch <<<"${latest#v}"
range="$latest..HEAD"

if printf '%s' "$subject" | grep -qiF '[release major]'; then
  bump=major
  say "major: HEAD subject carries [release major]"
elif printf '%s' "$subject" | grep -qiF '[release minor]'; then
  bump=minor
  say "minor: HEAD subject carries [release minor]"
elif git log --no-merges --pretty=%s "$range" | grep -qE '^[a-z]+(\([^)]*\))?!:' ||
  git log --no-merges --pretty=%B "$range" | grep -q '^BREAKING CHANGE'; then
  bump=major
  say "major: a commit since $latest is marked breaking"
elif git log --no-merges --pretty=%s "$range" | grep -qE '^feat(\([^)]*\))?:'; then
  bump=minor
  say "minor: a feat: commit since $latest"
else
  bump=patch
  say "patch: nothing since $latest claims more"
fi

case "$bump" in
major) printf 'v%s.0.0\n' "$((major + 1))" ;;
minor) printf 'v%s.%s.0\n' "$major" "$((minor + 1))" ;;
patch) printf 'v%s.%s.%s\n' "$major" "$minor" "$((patch + 1))" ;;
esac
