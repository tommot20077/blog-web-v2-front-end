<script setup lang="ts">
import type { ZoneEntry } from '../../api/mock/data';
import ZoneEntryCard from './ZoneEntryCard.vue';

defineProps<{
  zones: ZoneEntry[];
}>();
</script>

<template>
  <section>
    <h2 class="text-2xl font-bold tracking-wider mb-6" style="color: var(--text-main);">主題專區</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ZoneEntryCard
        v-for="zone in zones"
        :key="zone.slug"
        :zone="zone"
      />
    </div>
  </section>
</template>
