function replaceShared(data) {
  // simple replacement
  replaceResult(data.stashInfo.version.version, 'runner-version')
  replaceResult(data.runnerInfo?.scrapeType, 'scrape-type')
  replaceResult(data.runnerInfo?.scraperId, 'scrape-id')
  // complex replacements
  replaceResult(data.runnerInfo.date, 'runner-date', new Date(data.runnerInfo.date).toLocaleString())
  replaceResult(data.stashInfo.version.hash, 'runner-hash', ` (${data.stashInfo.version.hash})`)
  // set url
  setUrl("scrape-url", data.runnerInfo.url)
  setUrl("job-id", `https://scrape.feederbox.cc/${data.runnerInfo.scrapeType}?id=${data.jobId}`, data.jobId)
  // manual replacements
  const scraperVersion = data.stashInfo.installedPackages.find(pkg => pkg.package_id === data.runnerInfo.scraperId)
  setUrl("scraper-hash", `https://github.com/stashapp/CommunityScrapers/commit/${scraperVersion?.version}`, ` (${scraperVersion?.version})`)

  // if error, show error message
  if (data.error) {
    const errorContainer = document.getElementById("error-box")
    errorContainer.classList.remove("hidden")
    const errorMessage = document.getElementById("error-text")
    errorMessage.textContent = data.error
  }

  // add urls
  if (data?.result?.urls?.[Symbol.iterator]) {
    document.getElementById("url-placeholder").remove()
    const urlContainer = document.getElementById("result-urls")
    for (const newURL of data.result.urls) {
      const newURLLi = document.createElement("li")
      const newAnchor = document.createElement("a")
      newAnchor.textContent = newURL
      newAnchor.href = newURL
      newAnchor.target = "_blank"
      newAnchor.rel = "noopener noreferrer"
      newAnchor.textContent = newURL
      newURLLi.appendChild(newAnchor)
      urlContainer.appendChild(newURLLi)
    }
  }

  // add tags
  if (!data.result?.tags?.[Symbol.iterator]) return
  // seperate linked and unlinked tags
  const linkedTags = data.result?.tags.filter(tag => tag.id)
  const unlinkedTags = data.result?.tags.filter(tag => !tag.id)
  // unlinked tags
  const unlinkedTagContainer = document.getElementById("unlinked-tag-list")
  if (unlinkedTags.length) {
    document.getElementById("unlinked-tag-placeholder").remove()
    for (const tag of unlinkedTags) {
      const newTagLi = document.createElement("li")
      const newTagSpan = document.createElement("span")
      newTagSpan.classList = "tag-item badge bg-none"
      newTagLi.appendChild(newTagSpan)
      newTagSpan.textContent = tag.name
      unlinkedTagContainer.appendChild(newTagLi)
    }
  }
  // linked tags
  const linkedTagContainer = document.getElementById("linked-tag-list")
  if (linkedTags.length) {
    document.getElementById("link-tag-placeholder").remove()
    for (const tag of linkedTags) {
      const newTagLi = document.createElement("li")
      const newTagSpan = document.createElement("a")
      newTagSpan.classList = "tag-item badge bg-none"
      newTagLi.appendChild(newTagSpan)
      newTagSpan.textContent = `🔗 ${tag.name}`
      // set href and link icon
      newTagSpan.href = `https://stashdb.org/tags/${tag.id}` // adjust base URL as needed
      newTagSpan.target = "_blank"
      newTagSpan.rel = "noopener noreferrer"
      linkedTagContainer.appendChild(newTagLi)
    }
  }

  // add logs
  const logContainer = document.getElementById("logs")
  if (data?.logs?.[Symbol.iterator]) {
    for (const log of data.logs) {
      const logRow = document.createElement("div")
      logRow.classList = "row"
      const logTime = document.createElement("div")
      logTime.classList = "log-time"
      logTime.textContent = new Date(log.time).toLocaleString()
      const logLevel = document.createElement("div")
      logLevel.classList = log.level.toLowerCase()
      logLevel.textContent = log.level
      const logMessage = document.createElement("div")
      logMessage.classList = "col col-sm-9"
      logMessage.textContent = log.message
      logRow.appendChild(logTime)
      logRow.appendChild(logLevel)
      logRow.appendChild(logMessage)
      logContainer.appendChild(logRow)
    }
    // if count is 30, logs were cut off
    if (data.logs.length === 30) {
      const logRow = document.createElement("div")
      logRow.classList = "row"
      const logMessage = document.createElement("div")
      logMessage.classList = "col col-sm-12"
      logMessage.textContent = "Log limit reached (30). Some logs may have been cut off."
      logRow.appendChild(logMessage)
      logContainer.appendChild(logRow)
    }
  }
}