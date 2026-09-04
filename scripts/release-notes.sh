#!/usr/bin/env bash
# Composes the body of a release note from the commits since the previous tag.
#
#   scripts/release-notes.sh v1.1.0          # notes for v1.1.0
#   scripts/release-notes.sh v1.1.0 v1.0.0   # ...against an explicit previous tag
#
# Why not `gh release create --generate-notes`: GitHub's automatic notes group by
# PULL REQUEST LABEL, and this repository does not label its PRs. What it does have
# is Conventional Commit subjects on every commit, so the grouping is derived from
# those instead - the same information, actually present.
#
# Only the subject line is used. Commit bodies in this project explain reasoning at
# a length that belongs in the commit, not in a release note; anyone who wants it
# follows the hash.
set -euo pipefail

tag=${1:?usage: release-notes.sh <new-tag> [previous-tag]}

# `|| true` matters: with no tags yet, grep exits 1 on empty input and `set -e`
# would kill the script before it printed anything.
previous=${2:-$(git tag -l 'v*' --sort=-v:refname | grep -v "^${tag}$" || true)}
previous=$(printf '%s
' "$previous" | head -1)

if [ -n "$previous" ]; then
  range="$previous..HEAD"
else
  range="HEAD"
fi

# type -> heading, in the order they should appear
sections="feat:What's new
fix:Fixes
perf:Performance
refactor:Internals
test:Tests
docs:Documentation
build:Build and tooling
ci:Build and tooling
chore:Build and tooling"

# Breaking changes first: a reader deciding whether to upgrade should not have to
# scroll for them.
breaking=$(git log --no-merges --pretty='%s%x09%h' "$range" |
  grep -E '^[a-z]+(\([^)]*\))?!:' || true)
if [ -n "$breaking" ]; then
  printf '### Breaking changes\n\n'
  printf '%s\n' "$breaking" | while IFS=$'\t' read -r subject hash; do
    printf -- '- %s (%s)\n' "${subject}" "$hash"
  done
  printf '\n'
  emitted_breaking=true
fi

seen_heading=""
printf '%s\n' "$sections" | while IFS=: read -r type heading; do
  lines=$(git log --no-merges --pretty='%s%x09%h' "$range" |
    grep -E "^${type}(\([^)]*\))?:" || true)
  [ -z "$lines" ] && continue

  # build/ci/chore share one heading. The blank line goes BEFORE a new heading
  # rather than after every type, or those three leave a gap in the middle of
  # their own list.
  if [ "$heading" != "$seen_heading" ]; then
    [ -n "$seen_heading" ] && printf '\n'
    printf '### %s\n\n' "$heading"
    seen_heading=$heading
  fi
  printf '%s\n' "$lines" | while IFS=$'\t' read -r subject hash; do
    # drop the type prefix - the heading already said it, and "feat(core): x"
    # reads better as "core: x"
    text=${subject#*: }
    scope=$(printf '%s' "$subject" | sed -nE 's/^[a-z]+\(([^)]*)\).*/\1/p')
    if [ -n "$scope" ]; then
      printf -- '- **%s**: %s (%s)\n' "$scope" "$text" "$hash"
    else
      printf -- '- %s (%s)\n' "$text" "$hash"
    fi
  done
done
printf '\n'

# Anything that is not a Conventional Commit at all. Listed rather than dropped:
# silently swallowing commits is how a release note starts lying.
other=$(git log --no-merges --pretty='%s%x09%h' "$range" |
  grep -vE '^[a-z]+(\([^)]*\))?!?:' || true)
if [ -n "$other" ]; then
  printf '### Other\n\n'
  printf '%s\n' "$other" | while IFS=$'\t' read -r subject hash; do
    printf -- '- %s (%s)\n' "$subject" "$hash"
  done
  printf '\n'
fi

repo=${GITHUB_REPOSITORY:-LeVanAnhDuc/web-game-solitaire}
if [ -n "$previous" ]; then
  printf -- '---\n\n[All changes](https://github.com/%s/compare/%s...%s)\n' \
    "$repo" "$previous" "$tag"
else
  printf -- '---\n\n[All changes](https://github.com/%s/commits/%s)\n' "$repo" "$tag"
fi
