import { PNG } from '/tmp/watchup-ui-tools/node_modules/pngjs/lib/png.js'
import pixelmatch from '/tmp/watchup-ui-tools/node_modules/pixelmatch/index.js'
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'

const [name, captureDir = 'verification/artifacts/current'] = process.argv.slice(2)
if (!name) throw new Error('Usage: node verification/compare.mjs <design-name> [capture-directory]')
const original = path.resolve('../watch_up_infra/UI', `${name}.png`)
const actual = path.resolve(captureDir, `${name}.png`)
const out = path.resolve(captureDir, 'comparison')
await mkdir(out, { recursive: true })
const [reference, implementation] = await Promise.all([original, actual].map(async (file) => PNG.sync.read(await readFile(file))))
if (reference.width !== implementation.width || reference.height !== implementation.height) {
  throw new Error(`Unscaled dimensions differ: source ${reference.width}x${reference.height}; capture ${implementation.width}x${implementation.height}. Correct viewport/DPR; do not crop or stretch.`)
}
const { width, height } = reference
const diff = new PNG({ width, height })
const overlay = new PNG({ width, height })
const side = new PNG({ width: width * 2, height })
pixelmatch(reference.data, implementation.data, diff.data, width, height, { threshold: 0.1, includeAA: false })
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * 4
    for (let c = 0; c < 4; c += 1) {
      overlay.data[i + c] = c === 3 ? 255 : Math.round((reference.data[i + c] + implementation.data[i + c]) / 2)
      side.data[(y * width * 2 + x) * 4 + c] = reference.data[i + c]
      side.data[(y * width * 2 + width + x) * 4 + c] = implementation.data[i + c]
    }
  }
}
await copyFile(original, path.join(out, `${name}.original.png`))
await Promise.all([['diff', diff], ['overlay', overlay], ['side-by-side', side]].map(([suffix, image]) => writeFile(path.join(out, `${name}.${suffix}.png`), PNG.sync.write(image))))
console.log(JSON.stringify({ name, source: original, capture: actual, dimensions: { width, height }, scale: '2× PNG; no resizing/cropping/stretching', comparison: out }))
