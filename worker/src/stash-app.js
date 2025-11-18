import { scraperSearch } from "./scraper-index"

export class StashApp {
  constructor(env) {
    this.STASH_URL = env.STASH_URL
    this.STASH_API_KEY = env.STASH_API_KEY
    this.KV_CONFIG = env.KV_CONFIG
  }

  callGQL = (query, variables = {}) =>
    fetch(this.STASH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': this.STASH_API_KEY || ""
      },
      body: JSON.stringify({ query, variables })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.errors) { throw new Error(`GQL Error: ${JSON.stringify(data?.errors)}`) }
        return data.data
      })
  
  getStashInfo = async () => this.callGQL(`
    query { installedPackages(type: Scraper) {
      package_id version date
    } version {
      version hash
    }}`)

  checkUpdatePackages = async (force = false) => {
    const lastUpdate = await this.KV_CONFIG.get("scraperLastUpdate")
    // check if key exists
    if (force || !lastUpdate) {
      console.log("Updating scrapers...")
      await this.updateScrapers()
        .then(jobId => this.awaitJobFinished(jobId))
        .then(() => this.KV_CONFIG.put("scraperUpdated", true, { expirationTtl: 24 * 60 * 60 }))
      // update user agent
      const userAgent = await getChromeUA()
      console.log(`Updating scraper user-agent to: ${userAgent}`)
      await this.updateUA(userAgent)
      console.log("Scrapers updated")
      // reload scrapers
      await this.callGQL(`mutation { reloadScrapers }`)
    } else {
      console.log("Scrapers already up to date")
    }
  }

  getJobStatus = async (jobId) =>
    this.callGQL(`query ($id: ID!) {
      findJob(input: { id: $id }) {
        status
      }}`, { id: jobId })

  awaitJobFinished = async (jobId) =>
    new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const status = await this.getJobStatus(jobId)
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

  updateScrapers = async () =>
    this.callGQL('mutation { updatePackages(type: Scraper) }')
      .then(data => data.updatePackages)
  
  getExistingScrapers = async () => this.callGQL(`query {
      installedPackages(type: Scraper) { package_id }
    }`).then(data => data.installedPackages.map(pkg => pkg.package_id))
  
  installPackage = (id) => this.callGQL(`mutation ($id: String!) {
    installPackages(
      packages: {
        id: $id,
        sourceURL: "https://stashapp.github.io/CommunityScrapers/stable/index.yml"
      } type: Scraper
    )}`, { id })

  // get log cache (30 items)
  // https://github.com/stashapp/stash/blob/12c4e1f61c49cd4e625a62e9bde7df9e02c0c47c/internal/log/logger.go#L113
  getLogs = async (startTime) => this.callGQL(`{ logs { time level message } }`)
    .then(data => data.logs.reverse()) // reverse to get latest first
    .then(logs => logs.filter(log => new Date(log.time) >= startTime - 2000)) // filter logs after start time

  updateUA = async (userAgent) => this.callGQL(`mutation ($userAgent: String!) {
    configureScraping(input: { scraperUserAgent: $userAgent })
    { scraperUserAgent }}`, { userAgent })

  migrateDatabase = async () => this.callGQL(`mutation {
    migrate(input: { backupPath: "/dev/null" })
  }`)

  scrape(url, scrapeType) {
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
    return this.callGQL(queryString, { url })
      .then(data => cleanScrapeResult(data[Object.keys(data)[0]]))
  }

  async startScrape(url, scrapeType) {
    const stashInfo = await this.getStashInfo()
    let error, result
    try {
      result = await this.scrape(url, scrapeType)
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

  urlSeachScrapers = async (url) => scraperSearch(url, this)
}

export async function parseTags(tags, d1) {
  const parsedTags = tags.map(async tag => {
    const { results } = await d1.prepare(
      "SELECT id, search_term FROM tag_search WHERE search_term = ?"
    )
      .bind(tag.toLowerCase())
      .run()
    if (results.length > 0) {
      return { id: results[0].id, name: tag }
    } else {
      return { name: tag}
    }
  })
  // wait for all tags to be processed
  return Promise.all(parsedTags)
}

// generic helpers
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

// get chrome useragent
const getChromeUA = () =>
  fetch("https://jnrbsn.github.io/user-agents/user-agents.json")
    .then(res => res.json())
    .then(userAgents => userAgents[3])

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
