<script>
import {inject} from "vue";
import {Service, statusChar} from "@/js/model";
import ComponentDetails from "@/components/ComponentDetails.vue";
import PropertyDetails from "@/components/PropertyDetails.vue";

export default {
  components: {ComponentDetails, PropertyDetails},
  data() {
    return {
      focus: inject('focus'),
      systemModel: inject('systemModel'),
      highlightIds: inject('highlightIds'),
      connectionHandle: inject('connectionHandle'),
      statusOverlay: inject('statusOverlay'),
      queryEventLog: inject('queryEventLog'),

      focusIds: new Set(),        // focus host or connector ids
      expandedIds: new Set(),     // expanded connections
      selected: null             // selection array of one or two: [entity_id, [key]]
    }
  },
  provide() {
    return {
        embeddedCheck: this.embeddedCheck,
        clickSelectable: this.clickSelectable,
        expandedIds: this.expandedIds,
        entityClass: this.entityClass,
    }
  },
  computed: {
  },
  methods: {
    /**
     * List connectors for host service or outgoing
     */
    listHostConnections(host, service) {
      let r = []
      let sm = this.systemModel
      sm.connectors.forEach(function(connector, cid) {
        if (connector.id !== cid) {
          return // seek for connectors
        }
        connector.connections.forEach(c => {
          if (service && c.target === service) {
            r.push(c) // connection to a service
          }
          else if (!service && c.source === host) {
            r.push(c)  // client connection from a host
          }
          else if (!service && (c.source instanceof Service) && c.source.parent_host === host) {
            r.push(c)  // client connection from a host service (specific source port, at least DHCP)
          }
        })
      })
      return r
    },

    /**
     * Are there any connections for host service or outgoing?
     */
    anyHostConnections(host, service) {
      return this.listHostConnections(host, service).length > 0
    },

    /**
     * Embed status char into HTML
     */
    embedStatusChar(status) {
      return statusChar(status, false)
    },

    /**
     * Expansion marker for entity
     */
    expansionMarker(entity, check=true) {
      if (!check) {
        return ""
      }
      if (this.expandedIds.has(entity.id)) {
        return "[-]"
      }
      return "[+]"
    },

    /**
     * Find nearest parent with the class list you are looking for.
     */
    findClassList(element) {
      let target = element
      while (target.tagName !== "TR" && target.parentNode) {
        target = target.parentNode
      }
      if (target.classList) {
        return target.classList
      }
      return []
    },

    /**
     * Element class for entity or connector in detail view
     */
    entityClass(base, entity, key=null) {
      let cl = [entity.id]  // FIXME: Nuke use of id in class
      if (this.selected && (this.selected.length === 1 && this.selected[0] === entity.id && key === null
          || this.selected.length === 2 && this.selected[0] === entity.id && this.selected[1] === key)) {
        cl.push(base + "_selected")
      } else if (this.highlightIds.get(entity.id) === 1) {
        cl.push(base + "_high")
      } else {
        cl.push(base)
      }
      return cl.join(" ")
    },

    /**
     * Mouse over to focus
     */
    mouseOverFocus(event) {
      let host = this.focus.host
      if (host) {
        this.highlightIds.set(host.id, 0)
        this.focusIds.add(host.id)
      }
      let connector = this.focus.connector
      if (connector) {
        this.highlightIds.set(connector.id, 0)
        this.focusIds.add(connector.id)
      }
    },
    mouseLeaveFocus(event) {
      this.highlightIds.clear()
      this.focusIds.clear()
    },

    /**
     * Mouse over connector or connection
     */
    mouseOverConnector(event) {
      this.highlightIds.clear()
      let r_this = this
      let c_list = this.findClassList(event.target)
      c_list.forEach(cl => {

        let conn = this.systemModel.connectors.get(cl)
        if (conn) {
          let is_connector = conn.id === cl // highlight connector? (not connection)
          if (is_connector) {
            r_this.highlightIds.set(conn.id, 1)
          } else {
            // highlight primarily the connection
            r_this.highlightIds.set(cl, 1)
            r_this.highlightIds.set(conn.id, 0)
          }
          this.systemModel.entities.forEach(function(e) {
            if (conn.source === e || conn.target === e) {
              r_this.highlightIds.set(e.id, 0)
            }
          })
        }
      })
    },

    /**
     * Mouse leaves something
     */
    mouseLeaveItem(event) {
      this.highlightIds.clear()
      this.focusIds.forEach(id => this.highlightIds.set(id, 0))
    },

    /**
     * Click connection
     */
    clickConnection(event, entity) {
      this.clickSelectable(event, entity)
    },

    /**
     * Click selectable service, software, ..?
     */
    clickSelectable(event, entity, key="") {
      this.selected = null
      let cid = entity.id
      if (key) {
        // Property selected
        console.log("select " + cid + " " +key)
        this.selected = [cid, key]
        this.queryEventLog(cid, key)
      } else {
        if (!this.expandedIds.has(cid)) {
          // Entity selected
          console.log("select " + cid)
          this.selected = [cid]
          this.queryEventLog(cid)
          this.expandedIds.clear()
          this.expandedIds.add(cid)
        } else {
          // Entity de-selected
          console.log("de-select " + cid)
          this.selected = null
          this.queryEventLog(null)
          this.expandedIds.clear()
        }
      }
    },

    /**
     * Embedded kind and check overlay.
     */
    embeddedCheck(kind, status, size=25) {
      let handle = this.connectionHandle(kind)
      let overlay = this.statusOverlay(status)
      let html = `
        <svg height="${size}" width="${size}" class="embedded_check">
          <image href="${handle}" width="${size}"/>
          <image href="${overlay}" width="${size}"/>
        </svg>`
      return html
    },

    /***
     * Toggle the external/internal tab
     */
    toggleExternalInternal(value) {
        console.log("External(internal): " + value)
        this.focus.showExternals = value
        history.replaceState(null, "", window.location.origin + window.location.pathname
          + this.focus.queryParameters())
    },
  },
}

