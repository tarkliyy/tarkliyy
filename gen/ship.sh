#!/usr/bin/env bash
set -euo pipefail

remote=${GIT_REMOTE:-origin}
branch=${CARD_BRANCH:-card}
root=$(pwd)
src=$root/out/neofetch.svg

[ -s "$src" ] || { echo "ship: $src missing or empty" >&2; exit 1; }

tmp=$(mktemp -d)
lb=""
trap 'cd "$root"; git worktree remove --force "$tmp/wt" 2>/dev/null || true; [ -z "$lb" ] || git branch -D "$lb" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

if git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null 2>&1; then
  git fetch -q --depth=1 "$remote" "$branch"
  git worktree add -q --detach "$tmp/wt" FETCH_HEAD
else
  lb=card-new-$$
  git worktree add -q --orphan -b "$lb" "$tmp/wt"
fi

cp "$src" "$tmp/wt/neofetch.svg"
cd "$tmp/wt"
git add neofetch.svg

if git diff --cached --quiet; then
  echo "ship: card unchanged"
  exit 0
fi

git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" commit -q -m "chore: refresh card"
git push -q "$remote" "HEAD:refs/heads/$branch"
echo "ship: pushed $branch"
