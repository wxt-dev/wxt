#!/bin/bash

set -e

PACKAGES_DIR="./packages"
export GIT_PAGER=cat
IGNORED_DIRS=("browser" "wxt-demo")

if [ ! -d "$PACKAGES_DIR" ]; then
    echo "Error: Directory '$PACKAGES_DIR' not found."
    exit 1
fi

echo "Checking for changes in packages since their last tag..."
echo ""

for dir in "$PACKAGES_DIR"/*; do
    if [ -d "$dir" ]; then
        pkg_name=$(basename "$dir")

        # Check if the package name is in the ignored directories list
        if [[ " ${IGNORED_DIRS[*]} " =~ " $pkg_name " ]]; then
            echo "Skipping ignored package: $pkg_name"
            continue # Skip to the next directory
        fi

        echo "----------------------------------------"
        echo "Package: $pkg_name"

        # Find the latest tag for the package, e.g., "my-package-v1.2.3"
        # Sorts tags by version and picks the most recent one.
        last_tag=$(git tag --list "${pkg_name}-v*" --sort=-v:refname | head -n 1)

        if [ -n "$last_tag" ]; then
            # If a tag is found, show commits since that tag for the specific package directory
            echo "Commits since last tag ($last_tag):"
            git log "${last_tag}..HEAD" --oneline -- "$dir"
        else
            # If no tag is found, show all commits for that package directory
            echo "No tags found for this package. Listing all commits:"
            git log --oneline -- "$dir"
        fi
        echo ""
    fi
done