</script>

<template>
  <div id="details_top" @mouseover="mouseOverFocus" @mouseleave="mouseLeaveFocus">
    <!-- Host in focus -->
    <div class="details_tab">
        <button :class="focus.showExternals ? 'tab_button_active' : 'tab_button'"
                v-on:click="toggleExternalInternal(true)">Externals</button>
        <button :class="focus.showExternals ? 'tab_button' : 'tab_button_active'"
                v-on:click="toggleExternalInternal(false)">Internals</button>
    </div>
    <div id="details">
      <div v-if="!focus.isThere()">
        <h2>{{systemModel.name}}</h2>
        <template v-for="com in systemModel.components">
          <ComponentDetails :component="com" level="0"
                            :expand="expansionMarker(com, com.properties.length > 0)"/>
          <template v-for="sub in com.sub_components">
            <ComponentDetails :component="sub" level="1"
                              :expand="expansionMarker(sub, sub.properties.length > 0)"/>
            <template v-for="sub2 in sub.sub_components">
              <ComponentDetails :component="sub2" level="2"
                                :expand="expansionMarker(sub2, sub2.properties.length > 0)"/>
            </template>
          </template>
        </template>
      </div>

      <div v-if="focus.host">
        <h2>
          <span v-html="embeddedCheck(focus.host.kind, focus.host.status, 30)"/>
          {{focus.host.name}}
        </h2>
        <p>{{focus.host.description}}</p>

        <div v-if="focus.showExternals">
            <!-- Host Externals -->
            <p v-if="focus.host.addresses.length > 0">
              <b>Aliases:</b><text v-for="addr in focus.host.addresses">{{` `}}{{addr}}</text>
            </p>
            <table class="detail_table">
            <template v-if="focus.host.list_services().length > 0">
              <tr class="info_row">
                <th colspan="2" class="cell_header">
                  Services
                </th>
              </tr>
            </template>
            <template v-for="s in focus.host.list_services()">
              <tr :class="entityClass(`info_row`, s)"
                  v-on:click="clickSelectable($event, s)">
                <td class="cell_top_info">
                  {{s.name}} <text class="expandable" v-html="expansionMarker(s, s.properties.size > 0)"/>
                </td>
                <td class="cell_value">
                  <span v-html="embeddedCheck(s.kind, s.status)"/>
                </td>
              </tr>
              <template v-if="expandedIds.has(s.id) && s.properties.size > 0">
                <tr v-for="[k, h] in s.properties">
                    <td :class="entityClass(`cell_info`, s, k)" v-on:click="clickSelectable($event, s, k)"
                        :title="k">
                      <svg height="25" width="25" class="embedded_check"><image :href="statusOverlay(h.verdict)" width="25"/></svg>
                      {{h.info}}
                    </td>
                </tr>
              </template>
              <template v-for="c in listHostConnections(focus.host, s)">
                  <tr :class="entityClass(`info_row`, c)"
                      @mouseover="mouseOverConnector" @mouseleave="mouseLeaveItem" v-on:click="clickConnection($event, c)">
                    <td class="cell_info">
                      <text class="arrow">&xlarr;</text> {{c.source_name}}
                    </td>
                    <td class="cell_value">
                      <span v-html="embeddedCheck(c.kind, c.status)"/>
                    </td>
                  </tr>
              </template>
            </template>

            <template v-if="anyHostConnections(focus.host, null)">
              <tr class="info_row">
                <th colspan="2" class="cell_header">
                  Client connections
                </th>
              </tr>
              <template v-for="c in listHostConnections(focus.host, null)">
                  <tr :class="entityClass(`info_row`, c)"
                      v-on:click="clickConnection($event, c)" @mouseover="mouseOverConnector" @mouseleave="mouseLeaveItem">
                    <td class="cell_info">
                      <text class="arrow"> &xrarr;</text> {{c.target_name}}
                    </td>
                    <td class="cell_value">
                      <span v-html="embeddedCheck(c.kind, c.status)"/>
                    </td>
                  </tr>
              </template>
            </template>
          </table>
        </div> <!-- showExternal -->
        <div v-else>
            <!-- Show properties -->
            <h4>Annotations
              <text class="expandable" v-on:click="clickSelectable($event, focus.host)">
                {{expansionMarker(focus.host, Object.keys(focus.host.properties).length > 0)}}
              </text>
            </h4>
            <table v-if="expandedIds.has(focus.host.id)" class="detail_table">
              <PropertyDetails :component="focus.host"/>
            </table>

            <!-- Show components -->
            <h3 v-if="Object.keys(focus.host.components).length > 0">Components</h3>
            <table class="detail_table">
              <template v-for="com in focus.host.components">
                <ComponentDetails :component="com" level="0"
                                  :expand="expansionMarker(com, Object.keys(com.properties).length > 0)"/>
                <template v-for="sub in com.sub_components">
                  <ComponentDetails :component="sub" level="1"
                                    :expand="expansionMarker(sub, Object.keys(sub.properties).length > 0)"/>
                  <template v-for="sub2 in sub.sub_components">
                    <ComponentDetails :component="sub2" level="2"
                                      :expand="expansionMarker(sub2, Object.keys(sub2.properties).length > 0)"/>
                  </template>
                </template>
              </template>
            </table>

            <!-- Internals per service -->
            <template v-for="s in focus.host.list_services()">
                <h3>
                  {{s.name}} annotations
                  <text class="expandable" v-on:click="clickSelectable($event, s)">
                    {{expansionMarker(s, Object.keys(s.properties).length > 0)}}
                  </text>
                </h3>
                <table v-if="expandedIds.has(s.id)" class="detail_table">
                  <PropertyDetails :component="s"/>
                </table>
            </template>
        </div>
      </div>

      <!-- Connector in focus -->
      <div v-if="focus.connector">
        <div>
          <h2>
           <span v-html="embeddedCheck(focus.connector.kind, focus.connector.status, size=30)"/>
            {{focus.connector.source.name}} <text class="arrow">&xharr;</text> {{focus.connector.target.name}}
          </h2>
        </div>

        <div v-if="focus.showExternals">
          <h4>Connections</h4>
          <table class="detail_table">
            <template v-for="c in focus.connector.connections">
              <tr :class="entityClass(`info_row`, c)"
                   v-on:click="clickConnection($event, c)" @mouseover="mouseOverConnector" @mouseleave="mouseLeaveItem">
                <td class="cell_info">
                  {{c.source.name}} <text class="arrow">&xharr;</text> {{c.target.name}}
                </td>
                <td class="cell_value">
                  <span v-html="embeddedCheck(c.kind, c.status)"/>
                </td>
              </tr>
            </template>
          </table>
        </div> <!-- showExternal -->
      </div>
    </div>
  </div>
