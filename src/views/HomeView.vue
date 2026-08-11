<template>
  <main class="home">
    <div class="box">
      <h3>Discgolf</h3>

      <a href="https://discgolf.ee/" target="_blank" rel="noopener noreferrer">
        discgolf.ee
      </a>

      <a href="https://thuledg.ee/" target="_blank" rel="noopener noreferrer">
        thuledg.ee
      </a>

      <a href="https://discgolfar.ee/" target="_blank" rel="noopener noreferrer">
        discgolfar.ee
      </a>
    </div>

    <div class="box">
      <h3>Kraam</h3>

      <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
        YouTube
      </a>

      <a href="https://www.lhv.ee" target="_blank" rel="noopener noreferrer">
        LHV
      </a>

      <a href="https://ww-fmovies.com" target="_blank" rel="noopener noreferrer">
        Filmid
      </a>

      <a href="https://en.fmoviesz-to.com" target="_blank" rel="noopener noreferrer">
        Filmid II
      </a>

      <a
          href="https://oilivur.github.io/soiduplaanid/"
          target="_blank"
          rel="noopener noreferrer"
      >
        Sõiduplaanid
      </a>
    </div>

    <div class="box">
      <h3>Ilm</h3>

      <RouterLink to="/weather">
        Ilmakaart
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 32px;
}

.box {
  display: flex;
  flex-direction: column;
  gap: 8px;

  min-width: 220px;
  padding: 20px;

  border: 1px solid #ccc;
  border-radius: 8px;
}

.box h3 {
  margin: 0 0 8px;
}

.box a {
  color: inherit;
}
</style>