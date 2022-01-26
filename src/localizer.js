import JSZip from "jszip"

/**
 * Downloads spreadsheet as zip file from google
 * @param { string } id Unique spreadsheet identifier
 * @returns { Promise<JSZip> } JSZip instance
 */
async function fetchZipFromGoogle(id) {
  const url = `https://docs.google.com/spreadsheets/export?format=zip&id=${id}`
  const response = await fetch(url)
  const blob = await response.blob()
  const zip = await JSZip.loadAsync(blob)
  return zip
}

/**
 * Creates 2d grid from <tr> and <tr> html entries
 * @param { string } htmlText Plain html text of spreadsheet
 * @returns { string[][] } extracted 2d array grid
 */
function createGrid(htmlText) {
  const documentNode = new DOMParser().parseFromString(htmlText, "text/html")

  const rows = documentNode.querySelectorAll("tbody > tr")
  const grid = Array.from(rows).map(tr => {
    return Array.from(tr.querySelectorAll("td")).map(td => td.textContent)
  })

  return grid
}

/**
 * Removes empty and commented entries from grid
 * @param { string[][] } grid 2d grid
 * @param { string } ignoreSymbol comment symbol
 * @returns { string[][] } 2d grid
 */
function filterGrid(grid, ignoreSymbol) {
  return grid.filter(row => {
    const isComment = row[0].startsWith(ignoreSymbol)
    const isEmpty = row.every(str => str.trim().length === 0)
    return !isComment && !isEmpty
  })
}

/**
 * Converts 2d grid to json format
 * @param { string[][] } grid 
 * @param { * } options 
 * @returns { string } text in JSON format
 */
function gridToJson(grid, options) {
  const localization = {}

  const languages = grid[0]

  for (let x = 1; x < languages.length; x++) {
    let lang = languages[x]
    const foo = lang.startsWith(options.ignoreSymbol)

    if (options.excludeLang && foo) {
      continue
    }
    else if (foo) {
      lang = lang.substring(options.ignoreSymbol.length).trim()
    }

    const data = {}
    for (let y = 1; y < grid.length; y++) {
      const key = grid[y][0]
      data[key] = grid[y][x]
    }

    localization[lang] = data
  }

  const json = JSON.stringify(localization, null, 2)
  return json
}

export default class Localizer {
  /**
   * 
   * @param { string } id 
   */
  constructor(id) {
    this.id = id
    this.options = {
      ignoreSymbol: "#",
      excludeLang: true,
    }
  }

  /**
   * 
   * @param { string } id 
   */
  update(id) {
    this.id = id
  }

  async fetchZip() {
    this.zip = await fetchZipFromGoogle(this.id)
  }

  /**
   * 
   * @returns { string[] }
   */
  getFiles() {
    return Object.values(this.zip.files)
      .map(file => file.name)
      .filter(name => name.endsWith(".html"))
  }

  /**
   * 
   * @param { string } name 
   * @returns 
   */
  async fromFile(name) {
    const htmlText = await this.zip.file(name).async("string")
    const grid = filterGrid(createGrid(htmlText), this.options.ignoreSymbol)
    const result = gridToJson(grid, this.options)
    return result
  }
}
