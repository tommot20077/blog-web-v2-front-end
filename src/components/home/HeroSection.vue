<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  latestArticleUuid?: string
}>()

const readNextHref = computed(() =>
  props.latestArticleUuid ? `/articles/${props.latestArticleUuid}` : '/articles'
)
</script>

<template>
  <section class="hero" data-testid="hero-root">
    <div class="wrap">
      <div class="hero-inner">
        <div class="hero-eyebrow reveal d1">
          <span class="dot-live">042 / Q2 · 2026</span>
          <span>Yuan Luca — writing, slowly.</span>
        </div>

        <h1 class="hero-title reveal d2" data-testid="hero-title">
          慢慢把一件事，<br>
          <span class="em">說</span><span class="accent">清</span>楚。
        </h1>

        <div class="hero-foot-min reveal d3">
          <span>Scroll ↓</span>
          <a class="read-next" :href="readNextHref" data-hover="true">
            <span class="title">Read latest post</span>
            <span class="arr">→</span>
          </a>
        </div>
      </div>

      <div class="scroll-cue">
        <span>SCROLL</span>
        <div class="line"></div>
      </div>
    </div>
  </section>
</template>
