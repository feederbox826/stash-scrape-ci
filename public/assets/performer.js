// replace or hide
function replaceOrHide(data, elemId, value = null) {
  const elem = document.getElementById(elemId)
  if (!data) elem.parentElement.style.display = 'none'
  value = value || data
  elem.textContent = value
}

function replaceData(data) {
  replaceShared(data)
  // simple replacement
  replaceOrHide(data.result?.name, 'result-name')
  replaceOrHide(data.result?.career_length, 'result-career_length')
  replaceOrHide(data.result?.birthdate, 'result-birthdate')
  replaceOrHide(data.result?.country, 'result-country')
  replaceOrHide(data.result?.ethnicity, 'result-ethnicity')
  replaceOrHide(data.result?.eye_color, 'result-eye_color')
  replaceOrHide(data.result?.hair_color, 'result-hair_color')
  replaceOrHide(data.result?.piercings, 'result-piercings')
  replaceOrHide(data.result?.tattoos, 'result-tattoos')
  replaceOrHide(data.result?.details, 'result-details')

  // female
  replaceOrHide(data.result?.fake_tits, 'result-fake_tits')
  replaceOrHide(data.result?.measurements, 'result-measurements')

  // male
  replaceOrHide(data.result?.circumcised, 'result-circumcised')
  replaceOrHide(data.result?.penis_length, 'result-penis_length')

  // complex replace
  replaceOrHide(data.result?.height, 'result-height', `${data.result?.height}cm`)
  replaceOrHide(data.result?.aliases, 'result-aliases', data.result?.aliases?.join(", "))

  // manually override gender SVGs based on map
  const genderSvg = new Map([
    ['male', "M289.8 46.8c3.7-9 12.5-14.8 22.2-14.8l112 0c13.3 0 24 10.7 24 24l0 112c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-33.4-33.4L321 204.2c19.5 28.4 31 62.7 31 99.8c0 97.2-78.8 176-176 176S0 401.2 0 304s78.8-176 176-176c37 0 71.4 11.4 99.8 31l52.6-52.6L295 73c-6.9-6.9-8.9-17.2-5.2-26.2zM400 80s0 0 0 0s0 0 0 0s0 0 0 0zM176 416a112 112 0 1 0 0-224 112 112 0 1 0 0 224z"],
    ['female', "M80 176a112 112 0 1 1 224 0A112 112 0 1 1 80 176zM224 349.1c81.9-15 144-86.8 144-173.1C368 78.8 289.2 0 192 0S16 78.8 16 176c0 86.3 62.1 158.1 144 173.1l0 34.9-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-34.9z"],
    ['transgender_male', "M112 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-31 31L112 78.1l7-7c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-7 7 15.2 15.2C187.7 107.6 220.5 96 256 96s68.3 11.6 94.9 31.2l68.8-68.8-31-31c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l96 0c8.8 0 16 7.2 16 16l0 96c0 6.5-3.9 12.3-9.9 14.8s-12.9 1.1-17.4-3.5l-31-31-68.8 68.8C404.4 187.7 416 220.5 416 256c0 80.2-59 146.6-136 158.2l0 17.8 16 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-16 0 0 8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8-16 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l16 0 0-17.8C155 402.6 96 336.2 96 256c0-35.5 11.6-68.3 31.2-94.9L112 145.9l-7 7c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l7-7L58.3 92.3l-31 31c-4.6 4.6-11.5 5.9-17.4 3.5S0 118.5 0 112L0 16C0 7.2 7.2 0 16 0l96 0zM352 256a96 96 0 1 0 -192 0 96 96 0 1 0 192 0z"],
    ['transgender_female', "M112 0c6.5 0 12.3 3.9 14.8 9.9s1.1 12.9-3.5 17.4l-31 31L112 78.1l7-7c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-7 7 15.2 15.2C187.7 107.6 220.5 96 256 96s68.3 11.6 94.9 31.2l68.8-68.8-31-31c-4.6-4.6-5.9-11.5-3.5-17.4s8.3-9.9 14.8-9.9l96 0c8.8 0 16 7.2 16 16l0 96c0 6.5-3.9 12.3-9.9 14.8s-12.9 1.1-17.4-3.5l-31-31-68.8 68.8C404.4 187.7 416 220.5 416 256c0 80.2-59 146.6-136 158.2l0 17.8 16 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-16 0 0 8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8-16 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l16 0 0-17.8C155 402.6 96 336.2 96 256c0-35.5 11.6-68.3 31.2-94.9L112 145.9l-7 7c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l7-7L58.3 92.3l-31 31c-4.6 4.6-11.5 5.9-17.4 3.5S0 118.5 0 112L0 16C0 7.2 7.2 0 16 0l96 0zM352 256a96 96 0 1 0 -192 0 96 96 0 1 0 192 0z"],
    ['intersex', "M337.8 14.8C341.5 5.8 350.3 0 360 0L472 0c13.3 0 24 10.7 24 24l0 112c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-24.7 24.7C407 163.3 416 192.6 416 224c0 80.2-59 146.6-136 158.2l0 25.8 24 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-24 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-25.8C155 370.6 96 304.2 96 224c0-88.4 71.6-160 160-160c39.6 0 75.9 14.4 103.8 38.2L382.1 80 343 41c-6.9-6.9-8.9-17.2-5.2-26.2zM448 48s0 0 0 0s0 0 0 0s0 0 0 0zM352 224a96 96 0 1 0 -192 0 96 96 0 1 0 192 0z"],
    ['non_binary', "M192 144a112 112 0 1 1 0 224 112 112 0 1 1 0-224zm0 288a176 176 0 1 0 0-352 176 176 0 1 0 0 352z"],
  ])
  const genderColor = new Map([
    ['male', '#89cff0'],
    ['female', '#f38cac'],
    ['transgender_male', '#89cff0'],
    ['transgender_female', '#f38cac'],
    ['intersex', '#ffd800'],
    ['non_binary', '#9b59d0']
  ])
  if (data.result?.gender) {
    const genderName = data.result?.gender.toLowerCase()
    const path = genderSvg.get(genderName)
    if (path) {
      const genderPath = document.getElementById("gender-path")
      genderPath.setAttribute("d", path)
    }
    document.getElementById("gender-svg").style.fill = genderColor.get(genderName) || '#000000'
  }
}