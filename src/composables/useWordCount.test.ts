import { ref, nextTick } from 'vue'
import { useWordCount } from './useWordCount'

// ─── helpers ────────────────────────────────────────────────────────────────

/** 產生 n 個英文單字的字串（word1 word2 ...） */
function makeEnglishWords(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i + 1}`).join(' ')
}

/** 產生 n 個漢字 */
function makeCjkChars(n: number): string {
  return '字'.repeat(n)
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('useWordCount', () => {
  describe('空字串', () => {
    it('wordCount 為 0', () => {
      const { wordCount } = useWordCount(ref(''))
      expect(wordCount.value).toBe(0)
    })

    it('characterCount 為 0', () => {
      const { characterCount } = useWordCount(ref(''))
      expect(characterCount.value).toBe(0)
    })

    it('readingTimeMinutes 最少為 1', () => {
      const { readingTimeMinutes } = useWordCount(ref(''))
      expect(readingTimeMinutes.value).toBe(1)
    })
  })

  describe('純英文', () => {
    it('短文（2 字）readingTimeMinutes 仍為 1（clamp）', () => {
      const { readingTimeMinutes } = useWordCount(ref('Hello world'))
      expect(readingTimeMinutes.value).toBe(1)
    })

    it('200 個英文單字 → 1 分鐘', () => {
      const { readingTimeMinutes } = useWordCount(ref(makeEnglishWords(200)))
      expect(readingTimeMinutes.value).toBe(1)
    })

    it('400 個英文單字 → 2 分鐘', () => {
      const { readingTimeMinutes } = useWordCount(ref(makeEnglishWords(400)))
      expect(readingTimeMinutes.value).toBe(2)
    })

    it('wordCount 正確計算英文單字數', () => {
      const { wordCount } = useWordCount(ref('one two three'))
      expect(wordCount.value).toBe(3)
    })
  })

  describe('純中文', () => {
    it('500 個漢字 → 1 分鐘', () => {
      const { readingTimeMinutes } = useWordCount(ref(makeCjkChars(500)))
      expect(readingTimeMinutes.value).toBe(1)
    })

    it('1000 個漢字 → 2 分鐘', () => {
      const { readingTimeMinutes } = useWordCount(ref(makeCjkChars(1000)))
      expect(readingTimeMinutes.value).toBe(2)
    })

    it('1500 個漢字 → 3 分鐘', () => {
      const { readingTimeMinutes } = useWordCount(ref(makeCjkChars(1500)))
      expect(readingTimeMinutes.value).toBe(3)
    })

    it('characterCount 正確計算漢字數', () => {
      const { characterCount } = useWordCount(ref(makeCjkChars(300)))
      expect(characterCount.value).toBe(300)
    })
  })

  describe('中英混合', () => {
    it('250 漢字 + 100 英文單字 → 1 分鐘（0.5+0.5=1，ceil=1）', () => {
      const mixed = makeCjkChars(250) + ' ' + makeEnglishWords(100)
      const { readingTimeMinutes } = useWordCount(ref(mixed))
      expect(readingTimeMinutes.value).toBe(1)
    })

    it('1000 漢字 + 200 英文單字 → 3 分鐘（2+1=3）', () => {
      const mixed = makeCjkChars(1000) + ' ' + makeEnglishWords(200)
      const { readingTimeMinutes } = useWordCount(ref(mixed))
      expect(readingTimeMinutes.value).toBe(3)
    })
  })

  describe('Markdown 語法剝除', () => {
    it('標題 # 記號被剝除，只計算文字', () => {
      const { wordCount } = useWordCount(ref('# Hello\n\n## World'))
      expect(wordCount.value).toBe(2)
    })

    it('粗體 **bold** 記號被剝除', () => {
      const { wordCount } = useWordCount(ref('**bold** text'))
      expect(wordCount.value).toBe(2)
    })

    it('code fence 內容被剝除，程式碼不計入字數', () => {
      const md = 'intro\n```js\nconst x = 1\nconsole.log(x)\n```\noutro'
      const { wordCount } = useWordCount(ref(md))
      // 只計 "intro" 和 "outro" = 2
      expect(wordCount.value).toBe(2)
    })

    it('行內 code `inline` 被剝除', () => {
      const { wordCount } = useWordCount(ref('use `npm install` to install'))
      expect(wordCount.value).toBe(3) // "use", "to", "install"
    })

    it('HTML 標籤被剝除', () => {
      const { wordCount } = useWordCount(ref('<div>Hello</div>'))
      expect(wordCount.value).toBe(1)
    })

    it('連結 URL 被剝除，文字保留', () => {
      const { wordCount } = useWordCount(ref('Visit [link](https://example.com)'))
      expect(wordCount.value).toBe(2) // "Visit", "link"
    })

    it('圖片語法完全被剝除', () => {
      const { wordCount } = useWordCount(ref('before ![alt](https://img.url) after'))
      expect(wordCount.value).toBe(2) // "before", "after"
    })
  })

  describe('響應式更新', () => {
    it('ref 值改變後 readingTimeMinutes 跟著更新', async () => {
      const content = ref('')
      const { readingTimeMinutes } = useWordCount(content)

      expect(readingTimeMinutes.value).toBe(1)

      content.value = makeCjkChars(1500)
      await nextTick()

      expect(readingTimeMinutes.value).toBe(3)
    })

    it('ref 值改變後 wordCount 跟著更新', async () => {
      const content = ref('one two')
      const { wordCount } = useWordCount(content)

      expect(wordCount.value).toBe(2)

      content.value = 'one two three four'
      await nextTick()

      expect(wordCount.value).toBe(4)
    })
  })
})
