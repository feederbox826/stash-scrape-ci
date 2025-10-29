// get id from url
const type = window.location.pathname.split("/")[1]
const id = new URLSearchParams(window.location.search).get("id")
if (!id) {
  console.error("No ID provided in the URL. Opening upload page.")
  window.open("/upload", "_self")
}
fetch(`/api/result/${id}`)
  .then(response => response.json())
  .then(data => {
    // check if type matches data type
    if (data.runnerInfo.scrapeType !== type) {
      console.error(`Type mismatch: expected ${type}, got ${data.runnerInfo.scrapeType}`)
      alert(`Type mismatch: expected ${type}, got ${data.runnerInfo.scrapeType}. Redirecting to the correct viewer...`)
      window.open(`/${data.runnerInfo.scrapeType}?id=${id}`, "_self")
    }
    replaceData(data)
  })