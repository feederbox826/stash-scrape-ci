// generic utils

// help text
export const helpText = `
stash-scrape-ci
  / - here
  /api/result/:id - retreive job result
  /api/scrape - run a scrape job
    auth - authorization for the request
    url - the URL to scrape
    scrapeType - the type of scrape (e.g., performer, scene, gallery, image, group)
  /api/update - force update scrapersv

  /scene?id=:id - view scene result
  /performer?id=:id - view performer result
  /gallery?id=:id - view gallery result
  /image?id=:id - view image result
  /group?id=:id - view group result
`

// short-unique-id
// https://alex7kom.github.io/nano-nanoid-cc/
// ~2 yrs for collision at 60 scrape/h
export const genID = (len = 8) => {
  const SYMBOLS = '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz'
  let result = ''
  for (let i = 0; i < len; i++) result += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  return result
}

// response helpers
export const textResponse = (text, status = 200) => new Response(text, {
  status,
  headers: { 'Content-Type': 'text/plain' }
})

export const jsonResponse = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json' }
})