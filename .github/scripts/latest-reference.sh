#!/usr/bin/env bash
# Prints the URL of the ShapeMap report that https://shex.io/shape-map/ serves: the dated
# report the symlink www/shape-map of shexSpec/shex.io points to.
set -euo pipefail

target=$(curl -fsSL https://raw.githubusercontent.com/shexSpec/shex.io/master/www/shape-map)
if ! [[ $target =~ ^shape-map-[0-9]{8}$ ]]; then
  echo "unexpected target of www/shape-map in shexSpec/shex.io: $target" >&2
  exit 1
fi
echo "https://shex.io/$target/"
