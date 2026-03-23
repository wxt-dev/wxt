<script lang="ts" setup>
import { computed } from 'vue';
import useListExtensionDetails, {
  ChromeExtension,
} from '../composables/useListExtensionDetails';

interface ExtensionEntry {
  chromeId: string;
  firefoxSlug?: string;
}

// Add extension entries to end of the list. On the website, extensions will be sorted by a combination of weekly active users and rating.
// Change the commit message or PR title to: "docs: Added "[extension name]" to the homepage"
// To include a Firefox Add-on link, add a firefoxSlug field with the slug from https://addons.mozilla.org/firefox/addon/{slug}/
const extensionEntries: ExtensionEntry[] = [
  { chromeId: 'ocfdgncpifmegplaglcnglhioflaimkd' }, // GitHub: Better Line Counts
  { chromeId: 'mgmdkjcljneegjfajchedjpdhbadklcf' }, // Anime Skip Player
  { chromeId: 'bfbnagnphiehemkdgmmficmjfddgfhpl' }, // UltraWideo
  { chromeId: 'elfaihghhjjoknimpccccmkioofjjfkf' }, // StayFree - Website Blocker & Web Analytics
  { chromeId: 'okifoaikfmpfcamplcfjkpdnhfodpkil' }, // Doozy: Ai Made Easy
  { chromeId: 'lknmjhcajhfbbglglccadlfdjbaiifig' }, // tl;dv - Record, Transcribe & ChatGPT for Google Meet
  { chromeId: 'oglffgiaiekgeicdgkdlnlkhliajdlja' }, // Youtube中文配音
  { chromeId: 'agjnjboanicjcpenljmaaigopkgdnihi' }, // PreMiD
  { chromeId: 'aiakblgmlabokilgljkglggnpflljdgp' }, // Markdown Sticky Notes
  { chromeId: 'nomnkbngkijpffepcgbbofhcnafpkiep' }, // DocVersionRedirector
  { chromeId: 'ceicccfeikoipigeghddpocceifjelph' }, // Plex Skipper
  { chromeId: 'aelkipgppclpfimeamgmlonimflbhlgf' }, // GitHub Custom Notifier
  { chromeId: 'djnlaiohfaaifbibleebjggkghlmcpcj' }, // Fluent Read
  { chromeId: 'nhclljcpfmmaiojbhhnkpjcfmacfcian' }, // Facebook Video Controls
  { chromeId: 'mblkhbaakhbhiimkbcnmeciblfhmafna' }, // ElemSnap - Quick capture of webpage elements and conversion to images,
  { chromeId: 'oajalfneblkfiejoadecnmodfpnaeblh' }, // MS Edge TTS (Text to Speech)
  { chromeId: 'nedcanggplmbbgmlpcjiafgjcpdimpea' }, // YTBlock - Block any content from YouTube™
  { chromeId: 'oadbjpccljkplmhnjekgjamejnbadlne' }, // demo.fun - Interactive product demos that convert
  { chromeId: 'iopdafdcollfgaoffingmahpffckmjni' }, // SmartEReply: Elevate Your LinkedIn™ Engagement with AI 🚀📈
  { chromeId: 'khjdmjcmpolknpccmaaipmidphjokhdf' }, // WorkFlowy MultiFlow
  { chromeId: 'fencadnndhdeggodopebjgdfdlhcimfk' }, // 香草布丁🌿🍮- https://github.com/Xdy1579883916/vanilla-pudding
  { chromeId: 'bnacincmbaknlbegecpioobkfgejlojp' }, // MaxFocus: Link Preview
  { chromeId: 'bcpgdpedphodjcjlminjbdeejccjbimp' }, // 汇率转换-中文版本
  { chromeId: 'loeilaonggnalkaiiaepbegccilkmjjp' }, // Currency Converter Plus
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
  { chromeId: 'lnjaiaapbakfhlbjenjkhffcdpoompki' }, // Catppuccin for GitHub File Explorer Icons
  { chromeId: 'cpaedhbidlpnbdfegakhiamfpndhjpgf' }, // WebChat: Chat with anyone on any website
  { chromeId: 'fcphghnknhkimeagdglkljinmpbagone' }, // YouTube Auto HD + FPS
  { chromeId: 'lpomjgbicdemjkgmbnkjncgdebogkhlb' }, // MultiViewer Companion
  { chromeId: 'ggiafipgeeaaahnjamgpjcgkdpanhddg' }, // Sync Watch - Watch videos together on any site
  { chromeId: 'nmldnjcblcihmegipecakhmnieiofmgl' }, // Keyword Rank Checker
  { chromeId: 'gppllamhaciichleihemgilcpledblpn' }, // YouTube Simple View - Hide distractions & more
  { chromeId: 'pccbghdfdnnkkbcdcibchpbffdgednkf' }, // Propbar - Property Data Enhancer
  { chromeId: 'lfknakglefggmdkjdfhhofkjnnolffkh' }, // Text Search Pro - Search by case and whole-word match!
  { chromeId: 'mbenhbocjckkbaojacmaepiameldglij' }, // Invoice Generator
  { chromeId: 'phlfhkmdofajnbhgmbmjkbkdgppgoppb' }, // Monthly Bill Tracker
  { chromeId: 'macmkmchfoclhpbncclinhjflmdkaoom' }, // Wandpen - Instantly improve your writing with AI
  { chromeId: 'lhmgechokhmdekdpgkkemoeecelcaonm' }, // YouTube Hider - Remove Comments By Keywords, Usernames & Tools
  { chromeId: 'imgheieooppmahcgniieddodaliodeeg' }, // QA Compass - Record standardized bug reports easily
  { chromeId: 'npgghjedpchajflknnbngajkjkdhncdo' }, // aesthetic Notion, styled
  { chromeId: 'hmdcmlfkchdmnmnmheododdhjedfccka' }, // Eye Dropper
  { chromeId: 'eihpmapodnppeemkhkbhikmggfojdkjd' }, // Cursorful - Screen Recorder with Auto Zoom
  { chromeId: 'hjjkgbibknbahijglkffklflidncplkn' }, // Show IP – Live View of Website IPs for Developers
  { chromeId: 'ilbikcehnpkmldojkcmlldkoelofnbde' }, // Strong Password Generator
  { chromeId: 'ocllfkhcdopiafndigclebelbecaiocp' }, // ZenGram: Mindful Instagram, Your Way
  { chromeId: 'odffpjnpocjfcaclnenaaaddghkgijdb' }, // Blync: Preview Links, Selection Search, AI Assistant
  { chromeId: 'kofbbilhmnkcmibjbioafflgmpkbnmme' }, // HTML to Markdown - Convert webpages to markdown
  { chromeId: 'boecmgggeigllcdocgioijmleimjbfkg' }, // Walmart WFS Profit Calculator
  { chromeId: 'dlnjcbkmomenmieechnmgglgcljhoepd' }, // Youtube Live Chat Fullscreen
  { chromeId: 'keiealdacakpnbbljlmhfgcebmaadieg' }, // Python Code Runner
  { chromeId: 'hafcajcllbjnoolpfngclfmmgpikdhlm' }, // Monochromate
  { chromeId: 'bmoggiinmnodjphdjnmpcnlleamkfedj' }, // AliasVault - Open-Source Password & (Email) Alias Manager
  { chromeId: 'hlnhhamckimoaiekbglafiebkfimhapb' }, // SnapThePrice: AI-Powered Real-time Lowest Price Finder
  { chromeId: 'gdjampjdgjmbifnhldgcnccdjkcoicmg' }, // radiofrance - news & broadcasts (French), music (international)
  { chromeId: 'jlnhphlghikichhgbnkepenehbmloenb' }, // Blens - Time Tracker and AI Insight
  { chromeId: 'njnammmpdodmfkodnfpammnpdcbhnlcm' }, // Always Light Mode - Setting website always in light mode
  { chromeId: 'lblmfclcfniabobmamfkdogcgdagbhhb' }, // DesignPicker - Color Picker & Font Detector
  { chromeId: 'pamnlaoeobcmhkliljfaofekeddpmfoh' }, // Web to PDF
  { chromeId: 'jmbcbeepjfenihlocplnbmbhimcoooka' }, // Online CSV Viewer
  { chromeId: 'nkjcoophmpcmmgadnljnlpbpfdfacgbo' }, // YouTube Video Transcript
  { chromeId: 'lcaieahkjgeggeiihblhcjbbjlppgieh' }, // NetSuite Record Scripts
  { chromeId: 'gmocfknjllodfiomnljmaehcplnekhlo' }, // VueTracker
  { chromeId: 'ggcfemmoabhhelfkhknhbnkmeahloiod' }, // CanCopy - A web extension that allow you to copy any content from website
  { chromeId: 'modkelfkcfjpgbfmnbnllalkiogfofhb' }, // Language Learning with AI
  { chromeId: 'npfopljnjbamegincfjelhjhnonnjloo' }, // Bilibili Feed History Helper
  { chromeId: 'edkhpdceeinkcacjdgebjehipmnbomce' }, // NZBDonkey - The ultimate NZB file download tool
  { chromeId: 'cckggnbnimdbbpmdinkkgbbncopbloob' }, // WeChat Markdown Editor(微信 Markdown 编辑器)
  { chromeId: 'jcblcjolcojmfopefcighfmkkefbaofg' }, // Tab Grab
  { chromeId: 'eehmoikadcijkapfjocnhjclpbaindlb' }, // BrowserLens - https://browserlens.com/
  { chromeId: 'hfhellofkjebbchcdffmicekjdomkcmc' }, // Epic Games Library Extension
  { chromeId: 'gknigcbhlammoakmmdddkblknanpjiac' }, // Zen Analytics Pixel Tracker - zapt.web.app
  { chromeId: 'cnklededohhcbmjjdlbjdkkihkgoggol' }, // Crypto Pulse - Compose your newtab with nature images, widgets & realtime Crypto Price & Bitcoin RSS.
  { chromeId: 'miponnamafdenpgjemkknimgjfibicdc' }, // Youtube Video Scheduler
  { chromeId: 'nhmbcmalgpkjbomhlhgdicanmkkaajmg' }, // Chatslator: Livestream Chat Translator
  { chromeId: 'mbamjfdjbcdgpopfnkkmlohadbbnplhm' }, // 公众号阅读增强器 - https://wxreader.honwhy.wang
  { chromeId: 'hannhecbnjnnbbafffmogdlnajpcomek' }, // 토탐정
  { chromeId: 'ehboaofjncodknjkngdggmpdinhdoijp' }, // 2FAS Pass - https://2fas.com/
  { chromeId: 'hnjamiaoicaepbkhdoknhhcedjdocpkd' }, // Quick Prompt - https://github.com/wenyuanw/quick-prompt
  { chromeId: 'kacblhilkacgfnkjfodalohcnllcgmjd' }, // Add QR Code Generator Icon Back To Address Bar
  { chromeId: 'fkbdlogfdjmpfepbbbjcgcfbgbcfcnne' }, // Piwik PRO Tracking Helper
  { chromeId: 'nkbikckldmljjiiajklecmgmajgapbfl' }, // PIPX - Take Control of Picture-in-Picture, Automatically
  { chromeId: 'hgppdobcpkfkmiegekaglonjajeojmdd' }, // Browsely - AI-powered browser extension
  { chromeId: 'ehmoihnjgkdimihkhokkmfjdgomohjgm' }, // Filmbudd Pro - Simple, private – and synced ratings and watch notes across all your devices
  { chromeId: 'alglchohmdikgdjhafiicilegegieafa' }, // MultiField CopyCat - Copy, Paste & Autofill Web Forms Instantly
  { chromeId: 'aamihahiiogceidpbnfgehacgiecephe' }, // ChatSight - Add Table of Contents to ChatGPT
  { chromeId: 'cndibmoanboadcifjkjbdpjgfedanolh' }, // BetterCampus (prev. BetterCanvas)
  { chromeId: 'hinfimgacobnellbncbcpdlpaapcofaa' }, // Leetcode Fonts - Change fonts in leetcode effortlessly
  { chromeId: 'kbkbfefhhabpkibojinapkkgciiacggg' }, // TranslateManga - Manga Translator & Manga Tracker
  { chromeId: 'emeakbgdecgmdjgegnejpppcnkcnoaen' }, // SiteData - Free Website Traffic Checker & Reverse AdSense Tool
  { chromeId: 'gpnckbhgpnjciklpoehkmligeaebigaa' }, // Livestream Chat Reader - Text-to-Speech for YouTube/Twitch chat
  { chromeId: 'fjlalaedpfcojcfpkgkglbjjbbkofgnl' }, // ChatGPT Token Counter - Count tokens in real time on chatgpt conversation
  { chromeId: 'fbgblmjbeebanackldpbmpacppflgmlj' }, // LinuxDo Scripts - 为 linux.do 用户提供了一些增强功能
  { chromeId: 'dfacnjidgbagicaekenjgclfnhdnjjdi' }, // Zen Virtual Piano - https://zen-piano.web.app/
  { chromeId: 'naeibcegmgpofimedkmfgjgphfhfhlab' }, // Crypto Pulse price tracker - https://get-crypto-pulse.web.app/
  { chromeId: 'ffglckbhfbfmdkefdmjbhpnffkcmlhdh' }, // Redirect Web - Automatically redirect pages or open them in another app
  { chromeId: 'eglpfhbhmelampoihamjomgkeobgdofl' }, // Capture It - Capture & Edit Screenshots
  { chromeId: 'jmghclbfbbapimhbgnpffbimphlpolnm' }, // Teams Chat Exporter
  { chromeId: 'jdcppdokgfbnhiacbeplahgnciahnhck' }, // Lofi BGM Player - Free lofi focus music for work & study
  { chromeId: 'cgpmbiiagnehkikhcbnhiagfomajncpa' }, // Margin - Annotate and highlight any webpage, with your notes saved to the decentralized AT Protocol.
  { chromeId: 'mfjdonmgmgcijagclnkfhmjiblbfjaid' }, // KeyFloat - Floating multilingual keyboard with native key mappings, drag, dark mode, sounds, and dynamic layouts for macOS & Windows
  { chromeId: 'dhiekgdaipindoapjmcnpompdknjeijf' }, // Glossy New Tab - Say Goodbye to Boring Tabs with live wallpapers
  { chromeId: 'lapnciffpekdengooeolaienkeoilfeo' }, // All API Hub – AI Relay & New API Manager - https://github.com/qixing-jk/all-api-hub
  { chromeId: 'bhgobenflkkhfcgkikejaaejenoddcmo' }, // Scrape Similar - Extract data from websites into spreadsheets - https://github.com/zizzfizzix/scrape-similar
  { chromeId: 'kinlknncggaihnhdcalijdmpbhbflalm' }, // isTrust - https://github.com/Internet-Society-Belgium/isTrust/
  { chromeId: 'ojpakgiekphppgkcdihbjpafobhnhlkp' }, // Dymo
  { chromeId: 'pmgehhllikbjmadpenhabejhpemplhmd' }, // Extension Rank Checker - Extension Ranker
];

