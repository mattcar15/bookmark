#!/bin/bash

# Tauri Icon Generator
# Usage: ./generate-icons.sh /path/to/icons-folder
#
# Expects a folder with iOS-style icons named like:
#   Icon-iOS-Default-1024x1024@1x.png
#   Icon-iOS-Default-512x512@1x.png
#   Icon-iOS-Default-256x256@1x.png
#   etc.

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/icons-folder"
    echo ""
    echo "Expects a folder with iOS-style icons (Icon-iOS-Default-*)"
    exit 1
fi

SRC_DIR="$1"

if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Source directory not found: $SRC_DIR"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is required. Install with: brew install imagemagick"
    exit 1
fi

# Find the icon prefix (e.g., "Icon-iOS-Default" or "bookmark_mac_icon-iOS-Dark")
PREFIX=$(ls "$SRC_DIR"/*-1024x1024@1x.png 2>/dev/null | head -1 | xargs basename | sed 's/-1024x1024@1x.png//')

if [ -z "$PREFIX" ]; then
    echo "Error: Could not find *-1024x1024@1x.png in $SRC_DIR"
    exit 1
fi

echo "Found icon prefix: $PREFIX"

# Helper function to get source file, with fallback to 1024 and resize
get_source() {
    local size=$1
    local scale=$2
    local file="$SRC_DIR/${PREFIX}-${size}@${scale}.png"
    if [ -f "$file" ]; then
        echo "$file"
    else
        echo "$SRC_DIR/${PREFIX}-1024x1024@1x.png"
    fi
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

MAIN_SRC="$SRC_DIR/${PREFIX}-1024x1024@1x.png"

echo "Generating Tauri icons from: $SRC_DIR"
echo ""

# Generate standard PNGs
echo "Generating PNGs..."
magick "$(get_source 32x32 1x)" -resize 32x32 -depth 8 32x32.png
magick "$(get_source 64x64 1x)" -resize 64x64 -depth 8 64x64.png
magick "$(get_source 128x128 1x)" -resize 128x128 -depth 8 128x128.png
magick "$(get_source 256x256 1x)" -resize 256x256 -depth 8 128x128@2x.png
magick "$(get_source 512x512 1x)" -resize 512x512 -depth 8 icon.png

# Generate Windows Square logos
echo "Generating Windows logos..."
magick "$MAIN_SRC" -resize 30x30 -depth 8 Square30x30Logo.png
magick "$MAIN_SRC" -resize 44x44 -depth 8 Square44x44Logo.png
magick "$MAIN_SRC" -resize 71x71 -depth 8 Square71x71Logo.png
magick "$MAIN_SRC" -resize 89x89 -depth 8 Square89x89Logo.png
magick "$MAIN_SRC" -resize 107x107 -depth 8 Square107x107Logo.png
magick "$MAIN_SRC" -resize 142x142 -depth 8 Square142x142Logo.png
magick "$MAIN_SRC" -resize 150x150 -depth 8 Square150x150Logo.png
magick "$MAIN_SRC" -resize 284x284 -depth 8 Square284x284Logo.png
magick "$MAIN_SRC" -resize 310x310 -depth 8 Square310x310Logo.png
magick "$MAIN_SRC" -resize 50x50 -depth 8 StoreLogo.png

# Generate macOS .icns
echo "Generating macOS icon..."
mkdir -p icon.iconset
magick "$(get_source 16x16 1x)" -resize 16x16 -depth 8 icon.iconset/icon_16x16.png
magick "$(get_source 16x16 2x)" -resize 32x32 -depth 8 icon.iconset/icon_16x16@2x.png
magick "$(get_source 32x32 1x)" -resize 32x32 -depth 8 icon.iconset/icon_32x32.png
magick "$(get_source 32x32 2x)" -resize 64x64 -depth 8 icon.iconset/icon_32x32@2x.png
magick "$(get_source 128x128 1x)" -resize 128x128 -depth 8 icon.iconset/icon_128x128.png
magick "$(get_source 128x128 2x)" -resize 256x256 -depth 8 icon.iconset/icon_128x128@2x.png
magick "$(get_source 256x256 1x)" -resize 256x256 -depth 8 icon.iconset/icon_256x256.png
magick "$(get_source 256x256 2x)" -resize 512x512 -depth 8 icon.iconset/icon_256x256@2x.png
magick "$(get_source 512x512 1x)" -resize 512x512 -depth 8 icon.iconset/icon_512x512.png
magick "$(get_source 1024x1024 1x)" -resize 1024x1024 -depth 8 icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset

# Generate Windows .ico
echo "Generating Windows icon..."
magick "$(get_source 16x16 1x)" -resize 16x16 -depth 8 ico_16.png
magick "$(get_source 32x32 1x)" -resize 32x32 -depth 8 ico_32.png
magick "$MAIN_SRC" -resize 48x48 -depth 8 ico_48.png
magick "$(get_source 64x64 1x)" -resize 64x64 -depth 8 ico_64.png
magick "$(get_source 128x128 1x)" -resize 128x128 -depth 8 ico_128.png
magick "$(get_source 256x256 1x)" -resize 256x256 -depth 8 ico_256.png
magick ico_16.png ico_32.png ico_48.png ico_64.png ico_128.png ico_256.png icon.ico
rm ico_*.png

echo ""
echo "Done! All icons generated."
echo ""
echo "Remember to rebuild your Tauri app to see the new icons."
