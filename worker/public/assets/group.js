function replaceData(data) {
  replaceShared(data)
  // simple replacement
  replaceResult(data.result?.name, 'result-name')
  replaceResult(data.result?.aliases, 'result-aliases', data.result?.aliases?.join(", "))
  replaceResult(data.result?.rating, 'result-rating')
  replaceResult(data.result?.duration, 'result-duration')
  replaceResult(data.result?.director, 'result-director')
  replaceResult(data.result?.synopsis, 'result-synopsis')
  // complex replacements
  replaceResult(data.result?.performers, "result-performers", data.result?.performers?.join(" | "))
  replaceResult(data.result?.studio, "result-studio", `${data.result.studio} • ${data.result.date}`)
}