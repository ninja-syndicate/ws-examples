import WebSocket from 'ws';

const host = "localhost:3333"

// 0..max
function rand(max) {
    return Math.floor(Math.random() * max) + 1
}

function dial(id) {
    let conn
    let name
    
    try {
        conn = new WebSocket(`ws://${host}/ws`)
    } catch (err) {
        console.error(err)
        setTimeout(() => {
            dial(id)
        }, 1000)
        return
    }
    let die = false;

    conn.on("close", () => {
        console.info(`WebSocket Disconnected`, id)

        if (die && id != 0) {
            console.info("self exit")
            return
        }

        console.info("Reconnecting in 1s")
        setTimeout(() => {
            dial(id)
        }, 1000)
    })

    conn.on("open", () => {
        console.info(`websocket connected`, id)
    })

    conn.on("message", raw => {
        let dat = {}
        try {
            dat = JSON.parse(raw)
        } catch (err) {
            console.error(err)
            return
        }

        let num
        if (dat.method === "publish" && dat.params && dat.params.text) {
            num = Number(dat.params.text)
        }

        if (!dat) {
            console.log(`blank_msg${id}:`, String(raw))

        } else if (!dat.params) {
            console.error(`missing_param${id}:`, String(raw))
        
        } else if (dat.method === "hello") {
            name = dat.params.name
            console.info(`me${id}: my name is ${name}`)

        } else if (dat.method === "publish" && dat.params.text && dat.params.author !== name) {
            // start message explosion, well 50% likelyhood
            if (!isNaN(num)) {
                if (num % 2 === 0) {
                    let msg = String(rand(1000000000))
                    conn.send(JSON.stringify({
                        id:     dat.id + 1,
                        method: "publish",
                        params: {
                            author: name,
                            text: msg,
                            time: Date.now(),
                        }
                    }))
                }
                if (num < 0) {
                    // spawn more
                    for (let i = 0; i < num * -1; i++) {
                        dial(imax + add)
                        add++
                    }
                    return
                }
            }

            // show 1/100 of msg
            // if (rand(100) === 0) {
            //     console.log(`msg${id}/${imax+add}:`, String(dat))
            // }
        } else {
            console.log(`unknown_state${id}:`, String(raw))
        }
    })

    // Error: connect ECONNREFUSED 127.0.0.1:8080
    //   at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1157:16) {
    //   errno: -4078,
    //   code: 'ECONNREFUSED',
    //   syscall: 'connect',
    //   address: '127.0.0.1',
    //   port: 8080
    // }
    conn.on("error", (ev) => {
        console.error(`err${id}`, ev)
        dial(id)
    })
}

const imax = 10
let add = 0
for (let i = 0; i < imax; i++) {
    dial(i)
}
