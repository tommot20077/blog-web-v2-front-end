<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  heroTitle?: string;
  heroTagline?: string;
  titleTestId?: string;
}>();
</script>

<template>
  <div class="auth-shell">
    <!-- Left hero panel -->
    <div class="auth-hero">
      <div class="auth-hero__quote" v-html="heroTitle || 'Share your<br>thoughts.'" />
      <p v-if="heroTagline" class="auth-hero__tagline">{{ heroTagline }}</p>
    </div>

    <!-- Right form column -->
    <div class="auth-form-col">
      <div class="auth-form-col__inner">
        <h1 class="auth-form-col__heading" :data-testid="titleTestId">{{ title }}</h1>
        <p
          v-if="subtitle"
          data-testid="auth-subtitle"
          class="auth-form-col__subtitle"
        >
          {{ subtitle }}
        </p>

        <!-- Form fields slot -->
        <div class="auth-form-col__body">
          <slot />
        </div>

        <!-- Footer / alt-action link -->
        <div class="auth-form-col__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ AUTH SPLIT-SCREEN SHELL ============ */
.auth-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
}

/* Left hero panel */
.auth-hero {
  flex: 0 0 42%;
  background: var(--bg-sub, #ededed);
  border-right: 1px solid var(--border, rgba(10, 10, 11, 0.10));
  padding: 140px 56px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.auth-hero::before {
  content: "";
  position: absolute;
  inset: 140px 56px 56px;
  background: repeating-linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.045) 0 1px,
    transparent 1px 22px
  );
  pointer-events: none;
}

[data-theme="dark"] .auth-hero::before {
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0 1px,
    transparent 1px 22px
  );
}

.auth-hero__quote {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 400;
  font-size: clamp(40px, 4vw, 64px);
  line-height: 1.05;
  letter-spacing: -0.028em;
  max-width: 12ch;
  position: relative;
  z-index: 1;
  color: var(--ink, #0a0a0b);
}

.auth-hero__tagline {
  font-family: var(--f-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted, #6b6b70);
  position: relative;
  z-index: 1;
  margin: 0;
}

/* Right form column */
.auth-form-col {
  flex: 1 1 0%;
  padding: 140px 56px 56px;
  display: flex;
  flex-direction: column;
  background: var(--bg, #f4f4f4);
}

.auth-form-col__inner {
  max-width: 420px;
  width: 100%;
}

.auth-form-col__heading {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 500;
  font-size: 56px;
  line-height: 1;
  letter-spacing: -0.03em;
  margin: 0 0 18px;
  color: var(--ink, #0a0a0b);
}

.auth-form-col__subtitle {
  font-size: 15px;
  line-height: 1.7;
  color: var(--muted, #6b6b70);
  max-width: 44ch;
  margin: 0 0 32px;
}

.auth-form-col__body {
  display: grid;
  gap: 22px;
}

.auth-form-col__footer {
  margin-top: 24px;
  font-size: 14px;
}

/* auth-field utility (for views to use on inputs) */
:deep(.auth-field) {
  display: grid;
  gap: 8px;
}

:deep(.auth-field label) {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted, #6b6b70);
}

:deep(.auth-field input) {
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border-strong, rgba(10, 10, 11, 0.18));
  padding: 12px 0;
  font: inherit;
  font-size: 17px;
  color: var(--ink, #0a0a0b);
  transition: border-color 0.25s;
}

:deep(.auth-field input:focus) {
  outline: none;
  border-bottom-color: var(--accent, #5B8DEF);
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .auth-shell {
    flex-direction: column;
  }

  .auth-hero {
    flex: 0 0 auto;
    min-height: 240px;
    padding: 64px 32px 40px;
  }

  .auth-form-col {
    padding: 48px 32px 48px;
  }

  .auth-form-col__heading {
    font-size: 40px;
  }
}
</style>
