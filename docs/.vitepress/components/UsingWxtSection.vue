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

// Add extension entries to end of the list. On the website, extensions will be sorted by a combination of users and rating.
// Change the commit message or PR title to: "docs: Added "[extension name]" to the homepage"
// Use `chromeId` for the Chrome Web Store listing, `firefoxSlug` for Firefox Add-ons (slug from https://addons.mozilla.org/firefox/addon/{slug}/). You may set one or both.
const extensionEntries: ExtensionEntry[] = [
  {
    chromeId: 'ocfdgncpifmegplaglcnglhioflaimkd',
    firefoxSlug: 'github-better-line-counts',
  }, // GitHub: Better Line Counts
  { chromeId: 'mgmdkjcljneegjfajchedjpdhbadklcf', firefoxSlug: 'anime-skip' }, // Anime Skip Player
  { chromeId: 'bfbnagnphiehemkdgmmficmjfddgfhpl', firefoxSlug: 'ultrawideo' }, // UltraWideo
  { chromeId: 'elfaihghhjjoknimpccccmkioofjjfkf', firefoxSlug: 'stayfree' }, // StayFree - Website Blocker & Web Analytics
  { chromeId: 'okifoaikfmpfcamplcfjkpdnhfodpkil' }, // Doozy: Ai Made Easy
  { chromeId: 'lknmjhcajhfbbglglccadlfdjbaiifig' }, // tl;dv - Record, Transcribe & ChatGPT for Google Meet
  { chromeId: 'oglffgiaiekgeicdgkdlnlkhliajdlja' }, // Youtube中文配音
  { chromeId: 'agjnjboanicjcpenljmaaigopkgdnihi' }, // PreMiD
  {
    chromeId: 'aiakblgmlabokilgljkglggnpflljdgp',
    firefoxSlug: 'markdown-sticky-notes',
  }, // Markdown Sticky Notes
  { chromeId: 'nomnkbngkijpffepcgbbofhcnafpkiep' }, // DocVersionRedirector
  { chromeId: 'ceicccfeikoipigeghddpocceifjelph', firefoxSlug: 'plex-skipper' }, // Plex Skipper
  {
    chromeId: 'aelkipgppclpfimeamgmlonimflbhlgf',
    firefoxSlug: 'github-custom-notifier',
  }, // GitHub Custom Notifier
  { chromeId: 'djnlaiohfaaifbibleebjggkghlmcpcj' }, // Fluent Read
  {
    chromeId: 'nhclljcpfmmaiojbhhnkpjcfmacfcian',
    firefoxSlug: 'facebook-video-controls',
  }, // Facebook Video Controls
  { chromeId: 'mblkhbaakhbhiimkbcnmeciblfhmafna' }, // ElemSnap - Quick capture of webpage elements and conversion to images,
  {
    chromeId: 'oajalfneblkfiejoadecnmodfpnaeblh',
    firefoxSlug: 'ms-edge-tts-text-to-speech',
  }, // MS Edge TTS (Text to Speech)
  { chromeId: 'nedcanggplmbbgmlpcjiafgjcpdimpea' }, // YTBlock - Block any content from YouTube™
  { chromeId: 'oadbjpccljkplmhnjekgjamejnbadlne' }, // demo.fun - Interactive product demos that convert
  { chromeId: 'iopdafdcollfgaoffingmahpffckmjni' }, // SmartEReply: Elevate Your LinkedIn™ Engagement with AI 🚀📈
  { chromeId: 'khjdmjcmpolknpccmaaipmidphjokhdf' }, // WorkFlowy MultiFlow
  { chromeId: 'fencadnndhdeggodopebjgdfdlhcimfk' }, // 香草布丁🌿🍮- https://github.com/Xdy1579883916/vanilla-pudding
  {
    chromeId: 'bnacincmbaknlbegecpioobkfgejlojp',
    firefoxSlug: 'maxfocus-link-preview',
  }, // MaxFocus: Link Preview
  { chromeId: 'bcpgdpedphodjcjlminjbdeejccjbimp' }, // 汇率转换-中文版本
  {
    chromeId: 'loeilaonggnalkaiiaepbegccilkmjjp',
    firefoxSlug: 'currency-converter-plus',
  }, // Currency Converter Plus
  { chromeId: 'npcnninnjghigjfiecefheeibomjpkak' }, // Respond Easy
  { chromeId: 'cfkdcideecefncbglkhneoflfnmhoicc' }, // mindful - stay focused on your goals
  { chromeId: 'lnhejcpclabmbgpiiomjbhalblnnbffg' }, // 1Proompt
  { chromeId: 'fonflmjnjbkigocpoommgmhljdpljain' }, // NiceTab - https://github.com/web-dahuyou/NiceTab
  { chromeId: 'fcffekbnfcfdemeekijbbmgmkognnmkd' }, // Draftly for LinkedIn
  { chromeId: 'nkndldfehcidpejfkokbeghpnlbppdmo' }, // YouTube Summarized - Summarize any YouTube video
  { chromeId: 'dbichmdlbjdeplpkhcejgkakobjbjalc' }, // 社媒助手 - https://github.com/iszhouhua/social-media-copilot
  { chromeId: 'opepfpjeogkbgeigkbepobceinnfmjdd' }, // Dofollow Links for SEO
  { chromeId: 'pdnenlnelpdomajfejgapbdpmjkfpjkp' }, // ChatGPT Writer: Use AI on Any Site (GPT-4o, Claude, Gemini, and More)
  { chromeId: 'jobnhifpphkgoelnhnopgkdhbdkiadmj' }, // discord message translator
  { chromeId: 'ncokhechhpjgjonhjnlaneglmdkfkcbj' }, // Habit Tracker app widget for daily habit tracking
  {
    chromeId: 'lnjaiaapbakfhlbjenjkhffcdpoompki',
    firefoxSlug: 'catppuccin-web-file-icons',
  }, // Catppuccin for GitHub File Explorer Icons
  { chromeId: 'cpaedhbidlpnbdfegakhiamfpndhjpgf' }, // WebChat: Chat with anyone on any website
  {
    chromeId: 'fcphghnknhkimeagdglkljinmpbagone',
    firefoxSlug: 'youtube-auto-hd-fps',
  }, // YouTube Auto HD + FPS
  {
    chromeId: 'lpomjgbicdemjkgmbnkjncgdebogkhlb',
    firefoxSlug: 'multiviewer-companion',
  }, // MultiViewer Companion
  { chromeId: 'ggiafipgeeaaahnjamgpjcgkdpanhddg', firefoxSlug: 'syncwatch' }, // Sync Watch - Watch videos together on any site
  {
    chromeId: 'nmldnjcblcihmegipecakhmnieiofmgl',
    firefoxSlug: 'keyword-rank-checker-sa',
  }, // Keyword Rank Checker
  {
    chromeId: 'gppllamhaciichleihemgilcpledblpn',
    firefoxSlug: 'youtube-simple-view',
  }, // YouTube Simple View - Hide distractions & more
  { chromeId: 'pccbghdfdnnkkbcdcibchpbffdgednkf' }, // Propbar - Property Data Enhancer
  {
    chromeId: 'lfknakglefggmdkjdfhhofkjnnolffkh',
    firefoxSlug: 'text-search-pro-ext',
  }, // Text Search Pro - Search by case and whole-word match!
  {
    chromeId: 'mbenhbocjckkbaojacmaepiameldglij',
    firefoxSlug: 'quick-invoice-generator',
  }, // Invoice Generator
  { chromeId: 'phlfhkmdofajnbhgmbmjkbkdgppgoppb' }, // Monthly Bill Tracker
  { chromeId: 'macmkmchfoclhpbncclinhjflmdkaoom' }, // Wandpen - Instantly improve your writing with AI
  { chromeId: 'lhmgechokhmdekdpgkkemoeecelcaonm' }, // YouTube Hider - Remove Comments By Keywords, Usernames & Tools
  { chromeId: 'imgheieooppmahcgniieddodaliodeeg' }, // QA Compass - Record standardized bug reports easily
  { chromeId: 'npgghjedpchajflknnbngajkjkdhncdo' }, // aesthetic Notion, styled
  { chromeId: 'hmdcmlfkchdmnmnmheododdhjedfccka', firefoxSlug: 'eye_dropper' }, // Eye Dropper
  { chromeId: 'eihpmapodnppeemkhkbhikmggfojdkjd' }, // Cursorful - Screen Recorder with Auto Zoom
  { chromeId: 'hjjkgbibknbahijglkffklflidncplkn' }, // Show IP – Live View of Website IPs for Developers
  {
    chromeId: 'ilbikcehnpkmldojkcmlldkoelofnbde',
    firefoxSlug: 'strongpasswordgenerator',
  }, // Strong Password Generator
  { chromeId: 'ocllfkhcdopiafndigclebelbecaiocp' }, // ZenGram: Mindful Instagram, Your Way
  { chromeId: 'odffpjnpocjfcaclnenaaaddghkgijdb' }, // Blync: Preview Links, Selection Search, AI Assistant
  { chromeId: 'kofbbilhmnkcmibjbioafflgmpkbnmme' }, // HTML to Markdown - Convert webpages to markdown
  {
    chromeId: 'boecmgggeigllcdocgioijmleimjbfkg',
    firefoxSlug: 'walmart-wfs-profit-calculator',
  }, // Walmart WFS Profit Calculator
  {
    chromeId: 'dlnjcbkmomenmieechnmgglgcljhoepd',
    firefoxSlug: 'youtube-live-chat-fullscreen',
  }, // Youtube Live Chat Fullscreen
  {
    chromeId: 'keiealdacakpnbbljlmhfgcebmaadieg',
    firefoxSlug: 'code-runner-manager',
  }, // Python Code Runner
  { chromeId: 'hafcajcllbjnoolpfngclfmmgpikdhlm' }, // Monochromate
  { chromeId: 'bmoggiinmnodjphdjnmpcnlleamkfedj' }, // AliasVault - Open-Source Password & (Email) Alias Manager
  { chromeId: 'hlnhhamckimoaiekbglafiebkfimhapb' }, // SnapThePrice: AI-Powered Real-time Lowest Price Finder
  { chromeId: 'gdjampjdgjmbifnhldgcnccdjkcoicmg' }, // radiofrance - news & broadcasts (French), music (international)
  {
    chromeId: 'jlnhphlghikichhgbnkepenehbmloenb',
    firefoxSlug: 'blens-timetracker-ai-insight',
  }, // Blens - Time Tracker and AI Insight
  { chromeId: 'njnammmpdodmfkodnfpammnpdcbhnlcm' }, // Always Light Mode - Setting website always in light mode
  {
    chromeId: 'lblmfclcfniabobmamfkdogcgdagbhhb',
    firefoxSlug: 'design-colorpicker-fontdetect',
  }, // DesignPicker - Color Picker & Font Detector
  {
    chromeId: 'pamnlaoeobcmhkliljfaofekeddpmfoh',
    firefoxSlug: 'export-web-to-pdf',
  }, // Web to PDF
  { chromeId: 'jmbcbeepjfenihlocplnbmbhimcoooka', firefoxSlug: 'csv-viewer' }, // Online CSV Viewer
  {
    chromeId: 'nkjcoophmpcmmgadnljnlpbpfdfacgbo',
    firefoxSlug: 'youtube-transcript-copy',
  }, // YouTube Video Transcript
  {
    chromeId: 'lcaieahkjgeggeiihblhcjbbjlppgieh',
    firefoxSlug: 'netsuite-scripts-manager',
  }, // NetSuite Record Scripts
  { chromeId: 'gmocfknjllodfiomnljmaehcplnekhlo' }, // VueTracker
  { chromeId: 'ggcfemmoabhhelfkhknhbnkmeahloiod' }, // CanCopy - A web extension that allow you to copy any content from website
  { chromeId: 'modkelfkcfjpgbfmnbnllalkiogfofhb', firefoxSlug: 'intersub' }, // Language Learning with AI
  { chromeId: 'npfopljnjbamegincfjelhjhnonnjloo' }, // Bilibili Feed History Helper
  { chromeId: 'edkhpdceeinkcacjdgebjehipmnbomce' }, // NZBDonkey - The ultimate NZB file download tool
  { chromeId: 'cckggnbnimdbbpmdinkkgbbncopbloob' }, // WeChat Markdown Editor(微信 Markdown 编辑器)
  { chromeId: 'jcblcjolcojmfopefcighfmkkefbaofg', firefoxSlug: 'tab-grab' }, // Tab Grab
  { chromeId: 'eehmoikadcijkapfjocnhjclpbaindlb', firefoxSlug: 'browserlens' }, // BrowserLens - https://browserlens.com/
  {
    chromeId: 'hfhellofkjebbchcdffmicekjdomkcmc',
    firefoxSlug: 'epic-games-library-extension',
  }, // Epic Games Library Extension
  { chromeId: 'gknigcbhlammoakmmdddkblknanpjiac' }, // Zen Analytics Pixel Tracker - zapt.web.app
  { chromeId: 'cnklededohhcbmjjdlbjdkkihkgoggol' }, // Crypto Pulse - Compose your newtab with nature images, widgets & realtime Crypto Price & Bitcoin RSS.
  {
    chromeId: 'miponnamafdenpgjemkknimgjfibicdc',
    firefoxSlug: 'youtube-video-scheduler',
  }, // Youtube Video Scheduler
  { chromeId: 'nhmbcmalgpkjbomhlhgdicanmkkaajmg', firefoxSlug: 'chatslator' }, // Chatslator: Livestream Chat Translator
  { chromeId: 'mbamjfdjbcdgpopfnkkmlohadbbnplhm' }, // 公众号阅读增强器 - https://wxreader.honwhy.wang
  { chromeId: 'hannhecbnjnnbbafffmogdlnajpcomek', firefoxSlug: '토탐정' }, // 토탐정
  {
    chromeId: 'ehboaofjncodknjkngdggmpdinhdoijp',
    firefoxSlug: '2fas-pass-browser-extension',
  }, // 2FAS Pass - https://2fas.com/
  { chromeId: 'hnjamiaoicaepbkhdoknhhcedjdocpkd', firefoxSlug: 'quick-prompt' }, // Quick Prompt - https://github.com/wenyuanw/quick-prompt
  { chromeId: 'kacblhilkacgfnkjfodalohcnllcgmjd' }, // Add QR Code Generator Icon Back To Address Bar
  {
    chromeId: 'fkbdlogfdjmpfepbbbjcgcfbgbcfcnne',
    firefoxSlug: 'piwik-pro-tracking-helper',
  }, // Piwik PRO Tracking Helper
  { chromeId: 'nkbikckldmljjiiajklecmgmajgapbfl' }, // PIPX - Take Control of Picture-in-Picture, Automatically
  { chromeId: 'hgppdobcpkfkmiegekaglonjajeojmdd' }, // Browsely - AI-powered browser extension
  { chromeId: 'ehmoihnjgkdimihkhokkmfjdgomohjgm' }, // Filmbudd Pro - Simple, private – and synced ratings and watch notes across all your devices
  { chromeId: 'alglchohmdikgdjhafiicilegegieafa' }, // MultiField CopyCat - Copy, Paste & Autofill Web Forms Instantly
  { chromeId: 'aamihahiiogceidpbnfgehacgiecephe' }, // ChatSight - Add Table of Contents to ChatGPT
  {
    chromeId: 'cndibmoanboadcifjkjbdpjgfedanolh',
    firefoxSlug: 'better-canvas',
  }, // BetterCampus (prev. BetterCanvas)
  { chromeId: 'hinfimgacobnellbncbcpdlpaapcofaa' }, // Leetcode Fonts - Change fonts in leetcode effortlessly
  { chromeId: 'kbkbfefhhabpkibojinapkkgciiacggg' }, // TranslateManga - Manga Translator & Manga Tracker
  { chromeId: 'emeakbgdecgmdjgegnejpppcnkcnoaen', firefoxSlug: 'sitedata' }, // SiteData - Free Website Traffic Checker & Reverse AdSense Tool
  { chromeId: 'gpnckbhgpnjciklpoehkmligeaebigaa' }, // Livestream Chat Reader - Text-to-Speech for YouTube/Twitch chat
  {
    chromeId: 'fjlalaedpfcojcfpkgkglbjjbbkofgnl',
    firefoxSlug: 'chatgpt-token-counter',
  }, // ChatGPT Token Counter - Count tokens in real time on chatgpt conversation
  {
    chromeId: 'fbgblmjbeebanackldpbmpacppflgmlj',
    firefoxSlug: 'linux_do-scripts',
  }, // LinuxDo Scripts - 为 linux.do 用户提供了一些增强功能
  { chromeId: 'dfacnjidgbagicaekenjgclfnhdnjjdi' }, // Zen Virtual Piano - https://zen-piano.web.app/
  { chromeId: 'naeibcegmgpofimedkmfgjgphfhfhlab' }, // Crypto Pulse price tracker - https://get-crypto-pulse.web.app/
  { chromeId: 'ffglckbhfbfmdkefdmjbhpnffkcmlhdh' }, // Redirect Web - Automatically redirect pages or open them in another app
  { chromeId: 'eglpfhbhmelampoihamjomgkeobgdofl' }, // Capture It - Capture & Edit Screenshots
  {
    chromeId: 'jmghclbfbbapimhbgnpffbimphlpolnm',
    firefoxSlug: 'teams-chat-exporter',
  }, // Teams Chat Exporter
  {
    chromeId: 'jdcppdokgfbnhiacbeplahgnciahnhck',
    firefoxSlug: 'lofi-bgm-player',
  }, // Lofi BGM Player - Free lofi focus music for work & study
  { chromeId: 'cgpmbiiagnehkikhcbnhiagfomajncpa' }, // Margin - Annotate and highlight any webpage, with your notes saved to the decentralized AT Protocol.
  { chromeId: 'mfjdonmgmgcijagclnkfhmjiblbfjaid' }, // KeyFloat - Floating multilingual keyboard with native key mappings, drag, dark mode, sounds, and dynamic layouts for macOS & Windows
  {
    chromeId: 'dhiekgdaipindoapjmcnpompdknjeijf',
    firefoxSlug: 'glossy-new-tab',
  }, // Glossy New Tab - Say Goodbye to Boring Tabs with live wallpapers
  { chromeId: 'lapnciffpekdengooeolaienkeoilfeo', firefoxSlug: 'all-api-hub' }, // All API Hub – AI Relay & New API Manager - https://github.com/qixing-jk/all-api-hub
  { chromeId: 'bhgobenflkkhfcgkikejaaejenoddcmo' }, // Scrape Similar - Extract data from websites into spreadsheets - https://github.com/zizzfizzix/scrape-similar
  { chromeId: 'kinlknncggaihnhdcalijdmpbhbflalm' }, // isTrust - https://github.com/Internet-Society-Belgium/isTrust/
  { chromeId: 'ojpakgiekphppgkcdihbjpafobhnhlkp' }, // Dymo
  { chromeId: 'pmgehhllikbjmadpenhabejhpemplhmd', firefoxSlug: 'rank-checker' }, // Extension Rank Checker - Extension Ranker
];

const chromeIds = extensionEntries.flatMap((e) =>
  e.chromeId ? [e.chromeId] : [],
);
const firefoxSlugs = [
  ...new Set(
    extensionEntries.flatMap((e) => (e.firefoxSlug ? [e.firefoxSlug] : [])),
  ),
];

// Map chromeId <-> firefoxSlug for dual-listed entries
const chromeToFirefox = new Map<string, string>();
for (const e of extensionEntries) {
  if (e.chromeId && e.firefoxSlug) {
    chromeToFirefox.set(e.chromeId, e.firefoxSlug);
  }
}

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

  const results: (ListedExtension & { sortKey: number })[] = [];

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
      sortKey: ((rating ?? 5) / 5) * users,
    });
  }

  return results
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey: _s, ...rest }) => rest);
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
        <span class="extension-name" :title="extension.name">{{
          extension.name
        }}</span>
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
  padding: 0;
  margin: 0;
  font-size: large;
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
