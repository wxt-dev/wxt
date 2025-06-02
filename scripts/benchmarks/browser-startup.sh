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
    pnpm buildc clean
    git apply scripts/benchmarks/browser-startup.patch
    pnpm i --ignore-scripts
    pnpm -r --filter wxt build
    echo -n "$1 " >> stats.txt

    # Run benchmark
    for i in $(seq $N); do
        pnpm wxt packages/wxt-demo
    done
    git checkout HEAD -- packages/wxt/src/core/runners/wxt.ts pnpm-lock.yaml
    echo "" >> stats.txt
}

rm -f stats.txt

benchmark_ref "HEAD"
# benchmark_ref "..."

# Benchmark a commit:
#   benchmark_ref "3109bba"
#
# Benchmark a version:
#   benchmark_ref "v0.19.0"
