import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/Result.jsx', import.meta.url), 'utf8')

const expectations = [
  {
    label: 'result stat gauges expose progressbar semantics',
    pattern: /role="progressbar"/,
  },
  {
    label: 'result stat gauges expose current value',
    pattern: /aria-valuenow=\{value\}/,
  },
  {
    label: 'result stat gauges expose min value',
    pattern: /aria-valuemin=\{0\}/,
  },
  {
    label: 'result stat gauges expose max value',
    pattern: /aria-valuemax=\{100\}/,
  },
  {
    label: 'result stat fill has static width fallback',
    pattern: /style=\{\{\s*width:\s*`\$\{value\}%`/s,
  },
]

const failures = expectations.filter(({ pattern }) => !pattern.test(source))

if (failures.length > 0) {
  console.error('Result progress checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.label}`)
  }
  process.exit(1)
}

console.log('Result progress checks passed')
