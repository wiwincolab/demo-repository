<script setup lang="ts">
defineProps<{ active?: string }>();
const asset = useAsset();
const texture = (name: string) => asset('assets/atlas-plaza/terrain-v1/' + name + '.png');
const parks = [
  { id: 'cities', x: 260, y: 265 },
  { id: 'town', x: 740, y: 265 },
  { id: 'collection', x: 245, y: 570 },
  { id: 'wardrobe', x: 755, y: 570 },
];
const land = 'M58 195Q85 107 223 122Q319 69 402 93Q501 44 611 94Q750 67 811 129Q927 120 956 213L961 548Q942 619 835 634Q748 710 626 685Q500 747 382 691Q234 719 169 645Q64 632 39 556Z';
const circuit = 'M260 265C350 267 362 350 500 403C641 350 638 267 740 265C877 279 883 484 755 570C621 571 618 498 500 403C385 498 379 571 245 570C116 479 129 277 260 265Z';
const avenue = 'M500 403V688';
const lake = 'M422 122Q487 91 555 119Q603 133 609 202Q616 264 550 282Q476 310 423 266Q380 233 400 185Z';
const hills = [
  // Broad slopes spill beyond each garden, so terraces belong to the same landscape.
  { id: 'west', outline: 'M83 203Q89 96 180 74Q288 27 369 106Q418 170 392 292Q365 354 241 360Q106 357 74 289Q64 252 83 203Z', contour: 'M85 262Q124 321 229 329Q338 351 391 286' },
  { id: 'east', outline: 'M615 182Q623 45 731 27Q852 4 925 117Q964 191 942 293Q917 370 796 372Q654 373 614 294Q593 245 615 182Z', contour: 'M617 270Q657 333 768 339Q891 353 941 286' },
  { id: 'atelier', outline: 'M635 505Q668 442 799 450Q916 463 931 556Q920 637 803 653Q677 653 630 590Q614 548 635 505Z', contour: 'M638 583Q734 643 843 618Q903 606 928 559' },
];
</script>
<template>
  <svg class="lobby-floor" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="lobby-grass" width="280" height="370" patternUnits="userSpaceOnUse"><image :href="texture('sage-meadow')" width="280" height="370" preserveAspectRatio="none"/></pattern>
      <pattern id="lobby-stone" width="84" height="112" patternUnits="userSpaceOnUse"><image :href="texture('limestone-paving')" width="84" height="112" preserveAspectRatio="none"/></pattern>
      <pattern id="lobby-wall" width="52" height="30" patternUnits="userSpaceOnUse">
        <rect width="52" height="30" fill="#b9beaa"/>
        <path d="M0 1h52M0 16h52M14 1v15m26 0v14" stroke="#536967" stroke-width="1" opacity=".55"/>
        <path d="M1 3h50M1 18h50" stroke="#e9e1c7" stroke-width="2"/>
      </pattern>
      <linearGradient id="lobby-water" x1="0" x2=".6" y1="0" y2="1"><stop stop-color="#60a4b2"/><stop offset="1" stop-color="#a5d3d1"/></linearGradient>
      <linearGradient id="lobby-slope" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#e1e5bd"/><stop offset=".42" stop-color="#c0cba0"/><stop offset="1" stop-color="#879e7c"/></linearGradient>
    </defs>
    <!-- The pavement and grass share one footprint; the rim gives it a shallow stone foundation. -->
    <path :d="land" transform="translate(0 43)" fill="#6b8885" opacity=".18"/>
    <path :d="land" transform="translate(0 34)" fill="url(#lobby-wall)" stroke="#57706b" stroke-width="2"/>
    <path :d="land" transform="translate(0 8)" fill="#b5c3a2" stroke="#526b64" stroke-width="2"/>
    <path :d="land" fill="#cbd7af" stroke="#466761" stroke-width="2"/>
    <path :d="land" fill="url(#lobby-grass)"/>
    <path :d="land" fill="none" stroke="url(#lobby-stone)" stroke-width="12"/>
    <path :d="land" fill="none" stroke="#57766b" stroke-width="1.5"/>
    <g v-for="hill in hills" :key="hill.id" class="lobby-hillside">
      <path :d="hill.outline" transform="translate(0 7)" fill="#426b5c" opacity=".18"/>
      <path :d="hill.outline" fill="url(#lobby-slope)" stroke="#7f9875" stroke-width="1.3"/>
      <path :d="hill.outline" fill="url(#lobby-grass)" opacity=".48"/>
      <path :d="hill.contour" fill="none" stroke="#e5e4be" stroke-width="3" opacity=".7"/>
      <path :d="hill.contour" transform="translate(0 8)" fill="none" stroke="#708f73" stroke-width="1.2" opacity=".45"/>
    </g>
    <!-- A short descending watercourse gives the elevated town a visible relation to the lake. -->
    <path d="M651 140C627 156 643 186 606 207" fill="none" stroke="#c3c4a4" stroke-width="15"/>
    <path d="M651 140C627 156 643 186 606 207" fill="none" stroke="#78b2b9" stroke-width="10"/>
    <path d="m636 161 8 3m-8 8 7 3m-10 9 7 3m-17 5 7 4" fill="none" stroke="#e2eedd" stroke-width="2"/>
    <!-- Connected limestone routes, rather than four detached platforms. -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path :d="circuit" transform="translate(0 4)" stroke="#426153" stroke-width="52" opacity=".2"/>
      <path :d="circuit" stroke="#667e6d" stroke-width="49"/>
      <path :d="circuit" stroke="#f6edd9" stroke-width="46"/>
      <path :d="circuit" stroke="url(#lobby-stone)" stroke-width="41"/>
      <path :d="avenue" stroke="#617868" stroke-width="65"/>
      <path :d="avenue" stroke="#f7edd7" stroke-width="62"/>
      <path :d="avenue" stroke="url(#lobby-stone)" stroke-width="57"/>
    </g>
    <path :d="lake" transform="translate(0 3)" fill="#587f79" stroke="#587f79" stroke-width="19"/>
    <path :d="lake" fill="url(#lobby-water)" stroke="url(#lobby-stone)" stroke-width="15"/>
    <path :d="lake" fill="none" stroke="#527b7f" stroke-width="1.8"/>
    <path class="lobby-lake-ripple" d="M439 188q18-5 36 0m32 40q19-5 37 0m-92 20q14-4 28 0m27-92q18-5 36 0" fill="none" stroke="#edf4dd" stroke-width="2"/>
    <g v-for="park in parks" :key="park.id" :transform="'translate('+park.x+' '+park.y+')'" class="lobby-pad" :class="{'is-lit':active===park.id}">
      <ellipse cy="6" rx="116" ry="53" fill="#587466" opacity=".25"/>
      <ellipse rx="118" ry="52" fill="url(#lobby-stone)" stroke="#778978" stroke-width="1.5"/>
      <ellipse class="lobby-pad-light" rx="117" ry="51" fill="none" stroke="#d5ad47" stroke-width="4"/>
    </g>
    <g class="lobby-center">
      <ellipse cx="500" cy="409" rx="91" ry="48" fill="#829480" stroke="#56746c" stroke-width="1.5"/>
      <ellipse cx="500" cy="401" rx="91" ry="48" fill="url(#lobby-stone)" stroke="#4f746e" stroke-width="2"/>
      <ellipse cx="500" cy="401" rx="82" ry="41" fill="none" stroke="#f6e7bf" stroke-width="5"/>
      <ellipse cx="500" cy="401" rx="73" ry="35" fill="#f8f0dc" stroke="#6a8e81" stroke-width="1.5"/>
      <path d="m500 376 8 16 28 9-28 5-8 20-8-20-28-5 28-9Z" fill="#c9a65b" stroke="#8b8664" stroke-width=".7"/>
    </g>
  </svg>
</template>
