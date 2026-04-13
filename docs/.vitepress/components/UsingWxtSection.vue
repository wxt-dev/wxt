<script lang="ts" setup>
import { computed } from 'vue';
import useListExtensionDetails from '../composables/useListExtensionDetails';

/** At least one of `chromeId` or `firefoxSlug` must be set. */
type ExtensionEntry =
  | { chromeId: string; firefoxSlug?: string }
  | { firefoxSlug: string; chromeId?: string };

interface StoreLink {
  label: string;
  url: string;
}

interface ListedExtension {
  id: string;
  name: string;
  iconUrl: string;
  shortDescription: string;
  users: number;
  rating: number | undefined;
  stores: StoreLink[];
}

/**
 * Add extension entries to end of the list. On the website, extensions will be
 * sorted by a combination of users and rating.
 *
 * Change the commit message or PR title to:
 *
 * > "docs: Added "[extension name]" to showcase"
 *
 * Use:
 *
 * - `chromeId` for the Chrome Web Store listing,
 * - `firefoxSlug` for Firefox Add-ons (slug from
 *   https://addons.mozilla.org/firefox/addon/{slug}/)
 *
 * You may set one or both.
 */
const extensionEntries: ExtensionEntry[] = [
  {
    // GitHub: Better Line Counts
    chromeId: 'ocfdgncpifmegplaglcnglhioflaimkd',
    firefoxSlug: 'github-better-line-counts',
  },
  {
    // Anime Skip Player
    chromeId: 'mgmdkjcljneegjfajchedjpdhbadklcf',
    firefoxSlug: 'anime-skip',
  },
  {
    // UltraWideo
    chromeId: 'bfbnagnphiehemkdgmmficmjfddgfhpl',
    firefoxSlug: 'ultrawideo',
  },
  {
    // StayFree - Website Blocker & Web Analytics
    chromeId: 'elfaihghhjjoknimpccccmkioofjjfkf',
    firefoxSlug: 'stayfree',
  },
  {
    // Doozy: Ai Made Easy
    chromeId: 'okifoaikfmpfcamplcfjkpdnhfodpkil',
  },
  {
    // tl;dv - Record, Transcribe & ChatGPT for Google Meet
    chromeId: 'lknmjhcajhfbbglglccadlfdjbaiifig',
  },
  {
    // Youtube中文配音
    chromeId: 'oglffgiaiekgeicdgkdlnlkhliajdlja',
  },
  {
    // PreMiD
    chromeId: 'agjnjboanicjcpenljmaaigopkgdnihi',
  },
  {
    // Markdown Sticky Notes
    chromeId: 'aiakblgmlabokilgljkglggnpflljdgp',
    firefoxSlug: 'markdown-sticky-notes',
  },
  {
    // DocVersionRedirector
    chromeId: 'nomnkbngkijpffepcgbbofhcnafpkiep',
  },
  {
    // Plex Skipper
    chromeId: 'ceicccfeikoipigeghddpocceifjelph',
    firefoxSlug: 'plex-skipper',
  },
  {
    // GitHub Custom Notifier
    chromeId: 'aelkipgppclpfimeamgmlonimflbhlgf',
    firefoxSlug: 'github-custom-notifier',
  },
  {
    // Fluent Read
    chromeId: 'djnlaiohfaaifbibleebjggkghlmcpcj',
  },
  {
    // Facebook Video Controls
    chromeId: 'nhclljcpfmmaiojbhhnkpjcfmacfcian',
    firefoxSlug: 'facebook-video-controls',
  },
  {
    // ElemSnap - Quick capture of webpage elements and conversion to images,
    chromeId: 'mblkhbaakhbhiimkbcnmeciblfhmafna',
  },
  {
    // MS Edge TTS (Text to Speech)
    chromeId: 'oajalfneblkfiejoadecnmodfpnaeblh',
    firefoxSlug: 'ms-edge-tts-text-to-speech',
  },
  {
    // YTBlock - Block any content from YouTube™
    chromeId: 'nedcanggplmbbgmlpcjiafgjcpdimpea',
  },
  {
    // demo.fun - Interactive product demos that convert
    chromeId: 'oadbjpccljkplmhnjekgjamejnbadlne',
  },
  {
    // SmartEReply: Elevate Your LinkedIn™ Engagement with AI 🚀📈
    chromeId: 'iopdafdcollfgaoffingmahpffckmjni',
  },
  {
    // WorkFlowy MultiFlow
    chromeId: 'khjdmjcmpolknpccmaaipmidphjokhdf',
  },
  {
    // 香草布丁🌿🍮- https://github.com/Xdy1579883916/vanilla-pudding
    chromeId: 'fencadnndhdeggodopebjgdfdlhcimfk',
  },
  {
    // MaxFocus: Link Preview
    chromeId: 'bnacincmbaknlbegecpioobkfgejlojp',
    firefoxSlug: 'maxfocus-link-preview',
  },
  {
    // 汇率转换-中文版本
    chromeId: 'bcpgdpedphodjcjlminjbdeejccjbimp',
  },
  {
    // Currency Converter Plus
    chromeId: 'loeilaonggnalkaiiaepbegccilkmjjp',
    firefoxSlug: 'currency-converter-plus',
  },
  {
    // Respond Easy
    chromeId: 'npcnninnjghigjfiecefheeibomjpkak',
  },
  {
    // mindful - stay focused on your goals
    chromeId: 'cfkdcideecefncbglkhneoflfnmhoicc',
  },
  {
    // 1Proompt
    chromeId: 'lnhejcpclabmbgpiiomjbhalblnnbffg',
  },
  {
    // NiceTab - https://github.com/web-dahuyou/NiceTab
    chromeId: 'fonflmjnjbkigocpoommgmhljdpljain',
  },
  {
    // Draftly for LinkedIn
    chromeId: 'fcffekbnfcfdemeekijbbmgmkognnmkd',
  },
  {
    // YouTube Summarized - Summarize any YouTube video
    chromeId: 'nkndldfehcidpejfkokbeghpnlbppdmo',
  },
  {
    // 社媒助手 - https://github.com/iszhouhua/social-media-copilot
    chromeId: 'dbichmdlbjdeplpkhcejgkakobjbjalc',
  },
  {
    // Dofollow Links for SEO
    chromeId: 'opepfpjeogkbgeigkbepobceinnfmjdd',
  },
  {
    // ChatGPT Writer: Use AI on Any Site (GPT-4o, Claude, Gemini, and More)
    chromeId: 'pdnenlnelpdomajfejgapbdpmjkfpjkp',
  },
  {
    // discord message translator
    chromeId: 'jobnhifpphkgoelnhnopgkdhbdkiadmj',
  },
  {
    // Habit Tracker app widget for daily habit tracking
    chromeId: 'ncokhechhpjgjonhjnlaneglmdkfkcbj',
  },
  {
    // Catppuccin for GitHub File Explorer Icons
    chromeId: 'lnjaiaapbakfhlbjenjkhffcdpoompki',
    firefoxSlug: 'catppuccin-web-file-icons',
  },
  {
    // WebChat: Chat with anyone on any website
    chromeId: 'cpaedhbidlpnbdfegakhiamfpndhjpgf',
  },
  {
    // YouTube Auto HD + FPS
    chromeId: 'fcphghnknhkimeagdglkljinmpbagone',
    firefoxSlug: 'youtube-auto-hd-fps',
  },
  {
    // MultiViewer Companion
    chromeId: 'lpomjgbicdemjkgmbnkjncgdebogkhlb',
    firefoxSlug: 'multiviewer-companion',
  },
  {
    // Sync Watch - Watch videos together on any site
    chromeId: 'ggiafipgeeaaahnjamgpjcgkdpanhddg',
    firefoxSlug: 'syncwatch',
  },
  {
    // Keyword Rank Checker
    chromeId: 'nmldnjcblcihmegipecakhmnieiofmgl',
    firefoxSlug: 'keyword-rank-checker-sa',
  },
  {
    // YouTube Simple View - Hide distractions & more
    chromeId: 'gppllamhaciichleihemgilcpledblpn',
    firefoxSlug: 'youtube-simple-view',
  },
  {
    // Propbar - Property Data Enhancer
    chromeId: 'pccbghdfdnnkkbcdcibchpbffdgednkf',
  },
  {
    // Text Search Pro - Search by case and whole-word match!
    chromeId: 'lfknakglefggmdkjdfhhofkjnnolffkh',
    firefoxSlug: 'text-search-pro-ext',
  },
  {
    // Invoice Generator
    chromeId: 'mbenhbocjckkbaojacmaepiameldglij',
    firefoxSlug: 'quick-invoice-generator',
  },
  {
    // Monthly Bill Tracker
    chromeId: 'phlfhkmdofajnbhgmbmjkbkdgppgoppb',
  },
  {
    // Wandpen - Instantly improve your writing with AI
    chromeId: 'macmkmchfoclhpbncclinhjflmdkaoom',
  },
  {
    // YouTube Hider - Remove Comments By Keywords, Usernames & Tools
    chromeId: 'lhmgechokhmdekdpgkkemoeecelcaonm',
  },
  {
    // QA Compass - Record standardized bug reports easily
    chromeId: 'imgheieooppmahcgniieddodaliodeeg',
  },
  {
    // aesthetic Notion, styled
    chromeId: 'npgghjedpchajflknnbngajkjkdhncdo',
  },
  {
    // Eye Dropper
    chromeId: 'hmdcmlfkchdmnmnmheododdhjedfccka',
    firefoxSlug: 'eye_dropper',
  },
  {
    // Cursorful - Screen Recorder with Auto Zoom
    chromeId: 'eihpmapodnppeemkhkbhikmggfojdkjd',
  },
  {
    // Show IP – Live View of Website IPs for Developers
    chromeId: 'hjjkgbibknbahijglkffklflidncplkn',
  },
  {
    // Strong Password Generator
    chromeId: 'ilbikcehnpkmldojkcmlldkoelofnbde',
    firefoxSlug: 'strongpasswordgenerator',
  },
  {
    // ZenGram: Mindful Instagram, Your Way
    chromeId: 'ocllfkhcdopiafndigclebelbecaiocp',
  },
  {
    // Blync: Preview Links, Selection Search, AI Assistant
    chromeId: 'odffpjnpocjfcaclnenaaaddghkgijdb',
  },
  {
    // HTML to Markdown - Convert webpages to markdown
    chromeId: 'kofbbilhmnkcmibjbioafflgmpkbnmme',
  },
  {
    // Walmart WFS Profit Calculator
    chromeId: 'boecmgggeigllcdocgioijmleimjbfkg',
    firefoxSlug: 'walmart-wfs-profit-calculator',
  },
  {
    // Youtube Live Chat Fullscreen
    chromeId: 'dlnjcbkmomenmieechnmgglgcljhoepd',
    firefoxSlug: 'youtube-live-chat-fullscreen',
  },
  {
    // Python Code Runner
    chromeId: 'keiealdacakpnbbljlmhfgcebmaadieg',
    firefoxSlug: 'code-runner-manager',
  },
  {
    // Monochromate
    chromeId: 'hafcajcllbjnoolpfngclfmmgpikdhlm',
  },
  {
    // AliasVault - Open-Source Password & (Email) Alias Manager
    chromeId: 'bmoggiinmnodjphdjnmpcnlleamkfedj',
  },
  {
    // SnapThePrice: AI-Powered Real-time Lowest Price Finder
    chromeId: 'hlnhhamckimoaiekbglafiebkfimhapb',
  },
  {
    // radiofrance - news & broadcasts (French), music (international)
    chromeId: 'gdjampjdgjmbifnhldgcnccdjkcoicmg',
  },
  {
    // Blens - Time Tracker and AI Insight
    chromeId: 'jlnhphlghikichhgbnkepenehbmloenb',
    firefoxSlug: 'blens-timetracker-ai-insight',
  },
  {
    // Always Light Mode - Setting website always in light mode
    chromeId: 'njnammmpdodmfkodnfpammnpdcbhnlcm',
  },
  {
    // DesignPicker - Color Picker & Font Detector
    chromeId: 'lblmfclcfniabobmamfkdogcgdagbhhb',
    firefoxSlug: 'design-colorpicker-fontdetect',
  },
  {
    // Web to PDF
    chromeId: 'pamnlaoeobcmhkliljfaofekeddpmfoh',
    firefoxSlug: 'export-web-to-pdf',
  },
  {
    // Online CSV Viewer
    chromeId: 'jmbcbeepjfenihlocplnbmbhimcoooka',
    firefoxSlug: 'csv-viewer',
  },
  {
    // YouTube Video Transcript
    chromeId: 'nkjcoophmpcmmgadnljnlpbpfdfacgbo',
    firefoxSlug: 'youtube-transcript-copy',
  },
  {
    // NetSuite Record Scripts
    chromeId: 'lcaieahkjgeggeiihblhcjbbjlppgieh',
    firefoxSlug: 'netsuite-scripts-manager',
  },
  {
    // VueTracker
    chromeId: 'gmocfknjllodfiomnljmaehcplnekhlo',
  },
  {
    // CanCopy - A web extension that allow you to copy any content from website
    chromeId: 'ggcfemmoabhhelfkhknhbnkmeahloiod',
  },
  {
    // Language Learning with AI
    chromeId: 'modkelfkcfjpgbfmnbnllalkiogfofhb',
    firefoxSlug: 'intersub',
  },
  {
    // Bilibili Feed History Helper
    chromeId: 'npfopljnjbamegincfjelhjhnonnjloo',
  },
  {
    // NZBDonkey - The ultimate NZB file download tool
    chromeId: 'edkhpdceeinkcacjdgebjehipmnbomce',
  },
  {
    // WeChat Markdown Editor(微信 Markdown 编辑器)
    chromeId: 'cckggnbnimdbbpmdinkkgbbncopbloob',
  },
  {
    // Tab Grab
    chromeId: 'jcblcjolcojmfopefcighfmkkefbaofg',
    firefoxSlug: 'tab-grab',
  },
  {
    // BrowserLens - https://browserlens.com/
    chromeId: 'eehmoikadcijkapfjocnhjclpbaindlb',
    firefoxSlug: 'browserlens',
  },
  {
    // Epic Games Library Extension
    chromeId: 'hfhellofkjebbchcdffmicekjdomkcmc',
    firefoxSlug: 'epic-games-library-extension',
  },
  {
    // Zen Analytics Pixel Tracker - zapt.web.app
    chromeId: 'gknigcbhlammoakmmdddkblknanpjiac',
  },
  {
    // Crypto Pulse - Compose your newtab with nature images, widgets & realtime Crypto Price & Bitcoin RSS.
    chromeId: 'cnklededohhcbmjjdlbjdkkihkgoggol',
  },
  {
    // Youtube Video Scheduler
    chromeId: 'miponnamafdenpgjemkknimgjfibicdc',
    firefoxSlug: 'youtube-video-scheduler',
  },
  {
    // Chatslator: Livestream Chat Translator
    chromeId: 'nhmbcmalgpkjbomhlhgdicanmkkaajmg',
    firefoxSlug: 'chatslator',
  },
  {
    // 公众号阅读增强器 - https://wxreader.honwhy.wang
    chromeId: 'mbamjfdjbcdgpopfnkkmlohadbbnplhm',
  },
  {
    // 토탐정
    chromeId: 'hannhecbnjnnbbafffmogdlnajpcomek',
    firefoxSlug: '토탐정',
  },
  {
    // 2FAS Pass - https://2fas.com/
    chromeId: 'ehboaofjncodknjkngdggmpdinhdoijp',
    firefoxSlug: '2fas-pass-browser-extension',
  },
  {
    // Quick Prompt - https://github.com/wenyuanw/quick-prompt
    chromeId: 'hnjamiaoicaepbkhdoknhhcedjdocpkd',
    firefoxSlug: 'quick-prompt',
  },
  {
    // Add QR Code Generator Icon Back To Address Bar
    chromeId: 'kacblhilkacgfnkjfodalohcnllcgmjd',
  },
  {
    // Piwik PRO Tracking Helper
    chromeId: 'fkbdlogfdjmpfepbbbjcgcfbgbcfcnne',
    firefoxSlug: 'piwik-pro-tracking-helper',
  },
  {
    // PIPX - Take Control of Picture-in-Picture, Automatically
    chromeId: 'nkbikckldmljjiiajklecmgmajgapbfl',
  },
  {
    // Browsely - AI-powered browser extension
    chromeId: 'hgppdobcpkfkmiegekaglonjajeojmdd',
  },
  {
    // Filmbudd Pro - Simple, private – and synced ratings and watch notes across all your devices
    chromeId: 'ehmoihnjgkdimihkhokkmfjdgomohjgm',
  },
  {
    // MultiField CopyCat - Copy, Paste & Autofill Web Forms Instantly
    chromeId: 'alglchohmdikgdjhafiicilegegieafa',
  },
  {
    // ChatSight - Add Table of Contents to ChatGPT
    chromeId: 'aamihahiiogceidpbnfgehacgiecephe',
  },
  {
    // BetterCampus (prev. BetterCanvas)
    chromeId: 'cndibmoanboadcifjkjbdpjgfedanolh',
    firefoxSlug: 'better-canvas',
  },
  {
    // Leetcode Fonts - Change fonts in leetcode effortlessly
    chromeId: 'hinfimgacobnellbncbcpdlpaapcofaa',
  },
  {
    // TranslateManga - Manga Translator & Manga Tracker
    chromeId: 'kbkbfefhhabpkibojinapkkgciiacggg',
  },
  {
    // SiteData - Free Website Traffic Checker & Reverse AdSense Tool
    chromeId: 'emeakbgdecgmdjgegnejpppcnkcnoaen',
    firefoxSlug: 'sitedata',
  },
  {
    // Livestream Chat Reader - Text-to-Speech for YouTube/Twitch chat
    chromeId: 'gpnckbhgpnjciklpoehkmligeaebigaa',
  },
  {
    // ChatGPT Token Counter - Count tokens in real time on chatgpt conversation
    chromeId: 'fjlalaedpfcojcfpkgkglbjjbbkofgnl',
    firefoxSlug: 'chatgpt-token-counter',
  },
  {
    // LinuxDo Scripts - 为 linux.do 用户提供了一些增强功能
    chromeId: 'fbgblmjbeebanackldpbmpacppflgmlj',
    firefoxSlug: 'linux_do-scripts',
  },
  {
    // Zen Virtual Piano - https://zen-piano.web.app/
    chromeId: 'dfacnjidgbagicaekenjgclfnhdnjjdi',
  },
  {
    // Crypto Pulse price tracker - https://get-crypto-pulse.web.app/
    chromeId: 'naeibcegmgpofimedkmfgjgphfhfhlab',
  },
  {
    // Redirect Web - Automatically redirect pages or open them in another app
    chromeId: 'ffglckbhfbfmdkefdmjbhpnffkcmlhdh',
  },
  {
    // Capture It - Capture & Edit Screenshots
    chromeId: 'eglpfhbhmelampoihamjomgkeobgdofl',
  },
  {
    // Teams Chat Exporter
    chromeId: 'jmghclbfbbapimhbgnpffbimphlpolnm',
    firefoxSlug: 'teams-chat-exporter',
  },
  {
    // Lofi BGM Player - Free lofi focus music for work & study
    chromeId: 'jdcppdokgfbnhiacbeplahgnciahnhck',
    firefoxSlug: 'lofi-bgm-player',
  },
  {
    // Margin - Annotate and highlight any webpage, with your notes saved to the decentralized AT Protocol.
    chromeId: 'cgpmbiiagnehkikhcbnhiagfomajncpa',
  },
  {
    // KeyFloat - Floating multilingual keyboard with native key mappings, drag, dark mode, sounds, and dynamic layouts for macOS & Windows
    chromeId: 'mfjdonmgmgcijagclnkfhmjiblbfjaid',
  },
  {
    // Glossy New Tab - Say Goodbye to Boring Tabs with live wallpapers
    chromeId: 'dhiekgdaipindoapjmcnpompdknjeijf',
    firefoxSlug: 'glossy-new-tab',
  },
  {
    // All API Hub – AI Relay & New API Manager - https://github.com/qixing-jk/all-api-hub
    chromeId: 'lapnciffpekdengooeolaienkeoilfeo',
    firefoxSlug: 'all-api-hub',
  },
  {
    // Scrape Similar - Extract data from websites into spreadsheets - https://github.com/zizzfizzix/scrape-similar
    chromeId: 'bhgobenflkkhfcgkikejaaejenoddcmo',
  },
  {
    // isTrust - https://github.com/Internet-Society-Belgium/isTrust/
    chromeId: 'kinlknncggaihnhdcalijdmpbhbflalm',
  },
  {
    // Dymo
    chromeId: 'ojpakgiekphppgkcdihbjpafobhnhlkp',
  },
  {
    // Extension Rank Checker - Extension Ranker
    chromeId: 'pmgehhllikbjmadpenhabejhpemplhmd',
    firefoxSlug: 'rank-checker',
  },
  {
    // PlayFaster - Enhanced playback speed control for online videos and audio
    chromeId: 'fppcbkhpahkbgijkdcpjgjmhpfbmfiih',
    firefoxSlug: 'playfaster',
  },
  {
    // LatTab - Learn Latin With Every New Tab
    chromeId: 'eiocjaocpmackhbaffoejkcmnfbdpgpj',
    firefoxSlug: 'lattab-learn-latin-new-tabs',
  },
  {
    // Vim What? - Interactive Vim command reference
    chromeId: 'ngbehgnlcdjkbnihgpkgdangbhemidge',
    firefoxSlug: 'vim-what',
  },
  {
    // FRED - Fraud Recognition Easy Detection
    chromeId: 'bjdbcabacnlmbpcmiapcdfancfgcakfn',
    firefoxSlug: 'fred',
  },
  {
    // Clear Wisdom - Gems of wisdom from James Clear's 3-2-1 newsletter
    chromeId: 'jijfmgoijddfmlcdghopbkdpelbpmjdm',
    firefoxSlug: 'clear-wisdom',
  },
];

