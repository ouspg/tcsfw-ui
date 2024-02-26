<script>
import {inject, h} from "vue";

import imageUnknown from "/src/assets/text-document-svgrepo-com.svg";

export default {
  props: [
      'component',  // Component or entity with properties
  ],
  data() {
    return {
      statusOverlay: inject('statusOverlay'),
      embeddedCheck: inject('embeddedCheck'),
      expandedIds: inject('expandedIds'),
      entityClass: inject('entityClass')
    }
  },
  methods: {
    propertyMarker() {
      return imageUnknown
    }
  },
}
</script>

<template>
    <tr v-for="(h, k) in component.properties">
        <td :class="entityClass('cell_info', component, k)" v-on:click="clickSelectable($event, component, k)"
            :title="k + ' (' + h.verdict + ')'">
        <svg height="25" width="25" class="embedded_check">
            <image v-if="h.verdict && h.verdict !== 'Ignore'" :href="statusOverlay(h.verdict)" width="25"/>
            <image v-else :href="propertyMarker()" width="25"/>
        </svg>
        {{h.info}}
        </td>
    </tr>
</template>

<style>
  .level_0_selected {
    background-color: silver;
    border: 1px solid red;
  }
  .level_1_selected {
    background-color: silver;
    border: 1px solid red;
  }
  .level_2_selected {
    background-color: silver;
    border: 1px solid red;
  }
  .cell_info_selected {
    background-color: silver;
    border: 1px solid red;
  }
  .info_row {
    cursor: pointer;
  }
  .right_check {
      text-align: right;
  }
  .expandable {
    font-size: smaller;
    color: blue;
  }
</style>