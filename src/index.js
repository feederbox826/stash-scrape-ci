// help text
const helpText = `
stash-scrape-ci
  / - here
  /api/result/:id - retreive job result
  /api/run - run a scrape job
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

// static query definitions
const performerQuery = `query ($url: String!) {
  scrapePerformerURL(url: $url) {
    name aliases gender
    details
    birthdate career_length death_date
    height measurements weight
    hair_color eye_color
    country ethnicity
    circumcised penis_length
    fake_tits
    piercings tattoos
    urls 
    tags { name }
  }}`

const sceneQuery = `query ($url: String!) {
  scrapeSceneURL(url: $url) {
    title
    code
    date
    director
    duration
    details
    urls
    performers { name } studio { name }
    groups { name } movies { name }
    tags { name } 
  }}`

const galleryQuery = `query ($url: String!) {
  scrapeGalleryURL(url: $url) {
    title date code
    photographer urls
    details
    studio { name }
    performers { name }
    tags { name }
  }}`

const imageQuery = `query ($url: String!) {
  scrapeImageURL(url: $url) {
    title date code
    photographer urls
    details
    studio { name }
    performers { name }
    tags { name }
  }}`

const groupQuery = `query ($url: String!) {
  scrapeGroupURL(url: $url) {
    name aliases
    date duration director
    rating urls synopsis
    studio { name } tags { name }
  }}`

// main export
export default {
  async fetch(request, env, ctx) {
    // external helpers
    // short-unique-id
    const genID = (len = 8) => {
      const SYMBOLS = '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz'
      let result = ''
      for (let i = 0; i < len; i++) result += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      return result
    }

    async function searchScrapers(url) {
      // fetch communityScrapers
      const communityScrapers = await fetch("https://stashapp.github.io/CommunityScrapers/assets/scrapers.json")
        .then(res => res.json())
      // find scrapers that match URL
      const matchedScrapers = communityScrapers.filter(scraper =>
        scraper.sites.some(pattern => url.includes(pattern))
      )
      // return scraper id from filename
      return matchedScrapers.map(scraper => scraper.filename.replace('../scrapers/', '').replace('.yml', '').split("/")[0])
    }

    function cleanScrapeResult(result) {
      const cleaned = {}
      for (const [key, value] of Object.entries(result)) {
        if (value == null) cleaned[key] = null
        else if (typeof value == 'string') cleaned[key] = value
        else if (Array.isArray(value)) {
          // if array of objects, map name out, otherwise leave intact
          if (typeof value[0] == 'string') {
            // leave as is
            cleaned[key] = value
          } else if (typeof value[0] === 'object') {
            // if array of objects, map name out
            cleaned[key] = value.map(item => item?.name)
          }
        }
        else if (value?.name) {
          // if object with name, just return name
          cleaned[key] = value.name
        }
      }
      return cleaned
    }

    // gql helpers
    const callGQL = (query, variables = {}) =>
      fetch(env.STASH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': env.STASH_API_KEY || ""
        },
        body: JSON.stringify({ query, variables })
      })
        .then(res => res.json())
        .then(data => {
          if (data?.errors) { throw new Error(`GQL Error: ${JSON.stringify(data?.errors)}`) }
          return data.data
        })

    const checkUpdatePackages = async (force = false) => {
      const lastUpdate = await env.KV_CONFIG.get("scraperLastUpdate")
      // check if key exists
      if (force || !lastUpdate) {
        console.log("Updating scrapers...")
        await updateScrapers()
          .then(jobId => awaitJobFinished(jobId))
          .then(() => env.KV_CONFIG.put("scraperUpdated", true, { expirationTtl: 24 * 60 * 60 }))
        console.log("Scrapers updated")
        // reload scrapers
        await callGQL(`mutation { reloadScrapers }`)
      } else {
        console.log("Scrapers already up to date")
      }
    }

    const getJobStatus = async (jobId) =>
      callGQL(`query ($id: ID!) {
        findJob(input: { id: $id }) {
          status
        }}`, { id: jobId })

    const awaitJobFinished = async (jobId) =>
      new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          const status = await getJobStatus(jobId)
            .then(data => data.findJob?.status)
          console.log(`Job status: ${status}`)
          if (status === 'FINISHED') {
            clearInterval(interval)
            resolve(true)
          } else if (status === 'FAILED') {
            clearInterval(interval)
            reject(new Error('Job failed'))
          }
        }, 100)
      })

    const installPackage = (id) => callGQL(`mutation ($id: String!) {
      installPackages(
        packages: {
          id: $id,
          sourceURL: "https://stashapp.github.io/CommunityScrapers/stable/index.yml"
        } type: Scraper
      )}`, { id })

    const updateScrapers = async () =>
      callGQL('mutation { updatePackages(type: Scraper) }')
        .then(data => data.updatePackages)

    const getStashInfo = async () => callGQL(`
      query { installedPackages(type: Scraper) {
        package_id version date
      } version {
        version hash
      }}`)

    const getLogs = async (startTime) => callGQL(`{ logs { time level message } }`)
      .then(data => data.logs.reverse()) // reverse to get latest first
      .then(logs => logs.filter(log => new Date(log.time) >= startTime - 2000)) // filter logs after start time

    // runners
    async function scrape(url, scrapeType) {
      const queryMap = new Map([
        ['performer', performerQuery],
        ['scene', sceneQuery],
        ['gallery', galleryQuery],
        ['image', imageQuery],
        ['group', groupQuery],
      ])
      // catch unknown scrape type
      if (!queryMap.has(scrapeType)) {
        throw new Error(`Unknown scrape type: ${scrapeType}`)
      }
      const queryString = queryMap.get(scrapeType)
      return callGQL(queryString, { url })
        .then(data => cleanScrapeResult(data[Object.keys(data)[0]]))
    }

    async function startScrape(url, scrapeType) {
      const stashInfo = await getStashInfo()
      let error, result
      try {
        result = await scrape(url, scrapeType)
      } catch (err) {
        error = err.message
        console.error(`Error during scrape: ${err.message}`)
      }
      return {
        result,
        error,
        runnerInfo: {
          url,
          scrapeType,
          date: new Date().toISOString(),
        },
        stashInfo
      }
    }

    // handle url scrapersearch
    async function scraperSearch(url) {
      // search in CommunityScrapers
      const matchedScrapers = await searchScrapers(url)
      // if no results, return empty array
      if (matchedScrapers.length === 0) return { "error": "No scrapers found for the provided URL." }
      // check for existing scrapers
      const existingScrapers = await callGQL(`query {
        installedPackages(type: Scraper) { package_id }
      }`).then(data => data.installedPackages.map(pkg => pkg.package_id))
      // check against IDs
      const hasExistingScrapers = matchedScrapers.filter(scraper => existingScrapers.includes(scraper))
      // if no existing and only one matched, install it
      if (hasExistingScrapers.length === 0 && matchedScrapers.length === 1) {
        const scraperId = matchedScrapers[0]
        console.log(`Installing scraper: ${scraperId}`)
        return installPackage(scraperId)
          .then(data => data.installPackages)
          .then(jobId => awaitJobFinished(jobId))
          .then(() => ({
            success: `Scraper ${scraperId} installed successfully.`,
            id: scraperId
          }))
      } else if (matchedScrapers.length > 1 && hasExistingScrapers.length === 0) {
        // if multiple, don't install
        return { "error": "Multiple scrapers found for the provided URL. Cowardly refusing to install." }
      } else if (hasExistingScrapers.length == 1) {
        // if one existing, return success
        return {
          success: `Scraper ${hasExistingScrapers[0]} already installed.`,
          id: hasExistingScrapers[0]
        }
      }
    }
    
    // main request handler
    const { pathname } = new URL(request.url)

    // default
    if (pathname === '/api') {
      return new Response(helpText)
    }
    else if (pathname == "/api/update") {
      checkUpdatePackages(true)
      return new Response('Scrapers updated successfully', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    // return cached responses
    else if (pathname.startsWith("/api/result")) {
      // debug
      const id = pathname.split('/')[3]
      if (!id) {
        return new Response('Job ID is required', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      // return from KV
      const result = await env.KV_RESULTS.get(id, { type: 'json' })
      if (!result) {
        return new Response('Job result not found', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    // handle new requests
    else if (pathname.startsWith("/api/run")) {
      console.log("Received scrape request")
      // handle body
      const body = await request.json()
      if (!body || !body.auth || !body.url || !body.scrapeType) {
        return new Response('Missing required fields: auth, url, scrapeType', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      // check authentication
      if (body.auth !== env.AUTH_KEY) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      // validate scrapeType
      const validScrapeTypes = ['performer', 'scene', 'gallery', 'image', 'group']
      console.log(`Scrape type: ${body.scrapeType}`)
      if (!validScrapeTypes.includes(body.scrapeType)) {
        return new Response(`Invalid scrapeType. Valid types are: ${validScrapeTypes.join(', ')}`, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      // validate scraperSearch
      const searchResult = await scraperSearch(body.url)
      if (searchResult.error) {
        return new Response(searchResult.error, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
      // process scrape job
      const jobId = genID() // Simulate job ID generation
      // check update packages
      await checkUpdatePackages()
      // set start time
      const startTime = new Date()
      const result = await startScrape(body.url, body.scrapeType)
      // get logs
      const logs = await getLogs(startTime)
      const cachedResult = {
        jobId,
        ...result,
        runnerInfo: {
          scraperId: searchResult?.id || null,
          ...result.runnerInfo
        },
        logs,
      }
      // add to cache
      const expirationTtl = cachedResult.error ? 24 * 60 * 60 : 7 * 24 * 60 * 60 // 1 day for errors, 7 days for successful results
      await env.KV_RESULTS.put(jobId, JSON.stringify(cachedResult), { expirationTtl })
      return new Response(JSON.stringify(cachedResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return env.ASSETS.fetch(request)
  }
}