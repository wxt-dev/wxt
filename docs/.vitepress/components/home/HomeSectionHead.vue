<script lang="ts" setup>
defineProps<{
  /** Countdown shown above the title, e.g. "05" renders "T-05". */
  count?: string;
  title: string;
  center?: boolean;
}>();
</script>

<template>
  <header class="head" :class="{ center }">
    <p v-if="count != null" class="count" aria-hidden="true">
      <i v-if="center" class="before" />
      <span>T-{{ count }}</span>
      <i />
    </p>
    <h2>{{ title }}</h2>
    <p v-if="$slots.default" class="sub"><slot /></p>
  </header>
</template>

<style scoped>
.head {
  margin-bottom: 44px;
}
.head.center {
  text-align: center;
}

.count {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  max-width: 220px;
  font: 500 12px/1 var(--wxt-home-mono);
  letter-spacing: 0.14em;
  color: var(--vp-c-text-3);
}
.count span {
  color: var(--vp-c-brand-1);
}
.count i {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--vp-c-divider), transparent);
}
.center .count {
  max-width: 360px;
  margin-inline: auto;
}
.count i.before {
  background: linear-gradient(to left, var(--vp-c-divider), transparent);
}

.head h2 {
  margin: 14px 0 0;
  padding: 0;
  border: 0;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.sub {
  max-width: 560px;
  margin: 14px 0 0;
  font-size: 17px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.center .sub {
  margin-inline: auto;
}
</style>
