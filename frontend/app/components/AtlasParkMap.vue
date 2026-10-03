<script setup lang="ts">
defineProps<{ trails: Record<string, string>; active?: string }>();
const shore = 'M104 130C130 84 219 57 305 76C354 87 375 67 429 80C492 96 500 129 561 104C626 78 693 64 771 87C810 99 850 89 895 133C934 172 926 220 904 265C885 309 925 339 920 389C912 439 941 490 903 538C865 586 804 619 730 612C667 606 630 636 566 619C509 601 477 620 423 614C372 608 323 638 255 618C188 598 125 610 91 553C55 493 91 451 76 404C60 354 97 326 88 281C77 239 68 185 104 130Z';
const trees = [{x:112,y:287,s:1},{x:137,y:304,s:.75},{x:864,y:305,s:.9},{x:887,y:322,s:.65},{x:92,y:448,s:.8},{x:918,y:463,s:.8},{x:407,y:123,s:.8},{x:619,y:594,s:.7}];
</script>

<template>
  <svg class="park-land" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="park-water-lines" width="60" height="40" patternUnits="userSpaceOnUse"><path d="M9 20q7-4 14 0t14 0" fill="none" stroke="#abc9cf" stroke-width="1" opacity=".32"/></pattern>
      <pattern id="park-meadow" width="23" height="27" patternUnits="userSpaceOnUse"><path d="m5 18 2-3m1 4 2-2" stroke="#adba9f" stroke-width=".8" opacity=".22"/></pattern>
      <clipPath id="park-coast-clip"><path :d="shore"/></clipPath>
      <g id="park-tree"><path d="M0 0v15m0-6-7-6m7 1 6-7" fill="none" stroke="#768c7c" stroke-width="1.5"/><path d="M0-23C-18-22-19-2-9 3C-3 8 9 6 14-1C20-10 13-25 0-23Z" fill="#c7d5be" stroke="#90a88f" stroke-width="1.1"/><path d="M0-15v18m0-11-6-4m6 10 6-6" fill="none" stroke="#90a88f" stroke-width="1"/></g>
    </defs>
    <rect x="7" y="16" width="986" height="670" rx="36" class="park-water"/>
    <rect x="7" y="16" width="986" height="670" rx="36" fill="url(#park-water-lines)"/>
    <path :d="shore" class="park-shore-outer"/>
    <path :d="shore" class="park-shore-inner"/>
    <path :d="shore" class="park-ground"/>
    <g clip-path="url(#park-coast-clip)">
      <rect width="1000" height="700" fill="url(#park-meadow)"/>
      <g class="park-contours">
        <path d="M75 142C210 38 352 163 442 107S727 47 927 161"/>
        <path d="M87 154C215 53 348 178 448 124S724 62 925 179"/>
        <path d="M94 568C216 646 304 563 416 590S709 668 912 548"/>
        <path d="M90 582C224 663 302 580 419 606S708 684 925 563"/>
      </g>
      <path class="park-creek-bank" d="M30 368C178 309 250 389 362 349S520 311 633 353S832 372 985 305"/>
      <path class="park-creek" d="M30 368C178 309 250 389 362 349S520 311 633 353S832 372 985 305"/>
      <path class="park-creek-glint" d="M43 365C180 321 250 394 362 356M650 356C771 396 859 347 957 317"/>
      <g class="park-path-base"><path v-for="(path,key) in trails" :key="key" :d="path"/></g>
      <g class="park-path"><path v-for="(path,key) in trails" :key="key" :d="path"/></g>
      <g class="park-path-center"><path v-for="(path,key) in trails" :key="key" :d="path"/></g>
      <g class="park-bridges"><path d="m430 326 31 3m-35 19 31 3M550 332l29 13m-35 5 28 12"/></g>
      <ellipse cx="500" cy="350" rx="59" ry="38" class="park-court-edge"/>
      <ellipse cx="500" cy="350" rx="49" ry="30" class="park-court"/>
      <path v-if="active" :key="active" class="park-active-trail" :d="trails[active]" pathLength="100"/>
      <g v-for="(tree,i) in trees" :key="i" :transform="'translate('+tree.x+' '+tree.y+') scale('+tree.s+')'"><use href="#park-tree"/></g>
      <g class="park-benches"><path d="M320 348h23m-23 4h23m-20 0v5m17-5v5M706 370h23m-23 4h23m-20 0v5m17-5v5"/></g>
    </g>
    <g class="park-compass" transform="translate(951 72)"><path d="M0-17 5 3 0 0-5 3Z" fill="#497780"/><path d="M0 0v17M-12 0h24" fill="none" stroke="#75979c" stroke-width="1"/><text x="0" y="-23" text-anchor="middle">N</text></g>
    <g class="park-water-ripple"><path d="M49 563q10-4 20 0m-15 6q10-3 20 0M886 635q10-4 20 0m-15 6q10-3 20 0"/></g>
  </svg>
</template>