const chromeIds = extensionEntries.flatMap((e) =>
  e.chromeId ? [e.chromeId] : [],
);
const firefoxSlugs = [
  ...new Set(
    extensionEntries.flatMap((e) => (e.firefoxSlug ? [e.firefoxSlug] : [])),
  ),
];

const { data, isLoading } = useListExtensionDetails(chromeIds, firefoxSlugs);

function addUtmSource(storeUrl: string): string {
  const url = new URL(storeUrl);
  url.searchParams.set('utm_source', 'wxt.dev');
  return url.href;
}

const sortedExtensions = computed((): ListedExtension[] => {
  if (!data.value) return [];

  const chromeById = new Map(
    (data.value.chrome ?? []).filter(Boolean).map((e) => [e.id, e]),
  );
  const firefoxBySlug = new Map(
    (data.value.firefox ?? []).filter(Boolean).map((e) => [e.id, e]),
  );

  const results: ListedExtension[] = [];

  for (const entry of extensionEntries) {
    const chrome = entry.chromeId ? chromeById.get(entry.chromeId) : undefined;
    const firefox = entry.firefoxSlug
      ? firefoxBySlug.get(entry.firefoxSlug)
      : undefined;

    if (!chrome && !firefox) continue;

    const primary = chrome ?? firefox!;
    const users = (chrome?.users ?? 0) + (firefox?.users ?? 0);
    const rating = chrome?.rating ?? firefox?.rating;

    const stores: StoreLink[] = [];
    if (chrome) {
      stores.push({ label: 'Chrome', url: addUtmSource(chrome.storeUrl) });
    }
    if (firefox) {
      stores.push({ label: 'Firefox', url: addUtmSource(firefox.storeUrl) });
    }

    results.push({
      id: entry.chromeId ?? `firefox:${entry.firefoxSlug}`,
      name: primary.name,
      iconUrl: primary.iconUrl,
      shortDescription: primary.shortDescription,
      users,
      rating,
      stores,
    });
  }

  const score = (e: ListedExtension) => ((e.rating ?? 5) / 5) * e.users;
  return results.sort((a, b) => score(b) - score(a));
});

