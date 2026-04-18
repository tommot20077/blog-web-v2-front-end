<template>
  <footer class="site-footer" data-testid="footer-root">
    <div class="footer-grid">
      <!-- Col 1: Brand -->
      <div class="footer-col footer-brand" data-testid="footer-col-1">
        <span class="footer-brand-name">TomCC</span>
        <p class="footer-brand-tagline">A space for ideas, code, and words.</p>
      </div>

      <!-- Col 2: Explore -->
      <div class="footer-col" data-testid="footer-col-2">
        <h4 class="footer-col-heading">Explore</h4>
        <nav>
          <RouterLink class="footer-link" to="/">Home</RouterLink>
          <RouterLink class="footer-link" to="/articles">Articles</RouterLink>
        </nav>
      </div>

      <!-- Col 3: Connect -->
      <div class="footer-col" data-testid="footer-col-3">
        <h4 class="footer-col-heading">Connect</h4>
        <nav>
          <a
            class="footer-link"
            href="https://github.com/tommot20077"
            target="_blank"
            rel="noopener noreferrer"
          >GitHub ↗</a>
          <a
            class="footer-link"
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
          >Twitter ↗</a>
        </nav>
      </div>

      <!-- Col 4: Legal -->
      <div class="footer-col" data-testid="footer-col-4">
        <h4 class="footer-col-heading">Legal</h4>
        <nav>
          <a class="footer-link" href="#">Privacy Policy</a>
          <a class="footer-link" href="#">Terms of Use</a>
        </nav>
      </div>
    </div>

    <div class="footer-meta">
      <span data-testid="footer-copyright">© 2025 TomCC · Built with Vue</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 80px;
  padding: 48px 0 32px;
  border-top: 1px solid var(--border-strong);
  background: transparent;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 480px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-brand-name {
  font-family: var(--f-display, var(--f-sans));
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
}

.footer-brand-tagline {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-col nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-col-heading {
  font-family: var(--f-mono, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-2, var(--muted));
  margin: 0 0 4px;
}

.footer-link {
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
  width: fit-content;
}

.footer-link:hover {
  color: var(--ink);
}

.footer-meta {
  max-width: 1100px;
  margin: 32px auto 0;
  padding: 20px 32px 0;
  border-top: 1px solid var(--divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-meta span {
  font-family: var(--f-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
</style>
