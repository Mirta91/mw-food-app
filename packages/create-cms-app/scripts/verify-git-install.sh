#!/bin/sh
# Verifies that the committed bundle runs through npx and pnpm dlx from a git URL, and that a git
# install packs only the bundle. Uses a bare clone of HEAD, so commit before running.
set -eu
repo_root=$(git rev-parse --show-toplevel)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone --quiet --bare "$repo_root" "$work/repo.git"
url="git+file://$work/repo.git"
hooks_before=$(git -C "$repo_root" config --get core.hooksPath || true)

expect_tty_error() {
  label=$1
  shift
  if out=$("$@" </dev/null 2>&1); then
    echo "FAIL $label: exited 0"
    exit 1
  fi
  case $out in
    *"needs an interactive terminal"*) echo "ok   $label" ;;
    *) echo "FAIL $label:" && echo "$out" && exit 1 ;;
  esac
}

cd "$work"
expect_tty_error "npx" npx --yes "$url"
expect_tty_error "pnpm dlx" pnpm dlx "$url"

mkdir install && cd install
npm init -y >/dev/null
npm install --no-audit --no-fund "$url" >/dev/null
pkg=node_modules/cms-hackathon-setup
test -x "$pkg/packages/create-cms-app/dist/cli.mjs" || { echo "FAIL bundle missing or not executable"; exit 1; }
extra=$(ls node_modules | grep -v -e '^cms-hackathon-setup$' -e '^\.' || true)
test -z "$extra" || { echo "FAIL npm installed other packages: $extra"; exit 1; }
for file in ${VERIFY_TEMPLATE_FILES:-}; do
  test -e "$pkg/packages/create-cms-app/dist/templates/$file" || { echo "FAIL template file not packed: $file"; exit 1; }
done
echo "ok   npm install packs only the bundle"

hooks_after=$(git -C "$repo_root" config --get core.hooksPath || true)
test "$hooks_before" = "$hooks_after" || { echo "FAIL core.hooksPath changed"; exit 1; }
echo "ok   git config untouched"
