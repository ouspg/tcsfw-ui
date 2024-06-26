<script>
import Diagram from '@/components/Diagram.vue'
import Details from '@/components/Details.vue'
import {Connector, Host, Service, Focus, Evidence, SystemModel, VERDICT_PASS, VERDICT_FAIL, VERDICT_IGNORE,
    EXPECTED_PASS, EXPECTED_FAIL, EXPECTED_INCON, UNEXPECTED_FAIL, EXTERNAL} from "@/js/model";

import imageDevice from "@/assets/radio-device-gadget-svgrepo-com.svg";
import imageRemote from "@/assets/cloud-upload-svgrepo-com.svg";
import imageMobile from "@/assets/mobile-2-svgrepo-com.svg";
import imageLock from "@/assets/lock-filled-svgrepo-com.svg";
import imageAdmin from "@/assets/wrench-svgrepo-com.svg";
import imageUser from "@/assets/user-filled-svgrepo-com.svg";
import imageRadio from "@/assets/radio-svgrepo-com.svg";
import imageUnknown from "@/assets/text-document-svgrepo-com.svg";
import imageEmpty from "@/assets/empty.svg";
import imageCheckPass from "@/assets/check-pass.svg";
import imageCheckFail from "@/assets/check-fail.svg";
import imageCheckUnexpected from "@/assets/check-unexpected.svg";
import imageQuestionMark from "@/assets/question-mark-svgrepo-com.svg";

