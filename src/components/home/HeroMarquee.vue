<script setup lang="ts">
// No props — purely presentational hero section
</script>

<template>
  <section class="hero" data-testid="hero-root">
    <div class="hero-inner">
      <h1 class="hero-title" data-testid="hero-title">
        Words.<br>
        Code.<br>
        Ideas.
      </h1>
    </div>

    <!-- Decorative marquee — excluded from accessibility tree -->
    <div class="marquee" data-testid="hero-marquee-track" aria-hidden="true">
      <div class="marquee-track">
        <span>Vue</span>
        <span>·</span>
        <span>TypeScript</span>
        <span>·</span>
        <span>Design</span>
        <span>·</span>
        <span>Writing</span>
        <span>·</span>
        <span>Open Source</span>
        <span>·</span>
        <span>Dev Life</span>
        <span>·</span>
        <span>Web Craft</span>
        <span>·</span>
        <!-- Duplicate set for seamless infinite loop -->
        <span>Vue</span>
        <span>·</span>
        <span>TypeScript</span>
        <span>·</span>
        <span>Design</span>
        <span>·</span>
        <span>Writing</span>
        <span>·</span>
        <span>Open Source</span>
        <span>·</span>
        <span>Dev Life</span>
        <span>·</span>
        <span>Web Craft</span>
        <span>·</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 120px 0 0;
  border-bottom: 1px solid var(--border);
}

.hero-inner {
  padding: 0 48px 64px;
}

.hero-title {
  font-family: var(--f-display);
  font-size: clamp(48px, 8vw, 128px);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.045em;
  margin: 0;
  color: var(--ink);
}

.marquee {
  overflow: hidden;
  border-top: 1px solid var(--divider);
}

.marquee-track {
  display: flex;
  gap: 24px;
  padding: 18px 0;
  animation: marquee 20s linear infinite;
  white-space: nowrap;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  will-change: transform;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
</style>
