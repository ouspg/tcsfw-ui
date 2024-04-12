export { SystemModel, Host, Service, Connector, Focus, statusChar, Evidence,
    VERDICT_FAIL, VERDICT_INCON, VERDICT_PASS, VERDICT_IGNORE, 
    UNDEFINED, EXPECTED_INCON, EXPECTED_PASS, EXPECTED_FAIL, UNEXPECTED_FAIL, EXTERNAL}

/**
 * Verdict constants
 */
const VERDICT_PASS = "Pass"
const VERDICT_FAIL = "Fail"
const VERDICT_INCON = "Incon"
const VERDICT_IGNORE = "Ignore"

/**
 * Status/verdict constants
 */
const UNDEFINED = "Undefined/Undefined"
const EXPECTED_INCON = "Expected/Incon"
const EXPECTED_PASS = "Expected/Pass"
const EXPECTED_FAIL = "Expected/Fail"
const UNEXPECTED_FAIL = "Unexpected/Fail"
const EXTERNAL = "External/Incon"

/**
 * System model
 */
class SystemModel {
    constructor() {
        this.name = "Unnamed system"
        this.components = []
        this.entities = new Map()     // hosts by ids
        this.connectors = new Map()   // connectors by ids
        this.connections = new Map()  // connections by id
        this.evidence = new Map()     // evidence by name
    }

    /**
     * Reset the model
     */
    reset() {
        // We want to keep the old instances, but remove some attributes
        this.components = []
        this.entities.forEach(e => e.reset())
        this.connectors.forEach(c => c.reset())
        this.connections.forEach(c => c.reset())
    }

    /**
     * Parse system from JSON data
     */
    parseSystem(js) {
        this.name = js.system_name
        if ("components" in js) {
            this.components = js.components
        }
    }

    /**
     * List visible hosts
     */
    listHosts() {
        let r = []
        for(const c of this.entities.values()) {
            if (c instanceof Host && c.x >= 0) {
                r.push(c)
            }
        }
        return r
    }

    /**
     * List visible connections
     */
    listConnectors() {
        let r = []
        for(const c of this.connectors.values()) {
            if (c.lines.length > 0) {
                r.push(c)
            }
        }
        return r
    }

    /**
     * Get and/or update host.
     */
    getHost(id, name, status) {
        let e = this.entities.get(id)
        if (!e) {
            e = new Host(id)
            this.entities.set(id, e)
        }
        e.name = name
        e.status = status
        // these must be placed by caller
        e.x = -1
        e.y = -1
        e.addresses = []
        return e
    }

    /**
     * Get and/or update service.
     */
    getService(host_id, id, name, status) {
        let host = this.entities.get(host_id)
        if (!host) {
            throw new Error("Host not found: " + host_id)
        }
        let s = this.entities.get(id)
        if (!s) {
            s = new Service(id)
            host.add_service(s)
            this.entities.set(id, s)
        }
        s.name = name
        s.status = status
        return s
    }

    /**
     * Get and/or update connector
     */
    getConnector(sourceHost, targetHost, status, kind) {
        let id = "conn-" + sourceHost.id + "-" + targetHost.id
        let e = this.connectors.get(id)
        if (!e) {
            e = new Connector(id, sourceHost, targetHost, status, kind)
            this.connectors.set(id, e)
        }
        // status or kind NOT updated, as must be merged carefully from connections
        return e
    }

    /**
     * Get and/or update connection
     */
    getConnection(id, source, target, status) {
        let e = this.connections.get(id)
        if (!e) {
            e = new Connection(id, source, target, status)
            this.connections.set(id, e)
        }
        e.source = source
        e.target = target
        e.status = status
        return e
    }

    /**
     * Get and/or update component
     */
    getComponent(id, name, status) {
        let e = this.entities.get(id)
        if (!e) {
            e = new EntityComponent(id, name, status)
            this.entities.set(id, e)
        }
        e.name = name
        e.status = status
        return e
    }