export default {
  components: {Diagram, Details},
  data() {
    return {
      endpoint_base: window.location.origin + "/api1",   // varies between API instances
      endpoint_ws_base: window.location.origin.replace(/^http/, "ws") + "/api1",
      apiProxy: "",

      systemModel: new SystemModel(),

      highlightIds: new Map(),     // ids of highlighted entities => 1 primary item and 0 for secondary
      focus: new Focus(),          // focus Host or Connector, if any

      datasetMenu: false,          //dataset menu visible?
      logMenu: false,              //log menu visible?
      selectedLog: null,           //selected log JSON or null
    }
  },

  // Provide global data to the components
  provide() {
    return {
      systemModel: this.systemModel,
      highlightIds: this.highlightIds,
      evidence: this.evidence,
      focus: this.focus,

      connectionHandle: this.connectionHandle,
      statusOverlay: this.statusOverlay,
      queryEventLog: this.queryEventLog,
    }
  },

  methods: {
    /**
     * Reset model
     */
    reset() {
      console.log("Reset model")
      this.systemModel.reset()
      this.selectedLog = null
    },

    /**
      * Connection handle image
      */
    connectionHandle(kind) {
      if (kind === "Device") {
        return imageDevice
      }
      if (kind === "Remote") {
        return imageRemote
      }
      if (kind === "Mobile") {
        return imageMobile
      }
      if (kind === "Encrypted") {
        return imageLock
      }
      if (kind === "User") {
        return imageUser
      }
      if (kind === "Admin") {
        return imageAdmin
      }
      if (kind === "Broadcast") {
        return imageRadio
      }
      return imageUnknown
    },

    /**
      * Status or verdict overlay
      */
    statusOverlay(status) {
      if (status === "Ignore" || status === "" || status === EXPECTED_INCON || status === EXTERNAL) {
        return imageEmpty
      }
      if (status === "Pass" || status === EXPECTED_PASS || status === VERDICT_PASS || status == VERDICT_IGNORE) {
        return imageCheckPass
      }
      if (status === UNEXPECTED_FAIL) {
        return imageCheckUnexpected
      }
      if (status === "Fail" || status === EXPECTED_FAIL || status === VERDICT_FAIL) {
        return imageCheckFail
      }
      return imageQuestionMark
    },

    /**
     * Evidence filter toggled
     */
    evidenceFilterToggled(status) {
      let evidence = this.systemModel.evidence
      let t = status.target
      let ev =evidence.get(t.getAttribute("id"))
      if (ev) {
        ev.selected = t.checked
        this.sendReset()
      }
    },

    /**
     * Toggle all evidence filters
     */
    toggleAllEvidenceFilters(selected) {
      let evidence = this.systemModel.evidence
      let changes = false
      evidence.forEach(e => {
        changes = changes || e.selected !== selected
        e.selected = selected
      })
      if (changes) {
        this.sendReset()
      }
    },
    clearAllEvidenceFilters() { this.toggleAllEvidenceFilters(false) },
    selectAllEvidenceFilters() { this.toggleAllEvidenceFilters(true) },

    /**
     * Send reset with evidence statuses
     */
    sendReset() {
      let evidence = this.systemModel.evidence
      let cont = []
      evidence.forEach(e => {
          cont.push('"' + e.label + '": ' + e.selected)
      })
      let post_c = '{"evidence": {' + cont.join(",") + '}}'
      console.log(post_c)

      let url = this.endpoint_base + "/reset"
      let req = new XMLHttpRequest()
      req.open("POST", url)
      req.setRequestHeader("Content-Type", "application/json")
      req.setRequestHeader("X-Api-Proxy", this.apiProxy)
      req.send(post_c)
    },

    /**
     * Query event log for entity/property
     */
    queryEventLog(entity_id, key="") {
      this.selectedLog = null
      if (entity_id === null) {
        return
      }
      let url = this.endpoint_base + "/log?entity=" + entity_id
      if (key) {
        url += "&key=" + key
      }
      console.log("Query log " + url)

      let req = new XMLHttpRequest()
      req.open("GET", url)
      req.setRequestHeader("X-Api-Proxy", this.apiProxy)
      req.responseType = "json"
      req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
          let res = req.response
          if (res.logs.length > 0) {
            this.selectedLog = res
          }
        }
      }
      req.send()
    },

    /**
     * Close pop-ups
     */
    closePopUps(event) {
      this.datasetMenu = false
      this.logMenu = false
    },

    /**
     * Dataset menu button
     */
    datasetMenuButton(event) {
      event.stopPropagation()
      this.datasetMenu = !this.datasetMenu
    },

    /**
     * Dataset menu button
     */
    logMenuButton(event) {
      event.stopPropagation()
      this.logMenu = !this.logMenu
    },

    /**
     * Establish websocket connection to backend
     */
    establishWebsocket() {
      //check if host/connection given in URL
      let q_params = (new URL(document.location)).searchParams;
      let name1 = q_params.get("host")
      let name2 = q_params.get("host2")
      self.console.log("Selection in URL '" + name1 + "', '" + name2 +"'")

      let external = q_params.get("internal") !== "true"
      this.focus.showExternals = external

      let url = this.endpoint_ws_base + "/model/subscribe?visual=1"
      self.console.log("Open NEW ws-socket: " + url)
      let socket = new WebSocket(url)
      socket.onopen = (event) => {
        self.console.log("WS socket open")
      }
      socket.onmessage = (event) => {
        let js = JSON.parse(event.data)
        if (js.reset) {
          this.reset()  // RESET
          return
        }
        // Most common events first for performance
        if (js.update) {
          let up_id = js.update.id
          self.console.log("Update for " + up_id)
          this.systemModel.applyUpdate(up_id, js.update)
          return
        }
        if (js.connection) {
          // a connection, but we have all connections between host pair as Connector
          let conn = Connector.parse(this.systemModel, js.connection)
          self.console.log("Connector " + conn.id + " [" + conn.status + "]")
          if (!this.focus.isThere() && name1 === conn.source.name && name2 === conn.target.name) {
            this.focus.setConnector(conn) // this connection focused by URL
          }
          return
        }
        if (js.service) {
          let service = Service.parse(this.systemModel, js.service)
          self.console.log("Service " + service.id + " " + service.name + " [" + service.status + "]")
          return
        }
        if (js.component) {
          let com = this.systemModel.parseComponent(js.component, true)
          self.console.log("Component " + com.id + " " + com.name + " [" + com.status + "]")
          return
        }
        if (js.host) {
          let host = Host.parse(this.systemModel, js.host)
          self.console.log("Host " + host.id + " " + host.name + " [" + host.status + "]")
          if (!this.focus.isThere() && name1 === host.name && name2 === null) {
            this.focus.setHost(host)  // this host focused by URL
          }
          return
        }
        if (js.system) {
          this.systemModel.parseSystem(js.system)
          return
        }
        if (js.evidence) {
          let sm = this.systemModel
          sm.evidence.clear()
          let js_map = new Map(Object.entries(js.evidence))
          js_map.forEach(function (ev, key) {
            let e = new Evidence(key, ev.name, ev.selected)
            if ("time_s" in ev) {
              e.timestamp = ev.time_s
            }
            sm.evidence.set("evidence-" + key, e)
          })
          return
        }
      }
      socket.onclose = (event) => {
        if (event.code === 4401) {
          console.log("WS permission check failed")
          setTimeout(this.connectEndpoint, 1000)
        } else {
          // Error or reload of the model
          console.log("WS unexpected close code " + event.code)
          setTimeout(this.connectEndpoint, 1000)
        }
      }
      socket.onerror = (event) => {
        // Error, wait a bit and reconnect
          console.log("WS error")
          // setTimeout(this.connectEndpoint, 1000)
      }
    },

    /***
     * Login to endpoint to access and then establish websocket
     */
    connectEndpoint() {
      let req = new XMLHttpRequest()
      let location = window.location.pathname
      if (location.startsWith("/statement")) {
        location = location.substring(10)
      }
      let url = window.location.origin + "/login" + location + window.location.search
      console.log("Login endpoint " + url +" ...")
      req.open("GET", url)
      req.responseType = "json"
      req.onreadystatechange = () => {
        if (req.readyState !== 4) {
          return
        }
        if (req.status === 200) {
          console.log("login success")
          const apiKey = req.response.api_key || ""
          if (apiKey) {
            document.cookie = "authorization=" + apiKey +";path=/;samesite=strict"
            console.log("New authentication cookie set")
          }
          const proxy = req.response.api_proxy || ""
          if (proxy) {
            this.apiProxy = proxy
            this.endpoint_base = window.location.origin + "/api1"
            // WS socket does not allow custom headers - using URL hack
            this.endpoint_ws_base = window.location.origin.replace(/^http/, "ws") + "/proxy/ws/" + proxy + "/api1/ws"
          } else {
            this.apiProxy = ""
            this.endpoint_base = window.location.origin + "/api1"
            this.endpoint_ws_base = window.location.origin.replace(/^http/, "ws") + "/api1/ws"
          }
          console.log("API base " + this.endpoint_base +", X-Api-Proxy: " + this.apiProxy)
          console.log("API ws base " + this.endpoint_ws_base)
          this.establishWebsocket()
        } else if (req.status === 401) {
          console.log("Endpoint permission check failed, trying again...")
          setTimeout(this.connectEndpoint, 1000)
        } else {
          console.log("Endpoint unexpected status code " + req.status)
          setTimeout(this.connectEndpoint, 1000)
        }
      }
      req.send()
    },
  },

  mounted() {
    this.connectEndpoint()
  }
}

