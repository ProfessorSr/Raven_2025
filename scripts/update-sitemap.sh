#
//  update-sitemap.sh
//  
//
//  Created by Calvin Fowler on 10/28/25.
//


#!/usr/bin/env bash
#
# Rebuilds SITEMAP.md with a full repository tree.
# Excludes heavy or system folders (node_modules, .git, .next, __MACOSX).
# Keeps the condensed placeholders for omitted directories.
# Usage: bash scripts/update-sitemap.sh

set -e

OUTPUT_FILE="SITEMAP.md"
PROJECT_NAME=$(basename "$(pwd)")

echo "# ${PROJECT_NAME} Repository Structure" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

# Print the directory tree, excluding specific folders
tree -a -I "node_modules|.git|.next|__MACOSX" \
  --dirsfirst \
  --noreport >> "$OUTPUT_FILE"

# Add condensed placeholder notes for excluded folders
echo "├── node_modules/ (... many files omitted)" >> "$OUTPUT_FILE"
echo "├── .git/ (... internal git data omitted)" >> "$OUTPUT_FILE"
echo "├── .next/ (... build artifacts omitted)" >> "$OUTPUT_FILE"

echo '```' >> "$OUTPUT_FILE"

echo "✅ SITEMAP.md updated successfully."