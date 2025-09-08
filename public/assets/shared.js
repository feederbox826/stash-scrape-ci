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
  const tagContainer = document.getElementById("tag-list")
  if (data.result?.tags?.[Symbol.iterator]) {
    document.getElementById("tag-placeholder").remove()
    for (const tag of data.result?.tags) {
      const newTagLi = document.createElement("li")
      const newTagSpan = document.createElement("span")
      newTagSpan.classList = "tag-item badge bg-none"
      newTagLi.appendChild(newTagSpan)
      newTagSpan.textContent = tag
      tagContainer.appendChild(newTagLi)
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
  }
}