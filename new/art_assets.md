# Art Assets List

This document lists all static art assets found in the codebase that may need to be replaced with CDN URLs.

## PNG Files
- `public/assets/images/logo.png` (Used in `WelcomeScreen.tsx` - **Already Replaced**)

## Referenced but Missing (Likely from Design Doc)
- `/assets/scanlines.png` (Referenced in `new/题材改版初稿.md` example code, but implemented via CSS in `CRTOverlay.tsx`)
- `pwa-192x192.png` (Referenced in PWA config in `new/题材改版初稿.md`)
- `pwa-512x512.png` (Referenced in PWA config in `new/题材改版初稿.md`)

## Other Notes
- `CRTOverlay.tsx` uses CSS gradients for scanlines, so no image asset is required for that effect.
- The build error "Unexpected else" in `randomService.ts` has been fixed.
