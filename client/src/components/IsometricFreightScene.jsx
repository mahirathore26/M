import React from 'react';

/**
 * IsometricFreightScene
 * Custom, self-contained SVG illustration depicting an Indian intermodal freight terminal.
 * Features:
 *  - High-precision 30-degree isometric projection
 *  - Stacked 20FT and 32FT containers in brand cobalt, navy, and accent electric cyan
 *  - Commercial multi-axle freight container truck on terminal transit lane
 *  - Concrete freight apron with lane markers and cargo pallets
 *  - Consistent top-left illumination and soft isometric cast shadows
 */
export default function IsometricFreightScene({ className = '' }) {
  return (
    <svg
      viewBox="0 0 880 580"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Isometric illustration of freight truck and container terminal"
    >
      <defs>
        {/* Sky / Ambient Backing Gradient */}
        <radialGradient id="terminalGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#EAF7FC" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#EAF7FC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EAF7FC" stopOpacity="0" />
        </radialGradient>

        {/* Cobalt Container Gradients */}
        <linearGradient id="cobaltTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A8BF7" />
          <stop offset="100%" stopColor="#2E72E5" />
        </linearGradient>
        <linearGradient id="cobaltLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2764D9" />
          <stop offset="100%" stopColor="#1E52B6" />
        </linearGradient>
        <linearGradient id="cobaltRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#17449E" />
          <stop offset="100%" stopColor="#102F70" />
        </linearGradient>

        {/* Deep Navy Container Gradients */}
        <linearGradient id="navyTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#263673" />
          <stop offset="100%" stopColor="#1B2655" />
        </linearGradient>
        <linearGradient id="navyLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#151E43" />
          <stop offset="100%" stopColor="#0F1634" />
        </linearGradient>
        <linearGradient id="navyRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0E142F" />
          <stop offset="100%" stopColor="#080C1D" />
        </linearGradient>

        {/* Accent Electric Cyan Container Gradients */}
        <linearGradient id="cyanTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#18B6D9" />
        </linearGradient>
        <linearGradient id="cyanLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#18B6D9" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="cyanRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0E7490" />
          <stop offset="100%" stopColor="#155E75" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="isoShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#10183D" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <ellipse cx="440" cy="300" rx="420" ry="240" fill="url(#terminalGlow)" />

      {/* 1. Terminal Ground Apron & Roadways */}
      <g id="ground-apron">
        {/* Main Isometric Concrete Yard Slab */}
        <polygon
          points="440,80 840,310 440,540 40,310"
          fill="#EEF4F8"
          stroke="#DCE5ED"
          strokeWidth="2"
        />

        {/* Outer Slab Edge / Thickness */}
        <polygon points="40,310 440,540 440,556 40,326" fill="#D3DFEA" />
        <polygon points="440,540 840,310 840,326 440,556" fill="#BDCFDD" />

        {/* Concrete Expansion Joints */}
        <line x1="240" y1="195" x2="640" y2="425" stroke="#D5E1EC" strokeWidth="1.5" strokeDasharray="6 6" />
        <line x1="440" y1="80" x2="440" y2="540" stroke="#D5E1EC" strokeWidth="1.5" strokeDasharray="6 6" />
        <line x1="640" y1="195" x2="240" y2="425" stroke="#D5E1EC" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Transit Roadway Strip (Darker Asphalt Track) */}
        <polygon
          points="140,252 380,390 280,448 40,310"
          fill="#202A54"
          fillOpacity="0.08"
        />
        {/* Roadway Guideline Marks */}
        <line x1="90" y1="281" x2="330" y2="419" stroke="#18B6D9" strokeWidth="2.5" strokeDasharray="16 12" strokeOpacity="0.75" />

        {/* Container Staging Zone Grid Marking */}
        <polygon
          points="460,200 780,385 680,442 360,258"
          fill="#2764D9"
          fillOpacity="0.05"
          stroke="#2764D9"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Cast Shadows Under Container Stacks */}
        <polygon
          points="490,260 760,415 670,470 400,315"
          fill="#10183D"
          fillOpacity="0.14"
        />

        {/* Cast Shadow Under Truck */}
        <polygon
          points="170,360 410,498 330,535 90,398"
          fill="#10183D"
          fillOpacity="0.18"
        />
      </g>

      {/* 2. Background Container Stacks (Right/Center Platform) */}
      <g id="container-stacks">
        {/* --- STACK A - BASE 1 (Cobalt 32FT Container - Center Back) --- */}
        {/* Origin: (500, 240), Size: dx=60, dy=160, dz=75 */}
        <g id="container-32ft-cobalt-base">
          {/* Left Face (facing -Y) */}
          <polygon
            points="440,320 440,245 578,165 578,240"
            fill="url(#cobaltLeft)"
          />
          {/* Corrugation ribs on left face */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const x1 = 440 + i * 17.25;
            const y1 = 320 - i * 10;
            return (
              <line
                key={`rib-l-${i}`}
                x1={x1 + 8}
                y1={y1 - 5}
                x2={x1 + 8}
                y2={y1 - 80}
                stroke="#1B4BB8"
                strokeWidth="2"
                strokeOpacity="0.6"
              />
            );
          })}
          {/* Right Face (facing +X) */}
          <polygon
            points="578,240 578,165 630,195 630,270"
            fill="url(#cobaltRight)"
          />
          {/* Door locking bars on right face */}
          <line x1="595" y1="175" x2="595" y2="250" stroke="#0F2F6E" strokeWidth="2.5" />
          <line x1="613" y1="185" x2="613" y2="260" stroke="#0F2F6E" strokeWidth="2.5" />
          {/* Top Face */}
          <polygon
            points="578,165 440,245 492,275 630,195"
            fill="url(#cobaltTop)"
          />
          {/* Top Corner Castings */}
          <circle cx="578" cy="165" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
          <circle cx="440" cy="245" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
          <circle cx="492" cy="275" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
          <circle cx="630" cy="195" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
        </g>

        {/* --- STACK A - BASE 2 (Deep Navy 32FT Container - Right Side) --- */}
        <g id="container-32ft-navy-base">
          {/* Left Face */}
          <polygon
            points="530,372 530,297 668,217 668,292"
            fill="url(#navyLeft)"
          />
          {/* Corrugation ribs */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const x1 = 530 + i * 17.25;
            const y1 = 372 - i * 10;
            return (
              <line
                key={`rib-n-${i}`}
                x1={x1 + 8}
                y1={y1 - 5}
                x2={x1 + 8}
                y2={y1 - 80}
                stroke="#080C1E"
                strokeWidth="2"
              />
            );
          })}
          {/* Right Face */}
          <polygon
            points="668,292 668,217 720,247 720,322"
            fill="url(#navyRight)"
          />
          {/* Door locking bars */}
          <line x1="685" y1="227" x2="685" y2="302" stroke="#060814" strokeWidth="2.5" />
          <line x1="703" y1="237" x2="703" y2="312" stroke="#060814" strokeWidth="2.5" />
          {/* Top Face */}
          <polygon
            points="668,217 530,297 582,327 720,247"
            fill="url(#navyTop)"
          />
        </g>

        {/* --- STACK A - TIER 2 (Accent Electric Cyan Container) --- */}
        {/* Stacked directly over Base 1 & Base 2 */}
        <g id="container-cyan-accent">
          {/* Left Face */}
          <polygon
            points="480,270 480,195 618,115 618,190"
            fill="url(#cyanLeft)"
          />
          {/* Corrugations */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const x1 = 480 + i * 17.25;
            const y1 = 270 - i * 10;
            return (
              <line
                key={`rib-c-${i}`}
                x1={x1 + 8}
                y1={y1 - 5}
                x2={x1 + 8}
                y2={y1 - 80}
                stroke="#0891B2"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
            );
          })}
          {/* Right Face */}
          <polygon
            points="618,190 618,115 670,145 670,220"
            fill="url(#cyanRight)"
          />
          {/* Door Bars */}
          <line x1="635" y1="125" x2="635" y2="200" stroke="#164E63" strokeWidth="2.5" />
          <line x1="653" y1="135" x2="653" y2="210" stroke="#164E63" strokeWidth="2.5" />
          {/* Top Face */}
          <polygon
            points="618,115 480,195 532,225 670,145"
            fill="url(#cyanTop)"
          />
          {/* White Brand Stencil Marking on Container Side */}
          <text
            x="524"
            y="238"
            fill="#FFFFFF"
            fillOpacity="0.85"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            transform="rotate(-30 524 238)"
            letterSpacing="2"
          >
            TLB-INDORE
          </text>
        </g>

        {/* --- STACK A - TIER 3 (Top 20FT Short Container - Ice Blue) --- */}
        <g id="container-20ft-ice">
          {/* Left Face (shorter length: 90px) */}
          <polygon
            points="550,155 550,90 636,40 636,105"
            fill="#2764D9"
          />
          {/* Corrugations */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`rib-top-${i}`}
              x1={550 + i * 17.2 + 8}
              y1={155 - i * 10 - 5}
              x2={550 + i * 17.2 + 8}
              y2={155 - i * 10 - 70}
              stroke="#1E52B6"
              strokeWidth="2"
            />
          ))}
          {/* Right Face */}
          <polygon
            points="636,105 636,40 688,70 688,135"
            fill="#143585"
          />
          {/* Top Face */}
          <polygon
            points="636,40 550,90 602,120 688,70"
            fill="#5D9BF8"
          />
        </g>
      </g>

      {/* 3. Terminal Pallets & Cargo Staging Zone */}
      <g id="pallets-cargo">
        {/* Wooden Pallet 1 */}
        <g id="pallet-1">
          {/* Base Wood Slats */}
          <polygon points="690,440 730,417 760,434 720,457" fill="#C49A6C" />
          <polygon points="690,440 720,457 720,463 690,446" fill="#A47B4E" />
          <polygon points="720,457 760,434 760,440 720,463" fill="#88633B" />
          {/* Box Stack on Pallet 1 */}
          <polygon points="698,435 698,395 726,379 726,419" fill="#DEB887" />
          <polygon points="726,419 726,379 752,394 752,434" fill="#C69E6E" />
          <polygon points="726,379 698,395 724,410 752,394" fill="#F0CE9E" />
          {/* Fragile tape indicator on box */}
          <line x1="712" y1="411" x2="739" y2="426" stroke="#18B6D9" strokeWidth="2.5" strokeOpacity="0.8" />
        </g>

        {/* Wooden Pallet 2 */}
        <g id="pallet-2">
          <polygon points="630,465 665,445 690,460 655,480" fill="#C49A6C" />
          <polygon points="630,465 655,480 655,485 630,470" fill="#A47B4E" />
          <polygon points="655,480 690,460 690,465 655,485" fill="#88633B" />
          {/* Shrink-wrapped Cargo Box */}
          <polygon points="636,460 636,425 660,411 660,446" fill="#E2E8F0" />
          <polygon points="660,446 660,411 684,425 684,460" fill="#CBD5E1" />
          <polygon points="660,411 636,425 660,439 684,425" fill="#F1F5F9" />
          <line x1="648" y1="439" x2="672" y2="453" stroke="#2764D9" strokeWidth="2" strokeOpacity="0.5" />
        </g>
      </g>

      {/* 4. Commercial Heavy Freight Truck (Foreground Transiting) */}
      {/* Truck Cab is White & Cobalt Blue, Hitching 32FT Blue Intermodal Container */}
      <g id="freight-truck">
        {/* --- TRUCK TRAILER BED & WHEELS --- */}
        {/* Wheels (Isometric Ellipses with Chrome Hubs) */}
        {/* Rear Axle Wheels */}
        <g id="rear-wheels">
          {/* Wheel 1 (Rear Left) */}
          <ellipse cx="160" cy="425" rx="14" ry="24" fill="#0E1326" transform="rotate(-30 160 425)" />
          <ellipse cx="160" cy="425" rx="7" ry="12" fill="#94A3B8" transform="rotate(-30 160 425)" />
          {/* Wheel 2 (Rear Tandem) */}
          <ellipse cx="185" cy="439" rx="14" ry="24" fill="#0E1326" transform="rotate(-30 185 439)" />
          <ellipse cx="185" cy="439" rx="7" ry="12" fill="#94A3B8" transform="rotate(-30 185 439)" />
          {/* Wheel 3 (Mid Axle) */}
          <ellipse cx="230" cy="465" rx="14" ry="24" fill="#0E1326" transform="rotate(-30 230 465)" />
          <ellipse cx="230" cy="465" rx="7" ry="12" fill="#94A3B8" transform="rotate(-30 230 465)" />
        </g>

        {/* Trailer Steel Chassis Frame */}
        <polygon
          points="130,378 300,476 300,488 130,390"
          fill="#1E293B"
        />
        <polygon
          points="300,476 325,462 325,474 300,488"
          fill="#0F172A"
        />

        {/* --- 32FT CONTAINER ON TRUCK BED --- */}
        {/* Container Coordinates: Hitch length on trailer */}
        <g id="truck-container-32ft">
          {/* Left Long Face */}
          <polygon
            points="140,366 140,285 278,205 278,286"
            fill="url(#cobaltLeft)"
          />
          {/* Corrugations on truck container */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const x1 = 140 + i * 17.25;
            const y1 = 366 - i * 10;
            return (
              <line
                key={`rib-tc-${i}`}
                x1={x1 + 8}
                y1={y1 - 5}
                x2={x1 + 8}
                y2={y1 - 85}
                stroke="#1B4BB8"
                strokeWidth="2"
                strokeOpacity="0.65"
              />
            );
          })}
          {/* Right Face (Front end of container against cab) */}
          <polygon
            points="278,286 278,205 325,232 325,313"
            fill="url(#cobaltRight)"
          />
          {/* Top Face */}
          <polygon
            points="278,205 140,285 187,312 325,232"
            fill="url(#cobaltTop)"
          />
          {/* Cyan Safety Stripe Band on Container Base */}
          <polygon
            points="140,366 140,358 278,278 278,286"
            fill="#18B6D9"
          />
          {/* Container Number Stencil */}
          <text
            x="185"
            y="330"
            fill="#FFFFFF"
            fillOpacity="0.9"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            transform="rotate(-30 185 330)"
            letterSpacing="1.5"
          >
            TLB-32-FTL
          </text>
        </g>

        {/* --- TRUCK CAB (Heavy Commercial Tractor) --- */}
        <g id="truck-tractor-cab">
          {/* Front Steer Wheel */}
          <ellipse cx="365" cy="515" rx="14" ry="24" fill="#0E1326" transform="rotate(-30 365 515)" />
          <ellipse cx="365" cy="515" rx="7" ry="12" fill="#CBD5E1" transform="rotate(-30 365 515)" />

          {/* Lower Cab Chassis / Fuel Tank / Steps */}
          <polygon points="310,470 345,490 345,502 310,482" fill="#64748B" />
          {/* Chrome Cylinder Fuel Tank */}
          <ellipse cx="328" cy="488" rx="8" ry="14" fill="#94A3B8" transform="rotate(60 328 488)" />

          {/* Cab Main Body (Left Face - White with Cobalt Base) */}
          <polygon
            points="310,460 310,345 365,313 365,428"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          {/* Cobalt Lower Door Accent */}
          <polygon
            points="310,460 310,425 365,393 365,428"
            fill="#2764D9"
          />
          {/* Driver Side Window (Tinted Glass) */}
          <polygon
            points="320,405 320,358 355,338 355,385"
            fill="#1E293B"
            fillOpacity="0.85"
          />
          {/* Door Handle */}
          <line x1="324" y1="416" x2="334" y2="410" stroke="#64748B" strokeWidth="2.5" />

          {/* Cab Front Face (Windshield, Grille, Headlights) */}
          <polygon
            points="365,428 365,313 400,333 400,448"
            fill="#F1F5F9"
          />
          {/* Front Windshield Glass */}
          <polygon
            points="368,375 368,320 397,337 397,392"
            fill="#10183D"
          />
          <polygon
            points="370,368 370,325 385,334 385,377"
            fill="#38BDF8"
            fillOpacity="0.35"
          />
          {/* Chrome Grille and Tata/BharatBenz Style Commercial V-Bar */}
          <polygon points="370,426 370,398 395,412 395,440" fill="#0F172A" />
          <line x1="373" y1="406" x2="392" y2="417" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="373" y1="413" x2="392" y2="424" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="373" y1="420" x2="392" y2="431" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Dual LED Headlight Assemblies */}
          <polygon points="368,432 368,424 374,427 374,435" fill="#FACC15" />
          <polygon points="389,444 389,436 395,439 395,447" fill="#FACC15" />
          {/* Front Bumper with Tow Hook */}
          <polygon points="364,440 402,462 402,470 364,448" fill="#1E293B" />

          {/* Cab Aerodynamic Roof Cap */}
          <polygon
            points="365,313 310,345 345,365 400,333"
            fill="#FFFFFF"
          />
          {/* Amber Marker Lights on Roof */}
          <circle cx="370" cy="326" r="2" fill="#F59E0B" />
          <circle cx="382" cy="333" r="2" fill="#F59E0B" />
          <circle cx="394" cy="340" r="2" fill="#F59E0B" />

          {/* Vertical Exhaust Stack behind Cab */}
          <line x1="305" y1="365" x2="305" y2="295" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <line x1="305" y1="295" x2="300" y2="285" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />

          {/* Rear View Mirror */}
          <polygon points="367,362 367,352 372,355 372,365" fill="#0F172A" />
        </g>
      </g>

      {/* 5. Terminal Yard Details: High-Mast Light & Signage */}
      <g id="yard-structures">
        {/* High-Mast Light Tower (Center-Back) */}
        <g id="light-pole">
          <line x1="720" y1="210" x2="720" y2="70" stroke="#94A3B8" strokeWidth="4" />
          {/* Light Fixture Crossbar */}
          <polygon points="705,74 735,57 735,63 705,80" fill="#64748B" />
          {/* Floodlight Beam (Soft Yellow Glow) */}
          <polygon points="710,75 730,64 770,160 670,220" fill="#FEF08A" fillOpacity="0.08" />
          <circle cx="712" cy="74" r="3" fill="#FEF08A" />
          <circle cx="728" cy="65" r="3" fill="#FEF08A" />
        </g>

        {/* Terminal Signboard (Corridor Badge) */}
        <g id="terminal-badge" transform="translate(680, 360)">
          <polygon points="0,0 60,-35 60,-55 0,-20" fill="#10183D" />
          <polygon points="0,-20 60,-55 75,-46 15,-11" fill="#2764D9" />
          <text
            x="12"
            y="-27"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="bold"
            fontFamily="sans-serif"
            transform="rotate(-30 12 -27)"
          >
            GATE 04 • FTL
          </text>
        </g>
      </g>
    </svg>
  );
}
