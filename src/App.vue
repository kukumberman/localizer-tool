<template>
  <input type="text" v-model="id">
  <button @click="fetchZip">Fetch</button>
  <div v-if="files.length > 0">
    <input type="checkbox" v-model="excludeLang">
    <ul>
      <li v-for="(fileName, index) in files" :key="index">
        <span>{{ fileName }}</span>
        <button @click="proceedFile(fileName)">Proceed</button>
      </li>
    </ul>
  </div>
  <p v-else>No files!</p>
  <textarea :value="json" cols="40" rows="20"></textarea>
</template>

<script>
import JSZip from "jszip";

export default {
  components: {
  },
  data() {
    return {
      id: "1BFaDYt_96wAQcdGS5rdNoIAVlvtuyh4Bm_JMdjoF7Po",
      excludeLang: true,
      zip: {},
      files: [],
      json: "",
    }
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("id")) {
      const id = params.get("id");
      console.log(id);
    }
  },
  watch: {
    zip() {
      this.files = Object.values(this.zip.files)
      .map(file => file.name)
      .filter(name => name.endsWith(".html"));
    }
  },
  computed: {
    ignoreSymbol() {
      return "#"
    }
  },
  methods: {
    async fetchZip() {
      const url = `https://docs.google.com/spreadsheets/export?format=zip&id=${this.id}`;
      const response = await fetch(url);
      const blob = await response.blob();
      this.zip = await JSZip.loadAsync(blob);
    },
    async proceedFile(name) {
      const htmlText = await this.zip.file(name).async("string");
      const doc = new DOMParser().parseFromString(htmlText, "text/html");
      
      const grid = Array.from(doc.querySelectorAll("tbody > tr")).map(tr => {
        return Array.from(tr.querySelectorAll("td")).map(td => td.textContent);
      })
      .filter(row => {
        const isComment = row[0].startsWith(this.ignoreSymbol);
        const isEmpty = row.every(str => str.trim().length === 0);
        return !isComment && !isEmpty;
      });

      console.log(grid);

      const localization = {}
      const languages = grid[0];

      for (let x = 1; x < languages.length; x++) {
        let lang = languages[x];
        const foo = lang.startsWith(this.ignoreSymbol);
        if (this.excludeLang && foo) {
          continue;
        }
        else if (foo) {
          lang = lang.substring(1).trim();
        }

        const data = {}
        for (let y = 1; y < grid.length; y++) {
          const key = grid[y][0];
          data[key] = grid[y][x];
        }

        localization[lang] = data;
      }

      this.json = JSON.stringify(localization, null, 2);
    }
  }
}
</script>

<style>
</style>
