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

// stashapp gql helpers
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

export const checkUpdatePackages = async (force = false) => {
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

const updateScrapers = async () =>
  callGQL('mutation { updatePackages(type: Scraper) }')
    .then(data => data.updatePackages)

export const awaitJobFinished = async (jobId) =>
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

export const installPackage = (id) => callGQL(`mutation ($id: String!) {
  installPackages(
    packages: {
      id: $id,
      sourceURL: "https://stashapp.github.io/CommunityScrapers/stable/index.yml"
    } type: Scraper
  )}`, { id })

export const getExistingScrapers = async () => callGQL(`query {
    installedPackages(type: Scraper) { package_id }
  }`).then(data => data.installedPackages.map(pkg => pkg.package_id))

const getStashInfo = async () => callGQL(`
  query { installedPackages(type: Scraper) {
    package_id version date
  } version {
    version hash
  }}`)

// get log cache (30 items)
// https://github.com/stashapp/stash/blob/12c4e1f61c49cd4e625a62e9bde7df9e02c0c47c/internal/log/logger.go#L113
export const getLogs = async () => v(`{ logs { time level message } }`)
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

export async function startScrape(url, scrapeType) {
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
