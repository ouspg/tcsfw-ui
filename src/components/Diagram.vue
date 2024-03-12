<script>
import {Host, Connector, statusChar} from '@/js/model'
import {inject} from "vue";

/**
 * Find parent group for an element.
 */
function findParentGroup(element) {
  let p = element
  while (p && (p.tagName !== "g" || p.classList.length === 0)) {
    p = p.parentNode
  }
  return p
}

export default {
  data() {
    return {
      entity_width: 120,
      font_size: 20,

      zoom_size: 1000,
      top_corner: [0, 0],
      mouse_drag_start: { x: null, y: null },

      systemModel: inject('systemModel'),
      highlightIds: inject('highlightIds'),
      focus: inject('focus'),
      connectionHandle: inject('connectionHandle'),
      statusOverlay: inject('statusOverlay'),
    }
  },
  computed: {
    /**
     * List visible hosts and connections
     */
    listHosts() { return this.systemModel.listHosts() },
    listConnectors() { return this.systemModel.listConnectors() },
  },
  methods: {
    /**
     * Embed status char for status
     */
    embedStatusChar(status, omit_no_info=false) {
      return statusChar(status, omit_no_info)
    },

    /**
     * Find selected host.
     */
    findSelectedHost(element) {
      let p = findParentGroup(element)
      if (p) {
        for(let i = 0; i <p.classList.length; i++) {
          let cl = p.classList[i]
          if (cl.startsWith("host-")) {
            return this.systemModel.entities.get(cl)
          }
        }
      }
      return null
    },

    /**
     * Find selected connector.
     */
    findSelectedConnector(element) {
      let p = findParentGroup(element)
      if (p) {
        for(let i = 0; i <p.classList.length; i++) {
          let cl = p.classList[i]
          if (cl.startsWith("conn-")) {
            return this.systemModel.connectors.get(cl)
          }
        }
      }
      return null
    },

    /**
     * Mouse events
     */
    clickBackground(event) {
      console.log("Background click")
      this.focus.setHost(null)  // clear selection
      history.replaceState(null, "", window.location.origin + window.location.pathname)
    },
    clickHost(event) {
      let host = this.focus.setHost(this.findSelectedHost(event.target))
      if (host) {
        history.replaceState(null, "", window.location.origin + window.location.pathname
          + this.focus.queryParameters())
      }
      event.stopPropagation()
    },
    clickConnector(event) {
      let conn = this.focus.setConnector(this.findSelectedConnector(event.target))
      if (conn) {
        let tail = ""
        conn.connections.forEach(c => {
          tail += ", " + c.id
        })
        console.log("Connector: " + conn.id + tail)
        history.replaceState(null, "", window.location.origin + window.location.pathname
          + this.focus.queryParameters())
      }
      event.stopPropagation()
    },

    mouseOverEvent(event, entity, over) {
      this.highlightIds.clear()
      if (!over) {
        return
      }
      let r_this = this
      if (entity instanceof Host) {
        this.highlightIds.set(entity.id, 1)
        this.systemModel.connectors.forEach(function(c) {
          if (c.source === entity || c.target === entity) {
            r_this.highlightIds.set(c.id, 0)
            //highlights too much... goes confusing
            //r_this.highlightIds.set(c.source.id, 0)
            //r_this.highlightIds.set(c.target.id, 0)
          }
        })
      }
      if (entity instanceof Connector) {
        this.highlightIds.set(entity.id, 1)
        entity.connections.forEach(c => {
          this.highlightIds.set(c.id, 1)
        })
        this.systemModel.entities.forEach(e => {
          if (entity.source === e || entity.target === e) {
            r_this.highlightIds.set(e.id, 0)
          }
        })
      }
    },

    /**
     * Circle dynamic attributes for host
     */
    hostCircleAttributes(host) {
      let is_high = this.highlightIds.has(host.id)
      let mc = host.kind === "Admin" || host.kind === "Broadcast"
      return {
        cx: host.x,
        cy: host.y,
        r: this.entity_width / 2 * (is_high ? 1.2 : 1.0),
        fill: mc ? "#e0e0e0" : "darkkhaki",
        stroke: "black",
        'stroke-dasharray': mc ? "10, 10" : "",
      }
    },

    /**
     * Image dynamic attributes for host
     */
    hostImageAttributes(host, scale=1) {
      let is_high = this.highlightIds.has(host.id)
      let dia = this.entity_width * scale * (is_high ? 1.2 : 1.0)
      return {
        x: host.x - dia / 2,
        y: host.y - dia / 2,
        width: dia,
        height: dia,
      }
    },

    /**
     * Zoom in and out
     */
    zoom(f) {
      this.zoom_size *= f
      /*let d_wrapper = document.getElementById("diagram_wrapper")
      let hf = 1 + (f - 1) / 2  //half the change
      let nx = d_wrapper.scrollLeft * f
      let ny = d_wrapper.scrollTop * f
      d_wrapper.scrollTo(nx, ny)*/
    },
    zoomIn(event) { this.zoom(1 / 0.8); event.stopPropagation() },
    zoomOut(event) { this.zoom(0.8); event.stopPropagation() },

    /**
     * Get canvas scale
     */
    getCanvasScale(base=1) {
      return 1000 / this.zoom_size * base
    },

    /**
     * Get point in canvas by point in screen.
     */
    getCanvasPoint(x, y) {
      let scale = 1000 / this.zoom_size
      return {
        x: (this.top_corner[0] + x) * scale,
        y: (this.top_corner[1] + y) * scale,
      }
    },

    /**
     * Get point in screen by point in canvas.
     */
    getScreenPoint(x, y) {
      let scale = 1000 / this.zoom_size
      return {
        x: x / scale - this.top_corner[0],
        y: y / scale - this.top_corner[1],
      }
    },


    /**
     * Move canvas by drag
     */
    mouseDown(event) {
      this.mouse_drag_start.x = event.x
      this.mouse_drag_start.y = event.y
    },
    mouseMove(event) {
      if (this.mouse_drag_start.x != null) {
        let d_wrapper = document.getElementById("diagram_wrapper")
        let xd = this.mouse_drag_start.x - event.x
        let yd = this.mouse_drag_start.y - event.y
        d_wrapper.scrollBy(xd, yd)
        this.mouse_drag_start.x = event.x
        this.mouse_drag_start.y = event.y
      }
    },
    mouseUp(event) {
      this.mouse_drag_start.x = null
      this.mouse_drag_start.y = null
    }
  },

  mounted() {
    let d_wrapper = document.getElementById("diagram_wrapper")
    let rec = d_wrapper.getBoundingClientRect()
    console.log("Canvas size: " + rec.width +" x " + rec.height)
    this.zoom_size = Math.min(rec.width, rec.height)

    // Does not work, canvas inside scrollers not resized?
    // d_wrapper.addEventListener('resize', e => {

    d_wrapper.addEventListener('scroll', e => {
      this.top_corner[0] = d_wrapper.scrollLeft
      this.top_corner[1] = d_wrapper.scrollTop
      console.log("Scroll to " +d_wrapper.scrollTop + ", " + d_wrapper.scrollLeft)
    })
  }
}

