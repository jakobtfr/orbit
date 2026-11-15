// Screen viewer for the slide deck on the live site: fits each slide to the window and adds arrow-key steps.
// The PDF is made from deck.html without this file, so printing is unchanged.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'))
  var zoom = 1
  function fit() { zoom = Math.min(1, window.innerWidth / 1920); document.body.style.zoom = zoom }
  function step() { return 1080 * zoom }
  function current() { return Math.max(0, Math.min(slides.length - 1, Math.round(window.scrollY / step()))) }
  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n))
    window.scrollTo(0, Math.round(n * step()))
    tick()
  }
  var pill = 'padding:6px 12px;border-radius:999px;text-decoration:none;cursor:pointer;'
  var bar = document.createElement('div')
  bar.setAttribute('style', 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9;display:flex;gap:6px;align-items:center;padding:6px 8px;border-radius:999px;background:rgba(44,44,46,.9);font:500 13px -apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#f5f5f7;white-space:nowrap')
  function button(label, title, fn) {
    var b = document.createElement('button')
    b.textContent = label; b.title = title; b.setAttribute('aria-label', title)
    b.setAttribute('style', 'all:unset;' + pill + 'background:#3a3a3c;color:#f5f5f7')
    b.addEventListener('click', fn)
    return b
  }
  function link(label, href, colour) {
    var a = document.createElement('a')
    a.href = href; a.textContent = label
    a.setAttribute('style', pill + 'background:' + colour + ';color:#fff')
    return a
  }
  var count = document.createElement('span')
  count.setAttribute('style', 'padding:0 8px;font-variant-numeric:tabular-nums;color:#a1a1a6')
  bar.appendChild(button('←', 'Previous slide', function () { go(current() - 1) }))
  bar.appendChild(count)
  bar.appendChild(button('→', 'Next slide', function () { go(current() + 1) }))
  bar.appendChild(link('Open the live app', '../', '#005fc4'))
  bar.appendChild(link('PDF', 'orbit-demo.pdf', '#3a3a3c'))
  document.documentElement.appendChild(bar)
  function tick() { count.textContent = (current() + 1) + ' / ' + slides.length }
  var NEXT = ['ArrowRight', 'ArrowDown', 'PageDown', ' ']
  var PREV = ['ArrowLeft', 'ArrowUp', 'PageUp']
  addEventListener('keydown', function (event) {
    var pressed = event['key']
    if (NEXT.indexOf(pressed) >= 0) { event.preventDefault(); go(current() + 1) }
    if (PREV.indexOf(pressed) >= 0) { event.preventDefault(); go(current() - 1) }
  })
  addEventListener('resize', fit)
  addEventListener('scroll', tick, { passive: true })
  fit(); tick()
})()
