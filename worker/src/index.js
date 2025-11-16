// imports 
import { StashApp } from "./stash-app.js"
import { jsonResponse, textResponse, genID, helpText } from "./utils.js"

// main export
export default {
  async fetch(request, env, ctx) {
    // main request handler
    const { pathname } = new URL(request.url)
    // default
    if (pathname === '/api') return textResponse(helpText)
    else if (pathname == "/api/update") {
      const body = await request.json()
      if (body?.auth !== env.AUTH_KEY) return textResponse('Unauthorized', 401)
      const stash = new StashApp(env)
      stash.migrateDatabase()
      stash.checkUpdatePackages(true)
      return textResponse('Scrapers updated successfully')
    }
    // return cached responses
    else if (pathname.startsWith("/api/result")) {
      // debug
      const id = pathname.split('/')[3]
      if (!id) return textResponse('Job ID is required', 400)
      // return from KV
      const result = await env.KV_RESULTS.get(id, { type: 'json' })
      if (!result) return textResponse('Job result not found', 404)
      return jsonResponse(result)
    }
    // handle new requests
    else if (pathname.startsWith("/api/scrape")) {
      console.log("Received scrape request")
      // handle body
      const body = await request.json()
      if (!body || !body.auth || !body.url || !body.scrapeType) {
        return textResponse('Missing required fields: auth, url, scrapeType', 400)
      }
      if (body.auth !== env.AUTH_KEY) return textResponse('Unauthorized', 401)
      // validate scrapeType
      const validScrapeTypes = ['performer', 'scene', 'gallery', 'image', 'group']
      console.log(`Scrape type: ${body.scrapeType}`)
      if (!validScrapeTypes.includes(body.scrapeType)) {
        return textResponse(`Invalid scrapeType. Valid types are: ${validScrapeTypes.join(', ')}`, 400)
      }
      // validate scraperSearch
      // set up stash instance
      const stash = new StashApp(env)
      const searchResult = await stash.urlSeachScrapers(body.url)
      if (searchResult.error) {
        return textResponse(searchResult.error, 400)
      }
      // process scrape job
      const jobId = genID() // Simulate job ID generation
      // check update packages
      await stash.checkUpdatePackages()
      // set start time
      const startTime = new Date()
      const result = await stash.startScrape(body.url, body.scrapeType)
      // get logs
      const logs = await stash.getLogs(startTime)
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
      return jsonResponse(cachedResult)
    }
    // fall back to static hosting
    return env.ASSETS.fetch(request)
  }
}