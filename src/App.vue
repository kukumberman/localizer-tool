<template>
  <div>
    <input type="text" v-model="id">
  </div>
  <div>
    <button @click="fetchZip">Fetch</button>
  </div>
  <div>
    <a :href="spreadsheetUrl" target="_blank">{{ spreadsheetUrl }}</a>
  </div>
  <div v-if="files.length > 0">
    <ul>
      <li v-for="(fileName, index) in files" :key="index">
        <span>{{ fileName }}</span>
        <button @click="convertFile(fileName)">Convert</button>
      </li>
    </ul>
  </div>
  <div v-if="json.length > 0">
    <!-- <textarea :value="json" cols="100" rows="40"></textarea> -->
    <pre><code>{{ json }}</code></pre>
    <button @click="downloadHandler">Download</button>
  </div>
</template>

<script>
import Localizer from "./localizer.js"

export default {
  components: {
  },
  data() {
    return {
      id: "",
      localizer: new Localizer(),
      files: [],
      json: "",
    }
  },
  watch: {
    id(value) {
      this.localizer.update(value)
    }
  },
  created() {
    this.localizer.update(this.id)
  },
  mounted() {
    // todo
    const params = new URLSearchParams(window.location.search)
    if (params.has("id")) {
      const id = params.get("id")
      this.id = id
    }
  },
  methods: {
    async fetchZip() {
      await this.localizer.fetchZip()
      this.files = this.localizer.getFiles()
    },
    async convertFile(name) {
      this.json = await this.localizer.fromFile(name)
    },
    downloadHandler() {
      this.localizer.saveFile(this.json)
    }
  },
  computed: {
    spreadsheetUrl() {
      return `https://docs.google.com/spreadsheets/d/${this.id}`
    }
  }
}
</script>

<style>
</style>
