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
        this.entities.forEach(e => e.reset())
        this.connectors.forEach(c => c.reset())
        this.connections.forEach(c => c.reset())
    }

    /**
     * Parse system from JSON data
     */
    parseSystem(js) {
        this.name = js["system_name"]
        if ("components" in js) {
            this.components = js["components"]
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
    getService(id, name, status) {
        let e = this.entities.get(id)
        if (!e) {
            e = new Service(id)
            this.entities.set(id, e)
        }
        e.name = name
        e.status = status
        return e
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
        this.addresses = []
        this.x = -1
        this.y = -1
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
     * Parse from JSON data
     */
    static parse(system, js) {
        let h = system.getHost(js["id"], js["name"], js["status"])
        h.description = js["description"]
        h.kind = js["type"]
        if ("xy" in js) {
            h.x = js["xy"][0]  // NOTE: Without this, host is not shown
            h.y = js["xy"][1]
        }
        if ("addresses" in js) {
            h.addresses = js["addresses"]
        }
        if ("image" in js) {
            h.image = js["image"][0]
            h.image_scale = js["image"][1] / 100.0
        }
        if ("services" in js) {
            h.services = []
            js["services"].forEach(jss => {
                let s = Service.parse(system, jss)
                s.parent_host = h
                h.services.push(s)
            })
        }
        if ("components" in js) {
            h.components = js["components"]
        }
        if ("properties" in js) {
            h.properties = js["properties"]
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
        this.properties = new Map()
    }

    /**
     * Reset
     */
    reset() {
        this.status = UNDEFINED
        this.addresses = []
        this.properties = new Map()
    }

    /**
     * Parse from JSON data
     */
    static parse(system, js) {
        let s = system.getService(js["id"], js["name"], js["status"])
        s.description = js["description"]
        s.kind = js["type"]
        if ("client_side" in js) {
            s.client_side = js["client_side"]
        }
        if ("properties" in js) {
            s.properties = new Map(Object.entries(js["properties"]))
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
        let s_ent = system.entities.get(js["source_id"])
        let t_ent = system.entities.get(js["target_id"])
        // Connection
        let conn = system.getConnection(js["id"], s_ent, t_ent, js["status"])
        conn.kind = js["type"]
        conn.source_name = js["source"].join(" ")
        conn.target_name = js["target"].join(" ")
        // Connector, containing 1..n connections
        let s_host = system.entities.get(js["source_host_id"])
        let t_host = system.entities.get(js["target_host_id"])
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
        let xy = js["xy_line"]
        if (xy && xy.length > 0) {
            c.lines = []
            for(let i = 1; i < xy.length; i++) {
                c.lines.push([xy[i -1][0], xy[i -1][1], xy[i][0], xy[i][1]])
            }
        }
        return c
    }

    /**
     * Parse flow from JSON data
     */
    static parseFlow(system, js) {
        // Connection
        let conn = system.connections.get(js["conn_id"])
        let fl = new Flow(js["dir"], js["ends"])
        fl.reference = js["ref"]
        conn.flows.push(fl)
        return conn
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
        this.flows = []       // Flows
    }

    /**
     * Reset
     */
    reset() {
        this.connector = null
        this.status = UNDEFINED
        this.flows = []
    }
}

/**
 * A flow in a connection
 */
class Flow {
    constructor(dir, ends) {
        this.dir = dir        // "up" or "down"
        this.ends = ends      // 2 x address strings
        this.reference = ""
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