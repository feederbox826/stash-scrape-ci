// scraper index searcher and installer
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

// handle url scrapersearch
export async function scraperSearch(url, stash) {
  // search in CommunityScrapers
  const matchedScrapers = await searchScrapers(url)
  // if no results, return empty array
  if (matchedScrapers.length === 0) return { "error": "No scrapers found for the provided URL." }
  // check for existing scrapers
  const existingScrapers = await stash.getExistingScrapers()
  // check against IDs
  const hasExistingScrapers = matchedScrapers.filter(scraper => existingScrapers.includes(scraper))
  // if no existing and only one matched, install it
  if (hasExistingScrapers.length === 0 && matchedScrapers.length === 1) {
    const scraperId = matchedScrapers[0]
    console.log(`Installing scraper: ${scraperId}`)
    return stash.installPackage(scraperId)
      .then(data => data.installPackages)
      .then(jobId => stash.awaitJobFinished(jobId))
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