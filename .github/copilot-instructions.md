# Regalbuto Heritage - Copilot Instructions

## Project Overview
This is a static HTML/CSS/JavaScript tourism app for Regalbuto, Sicily, designed to run in WebView containers on mobile devices. It features interactive maps, 360° VR panoramas, monument guides, and educational content - all without requiring a backend server.

## Architecture & Core Components

### Single-Page Application Structure
- **Main app**: `index.html` with tab-based navigation using `switchTab()` function
- **Panorama viewer**: `panoramas/panorama.html` - standalone A-Frame VR viewer for 360° images
- **Monument data**: `data/monuments.json` - central data source with coordinates, images, history
- **Static assets**: `src/imgs/` (360° and flat images), `src/docs/` (PDFs), `src/audio/` (guides)

### Key Patterns & Conventions

#### Tab Navigation System
```javascript
// All sections managed via data-tab attributes and switchTab() function
switchTab('monumenti') // Switches to monuments section
// Bottom nav buttons use onclick="switchTab('section')" data-tab="section"
```

#### Monument Card Components
- Use `.monument-card` class with `data-category` attributes for filtering
- Categories: `religioso`, `natura`, `cultura`, `sport`, `tecnologia`
- Filter system maps categories (e.g., `sport` includes both `sport` and `svago`)

#### VR/Panorama Integration
- 360° images stored in `src/imgs/360/` as JPG files
- Panorama viewer called via: `panoramas/panorama.html?img=../src/imgs/360/filename.JPG`
- Uses A-Frame framework for WebVR/VR headset support
- Device detection logic hides VR buttons on iPhones (WebXR limitations)

#### Data-Driven Content
- Monument details in `data/monuments.json` include:
  - GPS coordinates for map integration
  - Multiple image formats (360° and flat)
  - Audio guide metadata
  - Historical timeline data
  - Categories: (church, convent, etc.)
- MapLibre GL JS for GPS navigation and route tracking
- Font Awesome icons for monument categories

### Mobile-First Development

#### CSS Architecture
- CSS custom properties in `:root` for consistent theming
- Mobile-first responsive design with bottom navigation
- Classes: `.hero-section`, `.featured-card`, `.monument-card`, `.filter-tab`

#### Touch & Mobile Optimizations
- `ontouchstart` events for iOS compatibility
- WebView-specific handling for camera/QR scanning
- Responsive images with `srcset` for performance

### Key Functions & Entry Points

#### Navigation & State Management
- `switchTab(tabName)` - Primary navigation controller
- `filterMonuments()` - Search and category filtering
- `filterByCategory(category)` - Category-based monument filtering

#### Interactive Features
- `startQRScanner()` - QR code scanning for monuments
- `playAudioGuide(monumentId)` - Audio guide playback
- `openVirtualTour(imageFile)` - Launch 360° panorama viewer
- `initializeGPSMap()` - MapLibre GL JS GPS map setup for itinerary navigation

#### Content Management
- Monument data loaded from JSON, no dynamic API calls
- Images organized by type: `360/` for panoramas, `flat/` for standard photos
- Audio guides referenced by ID in monuments JSON

### Development Guidelines

#### Adding New Monuments
1. Add entry to `data/monuments.json` with required fields
2. Add 360° images to `src/imgs/360/` and flat images to `src/imgs/flat/`
3. Monument cards auto-generate from JSON data structure

#### Styling Conventions
- Use CSS custom properties from `:root` for colors
- Follow `.monument-card`, `.featured-card` component patterns
- Maintain mobile-first responsive approach

#### Testing & Compatibility
- Test VR features across devices (use `test-iphone.html` for device detection)
- Verify QR scanner functionality in WebView contexts
- Check map marker clustering and performance with large datasets

### External Dependencies
- **MapLibre GL JS**: GPS navigation, interactive maps and route tracking
- **A-Frame**: WebVR/360° panorama rendering
- **Feather Icons**: Consistent iconography for app navigation and UI elements
- **Font Awesome**: Category-specific icons for monument categories and map tooltips
- **Marzipano**: Alternative panorama viewer (imported but primarily uses A-Frame)
- **html5-qrcode**: QR code scanning functionality

### Icon Usage Guidelines
- **Feather Icons**: Used for general app navigation (bottom nav, header buttons, search, etc.)
- **Font Awesome**: Used specifically for monument categories and GPS map features:
  - GPS map tooltips: Action icons (headphones, map-marker, VR cardboard, navigation)
  - Monument categories from JSON: `monuments.json`

### File Organization
- Keep 360° images under 2MB for mobile performance
- Audio files should be MP3 format for broad compatibility
- PDFs in `src/docs/` for downloadable heritage documentation
- Use semantic naming: `chiesa-smaria-ingresso.JPG` for church interior entrance view

## Code Execution
Usa sempre windows subsystem for Linux (WSL) per eseguire il codice.

## Code example and documetation
Use context7 to get up-to-date, version-specific documentation and code examples from any library or framework