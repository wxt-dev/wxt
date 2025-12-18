#!/bin/bash
set -e

#
# Benchmark how long it takes for the browser to open in dev mode.
#
# To run:
#   cd <root>
#   ./scripts/benchmarks/browser-startup.sh
#
# You can set N below to change the number of samples per git ref.
#

N=20

function benchmark_ref() {
    # Prep
    git checkout $1
    bun run buildc clean
    git apply scripts/benchmarks/browser-startup.patch
    bun install --ignore-scripts
    bun run --cwd packages/wxt build
    echo -n "$1 " >> stats.txt

    # Run benchmark
    for i in $(seq $N); do
        bun wxt packages/wxt-demo
    done
    git checkout HEAD -- packages/wxt/src/core/runners/web-ext.ts bun.lock
    echo "" >> stats.txt
}

rm -f stats.txt

benchmark_ref "HEAD"

# Benchmark a commit:
#   benchmark_ref "3109bba"
#
# Benchmark a version:
#   benchmark_ref "v0.19.0"
