<script setup lang="ts">
const navItems = [
    { name: '首頁', path: '/' },
    { name: '文章', path: '/articles' },
    { name: '登入', path: '/login'},
]
</script>
<template>
    <nav>
        <RouterLink 
            v-for="item in navItems" 
            :to="item.path" 
            :key="item.path"
        >
            {{item.name}}
        </RouterLink>
    </nav>
</template>