const chromeExtensionIds = extensionEntries.map((e) => e.chromeId);
const firefoxSlugMap = new Map(
  extensionEntries
    .filter((e) => e.firefoxSlug)
    .map((e) => [e.chromeId, e.firefoxSlug!]),
);

const { data, err, isLoading } = useListExtensionDetails(chromeExtensionIds);
const sortedExtensions = computed(() => {
  if (!data.value?.length) return [];

  return [...data.value]
    .filter((item) => item != null)
    .map((item) => ({
      ...item,
      firefoxUrl: firefoxSlugMap.has(item.id)
        ? `https://addons.mozilla.org/firefox/addon/${firefoxSlugMap.get(item.id)}/?utm_source=wxt.dev`
        : undefined,
      // Sort based on the user count weighted by the rating
      sortKey: ((item.rating ?? 5) / 5) * item.weeklyActiveUsers,
    }))
    .filter((item) => !!item)
    .sort((l, r) => r.sortKey - l.sortKey);
});

function getStoreUrl(extension: ChromeExtension) {
  const url = new URL(extension.storeUrl);
  url.searchParams.set('utm_source', 'wxt.dev');
  return url.href;
}
</script>

<template>
  <p v-if="isLoading" style="text-align: center; opacity: 50%">Loading...</p>
  <p
    v-else-if="err || sortedExtensions.length === 0"
    style="text-align: center; opacity: 50%"
  >
    Failed to load extension details.
  </p>
  <ul v-else>
    <li
      v-for="extension of sortedExtensions"
      :key="extension.id"
      class="relative"
    >
      <img
        :src="extension.iconUrl"
        :alt="`${extension.name} icon`"
        referrerpolicy="no-referrer"
      />
      <div class="relative">
        <a
          :href="getStoreUrl(extension)"
          target="_blank"
          :title="extension.name"
          class="extension-name"
          >{{ extension.name }}</a
        >
        <p class="description" :title="extension.shortDescription">
          {{ extension.shortDescription }}
        </p>
      </div>
      <p class="user-count">
        <span>{{ extension.weeklyActiveUsers.toLocaleString() }} users</span
        ><template v-if="extension.rating != null"
          >,
          <span>{{ extension.rating }} stars</span>
        </template>
      </p>
      <p class="store-links">
        <a
          :href="getStoreUrl(extension)"
          target="_blank"
          title="Chrome Web Store"
          class="store-badge"
          >Chrome</a
        >
        <a
          v-if="extension.firefoxUrl"
          :href="extension.firefoxUrl"
          target="_blank"
          title="Firefox Add-ons"
          class="store-badge firefox"
          >Firefox</a
        >
      </p>
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
li img {
  width: 116px;
  height: 116px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--vp-c-default-soft);
}

ul {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  align-items: stretch;
  gap: 16px;
  list-style: none;
  margin: 16px 0;
  padding: 0;
}
@media (min-width: 960px) {
  ul {
    grid-template-columns: repeat(2, 1fr);
  }
}

li {
  margin: 0 !important;
  padding: 16px;
  display: flex;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  flex: 1;
  gap: 24px;
  align-items: center;
}

.centered {
  text-align: center;
}

li a,
li .user-count,
li .description {
  padding: 0;
  margin: 0;
}
li .user-count {
  opacity: 70%;
  font-size: small;
  position: absolute;
  bottom: 12px;
  right: 16px;
}

li a {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  margin: 0;
  text-decoration: none;
}
li a:hover {
  text-decoration: underline;
}

li div {
  flex: 1;
}

li .description {
  opacity: 90%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16px;
}

li .extension-name {
  font-size: large;
}

.pr {
  opacity: 70%;
}

.relative {
  position: relative;
}

.store-links {
  display: flex;
  gap: 6px;
  position: absolute;
  top: 12px;
  right: 16px;
  margin: 0;
  padding: 0;
}

.store-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}
.store-badge:hover {
  background-color: var(--vp-c-default-3);
  text-decoration: none;
}
</style>
