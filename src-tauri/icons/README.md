# Tauri Icon Generation

## Source Icon
All icons were generated from a single high-resolution source:
```
/Users/mattcarroll/Desktop/bookmark_assets/bookmark_mac_icons_v2/Icon-iOS-Default-1024x1024@1x.png
```

## Requirements
- **Bit Depth**: Tauri requires 8-bit PNG files. The source icons were 16-bit, which caused runtime errors.
- **Exact Dimensions**: Each icon must be exactly the pixel size specified in its filename.

## Generated Icons

### macOS
| File | Dimensions | Notes |
|------|------------|-------|
| `icon.icns` | Multiple | macOS app icon bundle (16-1024px) |
| `icon.png` | 512x512 | Main app icon |

### Windows
| File | Dimensions | Notes |
|------|------------|-------|
| `icon.ico` | Multiple | Windows icon bundle (16-256px) |
| `Square30x30Logo.png` | 30x30 | Windows tile |
| `Square44x44Logo.png` | 44x44 | Windows tile |
| `Square71x71Logo.png` | 71x71 | Windows tile |
| `Square89x89Logo.png` | 89x89 | Windows tile |
| `Square107x107Logo.png` | 107x107 | Windows tile |
| `Square142x142Logo.png` | 142x142 | Windows tile |
| `Square150x150Logo.png` | 150x150 | Windows tile |
| `Square284x284Logo.png` | 284x284 | Windows tile |
| `Square310x310Logo.png` | 310x310 | Windows tile |
| `StoreLogo.png` | 50x50 | Windows Store logo |

### Cross-platform
| File | Dimensions | Notes |
|------|------------|-------|
| `32x32.png` | 32x32 | Small icon |
| `64x64.png` | 64x64 | Medium icon |
| `128x128.png` | 128x128 | Large icon |
| `128x128@2x.png` | 256x256 | Retina large icon |

## Quick Regeneration

Use the included script to regenerate all icons from a new source:

```bash
./generate-icons.sh /path/to/your/1024x1024/icon.png
```

## Manual Regeneration Commands

If you need to regenerate icons manually, use ImageMagick:

```bash
# Install ImageMagick if needed
brew install imagemagick

# Set your source image
SRC="/path/to/your/1024x1024/icon.png"

# Generate PNGs (must be 8-bit depth!)
magick "$SRC" -resize 32x32 -depth 8 32x32.png
magick "$SRC" -resize 64x64 -depth 8 64x64.png
magick "$SRC" -resize 128x128 -depth 8 128x128.png
magick "$SRC" -resize 256x256 -depth 8 128x128@2x.png
magick "$SRC" -resize 512x512 -depth 8 icon.png

# Generate macOS .icns
mkdir -p icon.iconset
magick "$SRC" -resize 16x16 -depth 8 icon.iconset/icon_16x16.png
magick "$SRC" -resize 32x32 -depth 8 icon.iconset/icon_16x16@2x.png
magick "$SRC" -resize 32x32 -depth 8 icon.iconset/icon_32x32.png
magick "$SRC" -resize 64x64 -depth 8 icon.iconset/icon_32x32@2x.png
magick "$SRC" -resize 128x128 -depth 8 icon.iconset/icon_128x128.png
magick "$SRC" -resize 256x256 -depth 8 icon.iconset/icon_128x128@2x.png
magick "$SRC" -resize 256x256 -depth 8 icon.iconset/icon_256x256.png
magick "$SRC" -resize 512x512 -depth 8 icon.iconset/icon_256x256@2x.png
magick "$SRC" -resize 512x512 -depth 8 icon.iconset/icon_512x512.png
magick "$SRC" -resize 1024x1024 -depth 8 icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset

# Generate Windows .ico
magick "$SRC" -resize 16x16 -depth 8 ico_16.png
magick "$SRC" -resize 32x32 -depth 8 ico_32.png
magick "$SRC" -resize 48x48 -depth 8 ico_48.png
magick "$SRC" -resize 64x64 -depth 8 ico_64.png
magick "$SRC" -resize 128x128 -depth 8 ico_128.png
magick "$SRC" -resize 256x256 -depth 8 ico_256.png
magick ico_16.png ico_32.png ico_48.png ico_64.png ico_128.png ico_256.png icon.ico
rm ico_*.png

# Generate Windows Square logos
magick "$SRC" -resize 30x30 -depth 8 Square30x30Logo.png
magick "$SRC" -resize 44x44 -depth 8 Square44x44Logo.png
magick "$SRC" -resize 71x71 -depth 8 Square71x71Logo.png
magick "$SRC" -resize 89x89 -depth 8 Square89x89Logo.png
magick "$SRC" -resize 107x107 -depth 8 Square107x107Logo.png
magick "$SRC" -resize 142x142 -depth 8 Square142x142Logo.png
magick "$SRC" -resize 150x150 -depth 8 Square150x150Logo.png
magick "$SRC" -resize 284x284 -depth 8 Square284x284Logo.png
magick "$SRC" -resize 310x310 -depth 8 Square310x310Logo.png
magick "$SRC" -resize 50x50 -depth 8 StoreLogo.png
```

## Troubleshooting

### "invalid icon: dimensions don't match pixels"
This error means the PNG has 16-bit color depth. Always use `-depth 8` when generating icons.

To check an icon's bit depth:
```bash
magick identify -verbose icon.png | grep Depth
```

### macOS shows old icon after regeneration
Clear the icon cache:
1. Delete `src-tauri/target` folder
2. Rebuild the app
3. If still cached, restart Finder: `killall Finder`

