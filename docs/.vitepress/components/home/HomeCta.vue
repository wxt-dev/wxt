<script lang="ts" setup></script>

<template>
  <section class="cta">
    <div class="card">
      <p class="count" aria-hidden="true"><span>T-00</span> · LIFTOFF</p>
      <h2>Start building your extension.</h2>
      <p class="command">
        <span class="prompt">$</span> pnpm dlx wxt@latest init
      </p>
      <div class="actions">
        <a class="btn primary" href="/guide/installation">Get Started</a>
        <a class="btn" href="/guide/resources/showcase">See the showcase</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  padding: 72px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  text-align: center;
  background:
    radial-gradient(
      60% 90% at 50% 120%,
      color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent),
      transparent
    ),
    var(--wxt-c-bg-panel);
}

.count {
  margin: 0;
  font: 500 12px/1 var(--wxt-home-mono);
  letter-spacing: 0.14em;
  color: var(--vp-c-text-3);
}
.count span {
  color: var(--vp-c-brand-1);
}

h2 {
  margin: 14px 0 0;
  padding: 0;
  border: 0;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.command {
  display: inline-block;
  margin: 28px 0 0;
  padding: 11px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  font: 14px/1.4 var(--wxt-home-mono);
  color: var(--vp-c-text-1);
}
.prompt {
  margin-right: 6px;
  color: var(--vp-c-brand-1);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}
.btn {
  padding: 10px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}
.btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}
.btn.primary {
  border-color: transparent;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}
.btn.primary:hover {
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
}
</style>
