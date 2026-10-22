<script setup>
import { ref } from 'vue'
const saved = ref(false)
const color = ref('blue')
const accents = { blue: '#304bea', orange: '#b5552c', green: '#53704a' }
const bars = ref(null)
function replay() {
  bars.value.classList.remove('play')
  void bars.value.offsetWidth
  bars.value.classList.add('play')
}
</script>

<template>
<div class="mavis-home">
<a class="skip" href="#main">Skip to content</a>
<header class="wrap">
  <a href="#" class="brand" aria-label="Mavis UI home"><span class="mark">m</span> mavis<span class="brand-ui">ui</span></a>
  <nav aria-label="Main navigation"><a href="#playground">A first look</a><a href="#foundation">The foundation</a><a class="github" href="https://github.com/getcortexlabs/mavis-ui">GitHub <span aria-hidden="true">↗</span></a></nav>
</header>
<main id="main">
<section class="hero wrap">
  <div class="hero-copy">
    <div class="eyebrow"><span class="status-dot"></span> A NEW CHAPTER FOR NATIVE UI</div>
    <h1>Native,<br>with <span class="serif">feeling.</span><span class="asterisk" aria-hidden="true">✳</span></h1>
    <p class="intro">Good interfaces do more than look good.<br>They feel right, every time you touch them.</p>
    <p class="description">We're building Mavis UI: thoughtful components for NativeScript, starting with Vue. Motion and navigation woven in.</p>
    <div class="hero-actions"><a class="button primary" href="#playground">Meet Mavis <span aria-hidden="true">↘</span></a><a class="text-link" href="https://github.com/getcortexlabs/mavis-ui">Follow the build <span aria-hidden="true">↗</span></a></div>
    <div class="early"><span class="small-dot"></span> In development. Made for iOS & Android.</div>
  </div>
  <div class="showcase" aria-label="Illustrative interface design preview">
    <div class="orbit" aria-hidden="true"></div>
    <div class="float-tag tag-top"><span class="mini-star">✳</span> A little more character.</div>
    <div class="phone">
      <div class="phone-status"><span>9:41</span><span aria-hidden="true">▮▮▮ &nbsp; ▰</span></div>
      <div class="phone-header"><span class="mini-brand">m.</span><span class="avatar">JD</span></div>
      <div class="phone-greeting">MAKE ROOM FOR A GOOD DAY</div>
      <h2>Your own<br>kind of <em>flow.</em></h2>
      <div class="art" aria-hidden="true"><div class="sculpture s1"></div><div class="sculpture s2"></div><div class="sculpture s3"></div><span>LESS NOISE. MORE YOU.</span></div>
      <div class="daily-row"><div><small>YOUR DAILY SPACE</small><strong>A fresh perspective</strong></div><span class="round-arrow" aria-hidden="true">↗</span></div>
      <div class="phone-bottom"><span class="selected">⌂ <small>Home</small></span><span>◈ <small>Explore</small></span><span>☷ <small>Saved</small></span></div>
      <div class="home-indicator"></div>
    </div>
    <div class="float-tag tag-bottom"><span class="tick">✓</span><div>Feels right.<small>That's the whole point.</small></div></div>
    <span class="preview-caption">DESIGN EXPLORATION / 001</span>
  </div>