    /**
     * Parse and place component from JSON
     */
    parseComponent(js, root_component=false) {
        let c = this.getComponent(js.id, js.name, js.status)
        js.sub_components = EntityComponent.parseList(self, js.sub_components)
        if (js.properties) {
            c.properties = js.properties
        }
        let host = this.entities.get(js.node_id)
        if (host && root_component) {
            host.components.push(c)
        }
        return c
    }

    /**
     * Perform update for an entity
     */
    applyUpdate(id, update) {
        let e = this.entities.get(id) || this.connectors.get(id)
        if (e) {
            if (update.status) {
                e.status = update.status
            }
            if (update.properties) {
                // update properties
                for (const [key, value] of Object.entries(update.properties)) {
                    e.properties[key] = value
                }
            }
        }
    }
}

/**
 * Model host
 */
class Host {
    constructor(id) {
        this.id = id
        this.name = ""
        this.status = ""
        this.description = ""
        this.kind = ""
        this.x = -1
        this.y = -1
        this.addresses = []
        this.image = null
        this.image_scale = 1.0
        this.services = []      // Services
        this.components = []
        this.properties = new Object()
    }

    /**
     * Reset
     */
    reset() {
        this.status = UNDEFINED
        this.components = []
        this.addresses = []
        this.x = -1
        this.y = -1
        this.properties = new Object()
    }

    /**
     * List services
     */
    list_services(exclude_client_side=true) {
        let r = []
        this.services.forEach(s => {
            if (s.status === UNDEFINED) {
                return
            }
            if (!exclude_client_side || !s.client_side) {
                r.push(s)
            }
        })
        return r
    }

    /**
     * Add a new service
     */
    add_service(service) {
        this.services.push(service)
    }

    /**
     * Parse from JSON data
     */
    static parse(system, js) {
        let h = system.getHost(js.id, js.name, js.status)
        h.description = js.description
        h.kind = js.type
        if (js.xy) {
            h.x = js.xy[0]  // NOTE: Without this, host is not shown
            h.y = js.xy[1]
        }
        if (js.addresses) {
            h.addresses = js.addresses
        }
        if (js.image) {
            h.image = js.image[0]
            h.image_scale = js.image[1] / 100.0
        }
        return h
    }

}

/**
 * Model host service
 */
class Service {
    constructor(id) {
        this.id = id
        this.name = ""
        this.status = ""
        this.description = ""
        this.kind = ""
        this.client_side = false
        this.parent_host = null  // Host
        this.properties = new Object()
    }

    /**
     * Reset
     */
    reset() {
        this.status = UNDEFINED
        this.addresses = []
        this.properties = new Object()
    }

    /**
     * Parse from JSON data
     */
    static parse(system, js) {
        let s = system.getService(js.host_id, js.id, js.name, js.status)
        s.description = js.description
        s.kind = js.type
        if (js.client_side) {
            s.client_side = js.client_side
        }
        if (js.properties) {
            s.properties = js.properties
        }
        return s
    }

}

/**
 * Connector between hosts, may be many model connections
 */
class Connector {
    constructor(id, source, target, status, kind) {
        this.id = id
        this.source = source   // Host
        this.target = target   // Host
        this.kind = kind
        this.status = status
        this.connections = []  // Connections
        this.lines = []        // [x1, y1, x2, y2]
    }

    /**
     * Reset
     */
    reset() {
        this.status = UNDEFINED
        this.connections = []
        this.lines = []
    }

