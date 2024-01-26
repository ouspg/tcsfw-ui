<script>

import {Connector, Evidence, Focus, Host, SystemModel} from "@/js/model";

export default {
  data() {
    return {
      systemInfo: {         // system name
          systemName: "Tabular view",
      },
      sections: [],         // view sections
      detailsOfRow: [null], // one row or null
    }
  },

  methods: {
      /**
     * Establish websocket connection to backend
     */
    getData() {
        let url = window.location.origin + "/api1/tabular"
        let req = new XMLHttpRequest()
        let systemInfo = this.systemInfo
        let sections = this.sections
        req.open("GET", url, true)
        req.onload = function () {
          if (req.status === 200) {
            // Success!
            let data = JSON.parse(req.responseText);
            systemInfo.systemName = data.system["system_name"]
            sections.length = 0
            sections.push(...data.sections)
          }
        }
        req.send()
        console.log("Get data: " + url)
    },

    /**
     * Get cell class by verdict
     */
    cellClass(row, index) {
      let cc = ""
      if (index === 0) {
        cc = "_section cell_section_header"
      }
      if (row.verdict === "pass") {
        return "cell_pass" + cc
      }
      if (row.verdict === "fail") {
        return "cell_fail" + cc
      }
      return "cell_inco" + cc  // inconlusive
    },

    /**
     * Show or clear row details
     */
    rowDetails(event, row=null) {
      event.stopPropagation()
      if (row === this.detailsOfRow[0]) {
        this.detailsOfRow[0] = null
      } else {
        this.detailsOfRow[0] = row
      }
    },
  },


  mounted() {
    this.getData()
  }
}
</script>

<template>
  <div v-on:click="rowDetails($event,null)">
    <h1>{{systemInfo.systemName}}</h1>
    <table>
      <tr>
        <th class="column_title"></th>
        <th class="column_title">Claimed</th>
        <th class="column_title">Verified</th>
        <th class="column_title">Verdict</th>
        <th class="column_title"></th>
      </tr>
      <template v-for="s in sections">
        <tr v-for="(r, i) in s.rows">
          <td :class="`cell_title ` + cellClass(r, i)" :title="r.info   ">{{r.title}}</td>
          <td :class="`cell ` + cellClass(r, i)">{{r.claimed}}</td>
          <td :class="`cell ` + cellClass(r, i)">{{r.verified}}</td>
          <td :class="`cell ` + cellClass(r, i)">{{r.verdict}}</td>
          <td :class="`cell ` + cellClass(r, i)">
            <div v-if="i > 0" id="row_details_menu">
              <button :class="r" v-on:click="rowDetails($event, r)">...</button>
              <div v-if="detailsOfRow[0] === r" id='select_row_details'>
                <table class="table_row_details">
                  <tr v-for="e in r.entities" class="details_row">
                    <td class="detail_item">{{e}}</td>
                  </tr>
                  <tr v-if="r.entities.length === 0" class="details_row">
                    <td class="detail_item">-empty-</td></tr>
                </table>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </table>
  </div>
</template>

<style>
  .column_title {
    background-color: lightgray;
  }
  .cell_title {
  }
  .cell {
    text-align: center;
  }
  .cell_section_header {
    text-align: center;
    font-weight: bold;
  }
  .cell_pass_section {
    background-color: rgb(197,214,101);
  }
  .cell_pass {
    background-color: rgb(217,234,211);
  }
  .cell_fail_section {
    background-color: rgb(224,184,184);
  }
  .cell_fail {
    background-color: rgb(244,204,204);
  }
  .cell_inco_section {
    background-color: rgb(235,222,184);
  }
  .cell_inco {
    background-color: rgb(255,242,204);
  }

  #row_details_menu, #select_row_details {
    background-color: lightgray;
  }
  #row_details_menu {
    float: right;
    position: relative;
  }
  #select_row_details {
    display: block;
    position: absolute;
    z-index: 1;
    right: 0;
    border: 5px black;
  }
  .table_row_details, .details_row {
    border: 1px solid;
    border-collapse: collapse;
  }
  .detail_item {
    border: 1px solid;
    padding: 3px;
    white-space:nowrap;
    text-align: left;
  }
  .detail_item:hover {
    background-color: gray;
    cursor: pointer;

  }
</style>