</section>
<div class="platform-strip"><div class="wrap"><span>THOUGHTFULLY CONNECTED</span><span>NativeScript · Vue first</span><span class="strip-plus">+</span><a href="https://jolt.rafaelaugusto.dev/">Jolt <span>↗</span></a><span class="strip-plus">+</span><a href="https://vue-router-ns.rafaelaugusto.dev/">vue-router-ns <span>↗</span></a></div></div>
<section class="playground wrap" id="playground">
  <div class="section-heading"><div><div class="eyebrow">01 / THE LITTLE THINGS</div><h2>Small details.<br><span class="serif">Big difference.</span></h2></div><p>A softer corner. A satisfying press. Just enough motion.<br>Try a few ideas from the workbench.</p></div>
  <div class="demo-grid">
    <article class="demo-card press-card"><div class="demo-top"><span>01 — INTERACTION</span><span>↙</span></div><div class="demo-stage"><button class="demo-button" id="save-button" :aria-pressed="saved" @click="saved = !saved"><span id="save-icon" aria-hidden="true">{{ saved ? '♥' : '♡' }}</span> <span id="save-label">{{ saved ? 'Love it. Saved.' : 'A little love' }}</span></button></div><h3>Every tap, considered.</h3><p>Feedback you can feel. Go on, give it a press.</p></article>
    <article class="demo-card theme-card"><div class="demo-top"><span>02 — EXPRESSION</span><span>↙</span></div><div class="demo-stage"><div class="theme-preview" id="theme-preview" :style="{ '--accent': accents[color] }"><span class="theme-symbol" aria-hidden="true">✳</span><strong>Make it yours.</strong><div class="swatches" aria-label="Preview accent color"><button data-color="blue" class="swatch blue" aria-label="Blue accent" :aria-pressed="color === 'blue'" @click="color = 'blue'"></button><button data-color="orange" class="swatch orange" aria-label="Orange accent" :aria-pressed="color === 'orange'" @click="color = 'orange'"></button><button data-color="green" class="swatch green" aria-label="Green accent" :aria-pressed="color === 'green'" @click="color = 'green'"></button></div></div></div><h3>Your app. Your character.</h3><p>A shared foundation, with space for your own style.</p></article>
    <article class="demo-card motion-card"><div class="demo-top"><span>03 — MOTION</span><span>↙</span></div><div class="demo-stage motion-stage"><div class="motion-bars" ref="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div><button class="replay" id="replay" @click="replay">Replay motion <span aria-hidden="true">↻</span></button></div><h3>A rhythm that feels natural.</h3><p>Movement that helps the interface make sense.</p></article>
  </div>
  <p class="demo-note">Browser sketches of our design direction. Native components are still in the works.</p>
</section>
<section class="foundation wrap" id="foundation">
  <div class="foundation-intro"><div class="eyebrow">02 / BETTER TOGETHER</div><h2>Good company.<br><span class="serif">Solid foundations.</span></h2><p>NativeScript first, starting with Vue. Then the other NativeScript frameworks. React Native, Flutter, and direct native integrations are possibilities further down the road.</p><span class="foundation-mark" aria-hidden="true">m<span>↗</span></span></div>
  <div class="foundation-links"><a href="https://jolt.rafaelaugusto.dev/"><div class="foundation-number">01</div><div><span class="link-kicker">THE MOVEMENT</span><h3>Powered by Jolt.</h3><p>Native animation, springs, and press feedback. The motion engine we're building on.</p></div><span class="external-arrow" aria-hidden="true">↗</span></a><a href="https://vue-router-ns.rafaelaugusto.dev/"><div class="foundation-number">02</div><div><span class="link-kicker">THE JOURNEY</span><h3>Going places, natively.</h3><p>vue-router-ns brings the Vue Router API to NativeScript-Vue and the native navigation stack.</p></div><span class="external-arrow" aria-hidden="true">↗</span></a></div>
</section>
<section class="closing wrap"><span class="eyebrow">STILL EARLY. ALREADY EXCITED.</span><h2>Let's make something<br><span class="serif">worth touching.</span></h2><p>The first components are ahead of us. Come follow along.</p><a class="button primary" href="https://github.com/getcortexlabs/mavis-ui">Find us on GitHub <span aria-hidden="true">↗</span></a></section>
</main>
<footer class="wrap"><a class="brand" href="#"><span class="mark">m</span> mavis<span class="brand-ui">ui</span></a><span>A little more care in every pixel.</span><a href="https://getcortexlabs.com/">Made by Cortex Labs ↗</a></footer>
</div>
</template>

<style src="./style.css" scoped></style>
