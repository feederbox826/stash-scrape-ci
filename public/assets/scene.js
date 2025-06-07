function replaceScene(data) {
  replaceShared(data)
  // simple replacement
  replaceResult(data.result?.title, 'result-title')
  replaceResult(data.result?.code, 'result-code')
  replaceResult(data.result?.director, 'result-director')
  replaceResult(data.result?.details, 'result-details')
  // complex replacements
  replaceResult(data.result?.performers, "result-performers", data.result?.performers?.join(" | "))
  replaceResult(data.result?.duration, "result-duration", new Date(data.result?.duration * 1000).toISOString().substring(11, 16).replace("-", ":"))
  replaceResult(data.result?.studio, "result-studio", `${data.result.studio} • ${data.result.date}`)

  // manual replacements
  // add groups
  if (data.result.groups) {
    document.getElementById("group-placeholder").remove()
    const groupContainer = document.getElementById("result-groups")
    for (const newGroup of data.result.groups) {
      const newSpan = document.createElement("span")
      newSpan.classList = "badge bg-none"
      newSpan.textContent = newGroup
      groupContainer.appendChild(newSpan)
    }
  }
}