<script>

import {Connector, Evidence, Focus, Host, SystemModel} from "@/js/model";

export default {
    data() {
        return {
            sections: [],         // view sections
            legend: new Map(),    // legend data
            systemInfo: {         // system name
                systemName: "Coverage view",
                specification: "",
            },
            expandRow: null,         // expanded row
            expandCell: null,     // expanded concept
        }
    },

  methods: {
      /**
       * Establish websocket connection to backend
       */
      getData() {
          let q_params = (new URL(document.location)).searchParams;
          let spec = q_params.get("spec")
          let url = window.location.origin + "/api1/coverage"
          if (spec) {
              url += "/" + spec
          }
        let req = new XMLHttpRequest()
        let r_this = this
        req.open("GET", url, true)
        req.onload = function () {
          if (req.status === 200) {
            // Success!
            let data = JSON.parse(req.responseText);
            r_this.systemInfo.systemName = data.system["system_name"]
            r_this.systemInfo.specification = data["specification_name"]
            r_this.sections.length = 0
            r_this.sections.push(...data.sections)
            r_this.legend = new Map(Object.entries(data.legend))
          }
        }
        req.send()
        console.log("Get data: " + url)
      },

      /**
       * Cell marker.
       */
      cellMarker(stateName) {
          //return stateName
          switch (stateName) {
              case "Tool Pass": return "&#x25fc;"
              case "Tool Not seen": return "&square;"
              // case "Tool Ignore": return "-"
              case "Tool Ignore": return "&#xff0d;"
              case "Tool Fail": return "X"
              case "Manual Pass": return "&#x25cf;"
              case "Manual Ignore": return "-"
              case "Model Pass": return "&#x25d6;"
              case "Model Ignore": return "&cir;"
              case "Model Undefined": return " <b>?</b>"
              default: return stateName
          }
      },

      /**
       * Mouse over a row.
       */
      selectRowCell(event, row, cell=null) {
          console.log("selectRowCell")
          if (this.expandRow === row && this.expandCell === cell) {
            this.expandRow = null
            this.expandCell = null
          } else {
            this.expandRow = row
            this.expandCell = cell
          }
          event.stopPropagation() // do not clear info row
      },

      /**
       * Clear info row
       */
      clearInfoRow(event) {
          this.expandRow = null
          this.expandConcept = null
      }
  },

  mounted() {
      this.getData()
  }
}
</script>

<template>
  <h1 @click="clearInfoRow">
      {{systemInfo.systemName}}
      <text v-if="systemInfo.specification"> - {{systemInfo.specification}}</text>
  </h1>
  <div @click="clearInfoRow">
    <template v-for="s in sections">
      <table class="coverage_table">
        <tr>
          <th class="section_name">{{s.name}}</th>
          <th v-for="c in s.columns" class="column_name">{{c.name}}</th>
        </tr>
        <!-- Data rows -->
        <template v-for="(r, i) in s.rows">
          <tr :class="expandRow === r ? 'expanded_row' : ''">
            <th :class="(expandRow === r && expandCell === null ? 'expanded_name': 'row_name') + ' light_' + r.row_light"
                 v-on:click="selectRowCell($event, r)" :title="r.text">{{r.short}}</th>
            <td v-for="c in r.columns"
                :class="(expandCell === c ? 'expanded_value': 'row_value') + ' light_' + c.light"
                v-on:click="selectRowCell($event, r, c)" >
                  <template v-for="s in c.checks">
                    <text v-html="cellMarker(s)"></text>
                  </template>
                  <text v-if="c.flags.includes('ui')"> &#128400;</text>
                  <text v-if="c.flags.includes('doc')"> &#128220;</text>
                  <text v-if="c.flags.includes('physic')"> &#128295;</text>
            </td>
          </tr>
          <tr v-if="expandRow === r" class="expanded_row">
              <td v-if="expandCell" :class="'info_row light_' + expandCell.light" :colspan="1 + r.columns.length">
                  <!-- Info for cell -->
                  <text>
                    {{r.id}} <b>at</b> {{expandCell.name}}
                    <br/>{{expandCell.description}}
                    <text v-if="Object.keys(expandCell.properties).length > 0">
                      <br/>Properties:
                        <text v-for="(v, k) in expandCell.properties">
                          <text v-if="v.value"> &#9746; </text><text v-else> &#9744; </text>
                          <text class="property_name">{{k}} </text>
                          <text class="property_tool">{{v.tools.join(',')}} </text>
                      </text>
                    </text>
                  </text>
              </td>
              <td v-else :class="'info_row light_' + r.row_light" :colspan="1 + r.columns.length">
                  <!-- Info for row -->
                  <text class="multiline">{{r.text}}</text>
              </td>
          </tr>
        </template>
      </table>
      <p></p>
    </template>
    <h2>Legend</h2>
    <table class="legend">
      <tr v-for="n in legend.values()">
          <template v-if="n.state_name">
            <td class="legend_marker"><span v-html="cellMarker(n.state_name)"></span></td>
            <td>{{n.description}}</td>
            <td>{{n.count}}</td>
          </template>
          <template v-else>
            <th colspan="2">{{n.description}}</th>
            <th>{{n.count}}</th>
          </template>
      </tr>
    </table>
  </div>
</template>

<style>
  table {
      border-spacing: 0;
      border: 1px solid black;
      cursor: default;
  }
  .coverage_table {
      width: 100%;
  }
  .section_name {
      width: 250px;
      background-color: lightgray;
  }
  .column_name {
      background-color: lightgray;
  }
  .expanded_row {
  }
  .info_row {
      padding: 0 10px 0 10px;
      filter: brightness(90%);
  }
  .row_name {
      vertical-align: top;
      cursor: pointer;
  }
  .row_name:hover {
      filter: brightness(80%);
  }
  .expanded_name {
      vertical-align: top;
      filter: brightness(90%);
      cursor: pointer;
  }
  .expanded_name:hover {
      filter: brightness(80%);
  }
  .row_value {
      text-align: center;
      cursor: pointer;
  }
  .row_value:hover {
      filter: brightness(80%);
  }
  .expanded_value {
      text-align: center;
      filter: brightness(90%);
      cursor: pointer;
  }
  .expanded_value:hover {
      filter: brightness(80%);
  }
  .light_ {
      background-color: #f2f2f2;
  }
  .light_red {
      background-color: #ff9999;
  }
  .light_green {
    background-color: #8cd9b3;
  }
  .light_yellow {
      background-color: #e0e0e0;  /* grey */
  }
  th, td {
      border: 1px solid white;
  }
  .legend {
      background-color: lightgray;
  }
  .legend_marker {
      text-align: center;
  }
  .property_name {
      font-family: monospace;
  }
  .property_tool {
      vertical-align: super;
  }
  .multiline {
    white-space: pre-line;
  }
</style>