</template>

<style>
  #details_top {
    margin: 5px;
    cursor: default;
    color: lightblue;
  }
  .details_tab {
  }
  .tab_button {
    border: none;
    background-color: inherit;
  }
  .tab_button_active {
    background-color: cadetblue;
    border: 1px solid black;
  }
  #details {
  }
  .expandable {
    font-size: smaller;
    color: rgb(159, 131, 196);
  }
  .arrow {
    font-size: 25px;
    color: blueviolet;
     /* adjust arrow lower then default */
    position: relative;
    top: 0.1em;
  }
  .embedded_check {
    vertical-align: middle;
  }
  .expandable:hover {
    cursor: pointer;
  }
  .detail_table {
    border-collapse: collapse;
    border-bottom: 1px solid black;
    width: 100%;
  }
  .info_row {
    border-top: 1px solid black;
  }
  .info_row:hover {
    background-color: #001a33;
  }
  .info_row_high {
    background-color: #001a33;
    border-color: silver;
  }
  .info_row_selected {
    background-color: #013464;
  }
  .info_row_selected:hover {
    background-color: #001a33;
  }
  .cell_header {
    padding-top: 20px;
  }
  .cell_top_info {

  }
  .cell_info {
    padding-left: 10px;
  }
  .cell_info_selected {
    padding-left: 10px;
    background-color: #001a33;
  }
  .cell_value {
    text-align: right;
  }
  .cell_info:hover {
    background-color: #001a33;
  }
</style>