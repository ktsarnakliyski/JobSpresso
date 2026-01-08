# Replace img with Next.js Image Component and Optimize Logo

## Objective
Replace the `<img>` tag with Next.js `<Image>` component for automatic image optimization. The current logo.png is 699KB but displayed at only ~36px height - this is a significant performance issue.

## Files to Modify
- `frontend/src/components/Layout.tsx`

## Implementation Details

### 1. Update Layout.tsx imports
Add the Image import at the top:
```typescript
import Image from 'next/image';
```

### 2. Replace the img tag (lines 32-36)
Replace:
```tsx
<img
  src="/logo.png"
  alt="JobSpresso"
  className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
/>
```

With:
```tsx
<Image
  src="/logo.png"
  alt="JobSpresso"
  width={144}
  height={36}
  priority
  className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
/>
```

### 3. Understanding the dimensions
- Current logo.png: 2144 x 684 pixels (aspect ratio ~3.13:1)
- Display size: h-9 = 36px height
- Calculated width: 36 * 3.13 ≈ 113px, but using 144px for retina
- Using `priority` because it's above the fold in the header

### 4. Optional: Update next.config.mjs for better optimization
In `frontend/next.config.mjs`, enhance the config:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

## Acceptance Criteria
- [ ] Logo displays correctly at same visual size
- [ ] No layout shift when logo loads
- [ ] Logo loads with priority (no lazy loading)
- [ ] Hover effect still works
- [ ] Image is served in optimized format (WebP/AVIF)
- [ ] Build succeeds without warnings

## Testing
1. Run `npm run build` in frontend - should succeed
2. Run `npm run dev` and check /
3. Logo should appear same size as before
4. Open DevTools Network tab - image should be much smaller
5. Hover over logo - scale effect should still work
6. Check Elements tab - should see optimized srcset

## Notes
- The `width` and `height` props prevent layout shift (CLS)
- `priority` disables lazy loading for above-fold images
- Next.js will automatically serve WebP/AVIF to supported browsers
- The original 699KB file will be compressed to ~20-40KB

## Future Consideration
The logo files in /public are oversized:
- logo-original.png: 4.7MB (can be deleted if unused)
- logo.png: 699KB (Next.js handles optimization)
- favicon-icon.png: 413KB (should be optimized separately)

Consider creating properly sized source images in the future.
