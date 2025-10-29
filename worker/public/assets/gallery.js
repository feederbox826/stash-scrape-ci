function replaceData(data) {
  replaceShared(data)
  // simple replacement
  replaceResult(data.result?.title, 'result-title')
  replaceResult(data.result?.code, 'result-code')
  replaceResult(data.result?.photographer, 'result-photographer')
  replaceResult(data.result?.details, 'result-details')
  // complex replacements
  replaceResult(data.result?.performers, "result-performers", data.result?.performers?.join(" | "))
  replaceResult(data.result?.studio, "result-studio", `${data.result.studio} • ${data.result.date}`)
}