function formatUsers(n: number): string {
  return `${n.toLocaleString()} users`;
}

function formatStars(r: number): string {
  const rounded = Math.round(r * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} stars`;
}
</script>

<template>
  <p v-if="isLoading" style="text-align: center; opacity: 50%">Loading...</p>
  <p
    v-else-if="sortedExtensions.length === 0"
    style="text-align: center; opacity: 50%"
  >
    Failed to load extension details.
  </p>
  <ul v-else class="extension-grid">
    <li v-for="extension of sortedExtensions" :key="extension.id">
      <img
        :src="extension.iconUrl"
        :alt="`${extension.name} icon`"
        referrerpolicy="no-referrer"
      />
      <div class="card-content">
        <a
          :href="extension.stores[0]?.url ?? '#'"
          target="_blank"
          :title="extension.name"
          class="extension-name"
          >{{ extension.name }}</a
        >
        <p class="description" :title="extension.shortDescription">
          {{ extension.shortDescription }}
        </p>
        <div v-if="extension.stores.length > 0" class="store-stats">
          <span class="store-stats-info">
            <span>{{ formatUsers(extension.users) }}</span>
            <template v-if="extension.rating">
              <span class="store-stats-sep" aria-hidden="true">,</span>
              <span>{{ formatStars(extension.rating) }}</span>
            </template>
          </span>
          <span class="store-stats-sep" aria-hidden="true">&middot;</span>
          <span class="store-links">
            <a
              v-for="(store, i) of extension.stores"
              :key="store.label"
              :href="store.url"
              target="_blank"
              class="store-link"
              :title="store.label"
            >
              {{ store.label
              }}<span
                v-if="i < extension.stores.length - 1"
                class="store-stats-sep"
                aria-hidden="true"
                >,&nbsp;</span
              >
            </a>
          </span>
        </div>
      </div>
    </li>
  </ul>
  <p class="centered pr">
    <a
      href="https://github.com/wxt-dev/wxt/edit/main/docs/.vitepress/components/UsingWxtSection.vue"
      target="_blank"
      >Open a PR</a
    >
    to add your extension to the list!
  </p>
</template>

<style scoped>
.extension-grid > li > img {
  width: 116px;
  height: 116px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--vp-c-default-soft);
}

.extension-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  align-items: stretch;
  gap: 16px;
  list-style: none;
  margin: 16px 0;
  padding: 0;
}
@media (min-width: 960px) {
  .extension-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.extension-grid > li {
  margin: 0 !important;
  padding: 16px;
  display: flex;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  flex: 1;
  gap: 24px;
  align-items: stretch;
}

.centered {
  text-align: center;
}

.extension-grid > li .description {
  padding: 0;
  margin: 0;
}

.extension-grid > li .card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 0;
}

.store-stats {
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: baseline;
  column-gap: 6px;
  row-gap: 4px;
  text-align: right;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.72;
  color: var(--vp-c-text-2);
}

.store-stats-info {
  display: inline;
}

.store-stats-sep {
  opacity: 0.45;
  user-select: none;
}

.store-links {
  display: inline;
}

.store-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.store-link:hover {
  color: var(--vp-c-text-1);
  text-decoration: underline;
}

.extension-grid > li .extension-name {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  margin: 0;
  text-decoration: none;
  font-size: large;
}

.extension-grid > li .extension-name:hover {
  text-decoration: underline;
}

.extension-grid > li .description {
  opacity: 90%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0 !important;
}

.pr {
  opacity: 70%;
}
</style>