</script>

<template>
    <div id="diagram" class="container" @click="closePopUps">
        <div class="y_split y_top">
          <div id="view_header">{{systemModel.name}}</div>
          <!-- Dataset menu -->
          <div class='top_menu'>
            <button class='menu_button' @click="datasetMenuButton">Select datasets &#709;</button>
            <div id='select_dataset' v-if="datasetMenu">
              <table>
                <tr v-for="e in systemModel.evidence.values()" class="dataset_item">
                  <td><input type="checkbox" :checked="e.selected" :id="`evidence-` + e.label"
                           @click="evidenceFilterToggled"/></td>
                  <td>{{e.name}}</td>
                  <td>{{e.timestamp}}</td>
                </tr>
              <tr>
                <td></td>
                <td><button @click="clearAllEvidenceFilters">Clear all</button>
                    <button @click="selectAllEvidenceFilters">Select all</button></td>
              </tr>
              </table>
            </div>
          </div>
          <!-- Event log menu -->
          <div class='top_menu'>
            <button class='menu_button' @click="logMenuButton"
                    :disabled="!selectedLog">View event log</button>
            <div id='select_dataset' v-if="logMenu && selectedLog">
              <table>
                <tr v-for="s in selectedLog.logs" class="dataset_item" :title="s.ref">
                  <td>{{s.verdict}}</td>
                  <td>{{s.entity}}</td>
                  <td>{{s.info}}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        <div class="y_split y_bottom">
          <div class="x_split x_left" id="diagram_wrapper">
            <Diagram/>
          </div>
          <div class="x_split x_right">
            <Details/>
          </div>
        </div>
    </div>
</template>

<style>
  /* body to remove Vue messing things up? */
  body, .container {
    height:100%;
    margin: 0;
  }
  .container {
    inset: 0 0 0 0;
    font-family: monospace;
    text-align: left;
    vertical-align: top;
    border-width: 0 0 0 0;
    scrollbar-color: lightseagreen #001a33;
  }

  .y_split {
    position: absolute;
    box-sizing: border-box;
  }
  .y_top {
    height: 50px;
    width: 100%;
    background: #004080;
    border-bottom-style: solid;
    position: absolute;
    box-sizing: border-box;
  }
  #view_header {
    font-size: 27px;
    margin: 5px 10px;
    float: left;
    color: lightblue;
  }
  .top_menu {
    float: left;
  }
  .menu_button {
    background-color: lightseagreen;
    margin: 10px 10px 0 0;
  }
  #select_dataset {
    background: cadetblue;
    display: block;
    position: absolute;
    min-width: 300px;
    max-width: 500px;
    max-height: 500px;
    padding: 12px 16px;
    z-index: 1;
    overflow: auto;
  }
  .dataset_item:hover {
    background: lightseagreen;
  }

  .y_bottom {
    top: 50px;
    bottom: 0;
    width:100%;
    /* background: green; */
  }
  .x_split {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  .x_left {
    width: 65%;
    float: left;
    /* background: red; */
  }
  .x_right {
    width: 35%;
    float: right;
    background: #004080;
  }
  #diagram_wrapper {
    background-color: #001a33;
    background: linear-gradient(#001a33, #004080);
  }
</style>