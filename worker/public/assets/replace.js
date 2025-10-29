const replaceResult = (data, elemId, value = null) => {
  if (!data) return
  value = value || data
  document.getElementById(elemId).textContent = value
}

const setUrl = (elemId, url, textContent = null) => {
  const elem = document.getElementById(elemId)
  if (!elem) return
  elem.href = url
  elem.textContent = textContent || url
  elem.target = "_blank"
  elem.rel = "noopener noreferrer"
}