    /**
     * Parse from JSON data
     */
    static parse(system, js) {
        let s_ent = system.entities.get(js.source_id)
        let t_ent = system.entities.get(js.target_id)
        // Connection
        let conn = system.getConnection(js.id, s_ent, t_ent, js.status)
        conn.kind = js.type
        conn.source_name = js.source.join(" ")
        conn.target_name = js.target.join(" ")
        // Connector, containing 1..n connections
        let s_host = system.entities.get(js.source_host_id)
        let t_host = system.entities.get(js.target_host_id)
        let c = system.getConnector(s_host, t_host, conn.status, conn.kind)
        c.stack(conn)
        if (conn.connector === null) {
            // new connection (or reloaded)
            conn.connector = c
            c.connections.push(conn)
            system.connectors.set(conn.id, c)  // connectors also by ids of their connection
        }
        //connector line, at least one connection must have line to show the connector
        //Note: if all connections lose the line, we do not detect and connector remains visible
        let xy = js.xy_line
        if (xy && xy.length > 0) {
            c.lines = []
            for(let i = 1; i < xy.length; i++) {
                c.lines.push([xy[i -1][0], xy[i -1][1], xy[i][0], xy[i][1]])
            }
        }
        return c
    }

    /**
     * Stack connections
     */
    stack(connection) {
        let c = connection
        if (this.status === EXPECTED_INCON || this.status === UNDEFINED) {
            this.status = c.status
        } else if (this.status === EXPECTED_PASS && c.status === EXPECTED_FAIL) {
            this.status = c.status
        }


        if (this.kind === c.kind) {
            // we are fine
        } else if (this.kind === "Encrypted" && c.kind === "Encrypted") {
            this.kind = "Encrypted"
        } else {
            this.kind = "Admin"
        }
    }
}

class EntityComponent {
    constructor(id, name, status) {
        this.id = id
        this.name = name
        this.status = status
        this.properties = new Object()
        this.sub_components = []
    }

    /**
     * Reset
     */
    reset() {
        this.status = UNDEFINED
        this.properties = new Object()
    }


    /**
     * Parse list of components from JSON, if any
     */
    static parseList(system, jsList) {
        let r = []
        if (!jsList) {
            return r
        }
        jsList.forEach(js => {
            c = system.parseComponent(js)
            c.sub_components = EntityComponent.parseList(system, js.sub_components)
            if (js.properties) {
                c.properties = js.properties
            }
            r.push(c)
        })
        return r
    }
}

/**
 * Connection within connector
 */
class Connection {
    constructor(id, source, target, status) {
        this.id = id
        this.source = source  // Host or Service
        this.target = target  // Host or Service
        this.source_name = ""
        this.target_name = ""
        this.connector = null // Collector
        this.kind = ""
        this.status = status
    }

    /**
     * Reset
     */
    reset() {
        this.connector = null
        this.status = UNDEFINED
    }
}


/**
 * Focus, entity or connection
 */
class Focus {
    constructor() {
        this.host = null           // Host or null, OR...
        this.connector = null      // ...Connector or null
        this.showExternals = true  // Show external (or internal) details?
    }

    /**
     * Is there host or connector in focus?
     */
    isThere() {
        return this.host !== null || this.connector !== null
    }

    /**
     * Set focus host and return it.
     */
    setHost(host) {
        this.connector = null
        this.host = host
        return host
    }

    /**
     * Set focus connector and return it.
     */
    setConnector(connector) {
        this.host = null
        this.connector = connector
        return connector
    }

    /**
     * Get query parameters for this focus
     */
    queryParameters() {
        let r = ""
        if (this.host) {
            r += "&host=" + encodeURIComponent(this.host.name)
        }
        if (this.connector) {
          r += "&host=" + encodeURIComponent(this.connector.source.name) +
              "&host2=" + encodeURIComponent(this.connector.target.name)
        }
        if (r !== "") {
            r = "?" + r.substring(1)
        }
        if (!this.showExternals) {
            r += "&internal=" + !this.showExternals
        }
        return r
    }
}

/**
 * Get HTML unicode for status
 */
function statusChar(status, omit_no_info=false) {
    if (status === EXPECTED_INCON && omit_no_info) {
        return ""
    }
    if (status === EXPECTED_INCON) {
        return "&#128310;"
    }
    if (status === EXPECTED_PASS) {
        return "&#9989;"
    }
    return "&#128683;"
}

/**
 * Evidence
 */
class Evidence {
    constructor(label, name, selected=true) {
        this.label = label
        this.name = name
        this.selected = selected
        this.timestamp = ""
    }
}