</script>

<template>
  <svg viewBox="0 0 1000 1000" :width="zoom_size" :height="zoom_size" id="view_canvas"
       @click="clickBackground"
       @mousedown="mouseDown" @mousemove="mouseMove" @mouseup="mouseUp">

    <defs>
      <!-- white background for highlighted text -->
      <filter x="0" y="0" width="1" height="1" id="solid">
        <feFlood flood-color="#004080" result="bg" />
        <feMerge>
          <feMergeNode in="bg"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>


    <g class="net_components">

    <!-- Connectors -->
    <g v-for="c in listConnectors" :class="c.id">
      <g v-for="xy in c.lines"
         @click="clickConnector"
         v-on:mouseover="mouseOverEvent($event, c, true)"
         v-on:mouseleave="mouseOverEvent($event, c, false)">
        <line :x1="xy[0]" :y1="xy[1]" :x2="xy[2]" :y2="xy[3]" stroke="grey"
              :stroke-dasharray="c.kind === `Logical` ? `5,5`: `0`"
              :stroke-width="highlightIds.has(c.id) ? 7: 2"/>
        <svg :x="(xy[0]+xy[2]) / 2 - 25" :y="(xy[1]+xy[3]) / 2 - 25">
          <image width="50" height="50" :href="connectionHandle(c.kind)"/>
          <image :href="statusOverlay(c.status)" width="50" height="50"/>
        </svg>
      </g>
    </g>

    <!-- Hosts -->
    <g v-for="h in listHosts" :class="h.id"
       @click="clickHost"
       v-on:mouseover="mouseOverEvent($event, h, true)"
       v-on:mouseleave="mouseOverEvent($event, h, false)">
      <image v-if="h.image" v-bind="hostImageAttributes(h, h.image_scale)" :href="h.image"/>
      <g v-else>
        <circle v-bind="hostCircleAttributes(h, h.image_scale)"/>
        <image v-bind="hostImageAttributes(h, 0.5)" :href="connectionHandle(h.kind)"/>
      </g>
      <image :href="statusOverlay(h.status)"
             :x="h.x" :y="h.y - entity_width / 1.5" :width="entity_width / 1.5" :height="entity_width / 1.5"/>
    </g>
    <g v-for="h in listHosts" :class="h.id">
      <text v-if="!highlightIds.has(h.id)" :x="h.x" :y="h.y + entity_width / 2 * 1.2"  :font-size="font_size"
            stroke="grey" fill="grey" text-anchor="middle" dominant-baseline="hanging">{{h.name}}</text>
    </g>

    <!-- Highlighted text on top -->
    <g v-for="h in listHosts" :class="h.id">
      <g v-if="highlightIds.has(h.id)"
              @click="clickHost"
              v-on:mouseover="mouseOverEvent($event, h, true)"
              v-on:mouseleave="mouseOverEvent($event, h, false)">
        <text :x="h.x" :y="h.y + entity_width / 2 * 1.2"  :font-size="font_size" filter="url(#solid)"
              stroke="grey" fill="grey"   text-anchor="middle" dominant-baseline="hanging">{{h.name}}</text>
      </g>
    </g>

    </g>

    <g>
      <g class="zoomer" @click="zoomIn" fill="grey">
        <rect v-bind="getCanvasPoint(30, 35)" :width="getCanvasScale(40)" :height="getCanvasScale(10)"/>
        <rect v-bind="getCanvasPoint(45, 20)" :width="getCanvasScale(10)" :height="getCanvasScale(40)"/>
      </g>

      <rect class="zoomer" v-bind="getCanvasPoint(100, 35)"
            fill="grey" @click="zoomOut" :width="getCanvasScale(40)" :height="getCanvasScale(10)"/>

    </g>
  </svg>
</template>

<style>
  .net_components {
    cursor: pointer;
  }
  .zoomer {
    opacity: 0.2;
  }
  .zoomer:hover {
    cursor: pointer;
    opacity: 0.6;
  }
</style>
