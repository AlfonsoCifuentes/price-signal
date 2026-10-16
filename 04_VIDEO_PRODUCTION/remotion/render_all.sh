#!/usr/bin/env bash
# Render the four videos (H.264 + AAC) to ../renders, then master loudness into ../final.
set -e
cd "$(dirname "$0")"
for pair in "HorizontalEs:horizontal-es" "HorizontalEn:horizontal-en" "VerticalEs:vertical-es" "VerticalEn:vertical-en"; do
  comp=${pair%%:*}; name=${pair##*:}
  npx remotion render src/index.ts "$comp" "../renders/pricing-demo-$name.mp4" --codec h264 --crf 18 --pixel-format yuv420p \
    --color-space=bt709 --audio-codec aac --audio-bitrate 192k --log=error
  echo "rendered $name"
done
