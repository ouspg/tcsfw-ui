<script>
import {inject, h} from "vue";
import PropertyDetails from "@/components/PropertyDetails.vue";

import imageUnknown from "/src/assets/text-document-svgrepo-com.svg";

export default {
    components: {PropertyDetails},
    props: [
        'component', // Component
        'level', // 0, 1, 2
        'expand' // string
    ],
    data() {
        return {
            statusOverlay: inject('statusOverlay'),
            embeddedCheck: inject('embeddedCheck'),
            clickSelectable: inject('clickSelectable'),
            expandedIds: inject('expandedIds'),
            entityClass: inject('entityClass')
        };
    },
    computed: {
        levelName() { return "level_" + this.level; }
    },
    methods: {
        propertyMarker() {
            return imageUnknown;
        }
    },
    components: { PropertyDetails }
}
</script>

<template>
    <tr :class="component.id + ' info_row'" v-on:click="clickSelectable($event, component)">
        <th v-if="level === '0'" colspan="2" :class="entityClass(levelName, component)">
            {{component.name}}
            <text class="expandable" v-if="expand">{{expand}}</text>
        </th>
        <td v-else colspan="2" :class="entityClass(levelName, component)" :title="component.value">
            <span v-if="level === '2'">-</span>
            {{component.name}}
            <text class="expandable" v-if="expand">{{expand}}</text>
        </td>
        <td class="right_check"><span v-html="embeddedCheck('', component.status)"></span></td>
    </tr>
    <template v-if="expandedIds.has(component.id)">
      <PropertyDetails :component="component"/>
    </template>
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