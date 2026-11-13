<script lang="ts" setup>
withDefaults(defineProps<{ title?: string }>(), { title: 'wxt-dev/wxt' });
</script>

<template>
  <div class="hw" role="group">
    <div class="hw-titlebar">
      <span class="hw-lights" aria-hidden="true"><i /><i /><i /></span>
      <span class="hw-title">{{ title }}</span>
    </div>
    <slot />
    <div v-if="$slots.status" class="hw-status">
      <slot name="status" />
    </div>
  </div>
</template>

<!--
  Not scoped on purpose: the window contents (tree, code, terminal) come from
  other components through slots and share these styles.
-->
<style>
.hw {
  --hw-bg: #fafafa;
  --hw-bg-2: #f0f0f1;
  --hw-bg-3: #e6e6e8;
  --hw-line: #dcdce0;
  --hw-fg: #383a42;
  --hw-dim: #7c7f8a;
  --hw-sel: rgba(11, 138, 0, 0.12);
  --hw-kw: #a626a4;
  --hw-st: #50a14f;
  --hw-fn: #4078f2;
  --hw-cm: #8a8b91;
  --hw-pn: #7c7f8a;
  --hw-ok: #0b8a00;
  --hw-cyan: #0184bc;

  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--hw-line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--hw-bg);
  color: var(--hw-fg);
  box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.35);
  font-size: 12.5px;
  text-align: left;
}
.dark .hw {
  --hw-bg: #0b0c0d;
  --hw-bg-2: #070808;
  --hw-bg-3: #131516;
  --hw-line: #1f2224;
  --hw-fg: #d4d7dc;
  --hw-dim: #7d828a;
  --hw-sel: rgba(103, 212, 94, 0.14);
  --hw-kw: #c586e0;
  --hw-st: #8fcf7e;
  --hw-fn: #6fa8ff;
  --hw-cm: #6b7280;
  --hw-pn: #8b919a;
  --hw-ok: #67d45e;
  --hw-cyan: #7dd3fc;
  box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.9);
}

.hw-titlebar {
  position: relative;
  display: flex;
  align-items: center;
  flex: none;
  height: 36px;
  padding: 0 14px;
  background: var(--hw-bg-2);
  border-bottom: 1px solid var(--hw-line);
}
.hw-lights {
  display: flex;
  gap: 7px;
}
.hw-lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--hw-dim);
  opacity: 0.4;
}
.hw-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--hw-dim);
  white-space: nowrap;
}

.hw-status {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: none;
  height: 26px;
  padding: 0 14px;
  background: var(--hw-bg-2);
  border-top: 1px solid var(--hw-line);
  color: var(--hw-dim);
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;
}
.hw-status b {
  margin-left: 4px;
  font-weight: 500;
  color: var(--hw-fg);
}
.hw-status .right {
  margin-left: auto;
}

/* File tree */
.hw-tree {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  background: var(--hw-bg-2);
  border-right: 1px solid var(--hw-line);
}
.hw-node {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 3px 10px;
  color: var(--hw-dim);
  white-space: nowrap;
}
.hw-node.dir {
  color: var(--hw-fg);
}
.hw-node.link {
  cursor: pointer;
  color: var(--hw-fg);
}
.hw-node.link:hover {
  background: var(--hw-bg-3);
}
.hw-node.on {
  background: var(--hw-sel) !important;
}
.hw-node:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.hw-chev {
  display: inline-block;
  width: 12px;
  margin-right: 2px;
  color: var(--hw-dim);
}

/* Editor panes */
.hw-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.hw-tabbar {
  display: flex;
  flex: none;
  height: 32px;
  background: var(--hw-bg-2);
  border-bottom: 1px solid var(--hw-line);
  overflow: hidden;
}
.hw-tab {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--hw-dim);
  white-space: nowrap;
}
button.hw-tab {
  cursor: pointer;
}
button.hw-tab:hover {
  color: var(--hw-fg);
}
button.hw-tab:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.hw-tab.on {
  color: var(--hw-fg);
  background: var(--hw-bg);
  border-right: 1px solid var(--hw-line);
  box-shadow: inset 0 -1px 0 var(--hw-bg);
}

.hw-code {
  flex: 1;
  margin: 0;
  padding: 14px 0;
  overflow-x: auto;
  font: 13px/1.7 var(--wxt-home-mono);
  background: transparent;
}
.hw-code code {
  display: block;
  font: inherit;
  background: none;
  color: inherit;
  padding: 0;
}
.hw-ln {
  display: block;
  white-space: pre;
  padding-right: 16px;
}
.hw-num {
  display: inline-block;
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: var(--hw-dim);
  opacity: 0.55;
  user-select: none;
}
.hw-code .kw {
  color: var(--hw-kw);
}
.hw-code .st {
  color: var(--hw-st);
}
.hw-code .fn {
  color: var(--hw-fn);
}
.hw-code .cm {
  color: var(--hw-cm);
  font-style: italic;
}
.hw-code .pn {
  color: var(--hw-pn);
}

/* Terminal output */
.hw-term {
  flex: 1;
  padding: 16px 18px;
  font: 12.5px/1.7 var(--wxt-home-mono);
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--hw-bg);
}
.hw .hw-term p {
  margin: 0;
  padding: 0;
  line-height: inherit;
  white-space: pre;
}
.hw .hw-term .gap {
  margin-top: 10px;
}
.hw-term .prompt {
  margin-right: 8px;
  color: var(--hw-ok);
}
.hw-term .dim {
  color: var(--hw-dim);
}
.hw-term .ok {
  color: var(--hw-ok);
}
.hw-term .cyan {
  color: var(--hw-cyan);
}
.hw-term .bold {
  font-weight: 700;
}
.hw-term .sel {
  font-weight: 700;
  color: var(--hw-cyan);
}

@media (max-width: 640px) {
  .hw-code {
    font-size: 12px;
  }
  .hw-num {
    width: 32px;
    padding-right: 10px;
  }
  .hw-status {
    gap: 12px;
  }
  .hw-status .right {
    display: none;
  }
}
</style>
