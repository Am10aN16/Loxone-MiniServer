const express = require('express');
const WebSocket = require('ws');
const path = require("path");
const os = require('os');

if (typeof LxCommunicator === 'undefined') {
    global.LxCommunicator = require('lxcommunicator');
}

const app = express();
const port = 3001;

let isLightOn = false;

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
        const command = message.toString();
        console.log('Received message from client:', command);
        if (command === 'toggleLight') {
            try {
                const status = await toggleLight();
                ws.send(JSON.stringify({ lightStatus: status }));
            } catch (error) {
                console.error('Error while toggling light:', error);
                ws.send(JSON.stringify({ error: 'Failed to toggle light' }));
            }
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`WebSocket connection closed: ${code} ${reason}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send initial light status
    ws.send(JSON.stringify({ lightStatus: isLightOn }));
});

// Function to toggle the light
async function toggleLight() {
    const uuidOfLightControl = '1b394017-00e9-71fe-ffffcb0481ff57c7';
    const command = isLightOn ? 'Off' : 'On';

    try {
        await sendCommand(uuidOfLightControl, command);
        isLightOn = !isLightOn;
    } catch (error) {
        console.error('Failed to toggle light:', error);
        throw error; 
    }

    return isLightOn;
}

// Function to send commands to the Loxone Miniserver using LxCommunicator
async function sendCommand(uuid, command) {

    const deviceInfo = os.hostname();

    const WebSocketConfig = LxCommunicator.WebSocketConfig;
    const config = new WebSocketConfig(WebSocketConfig.protocol.WS, uuid, deviceInfo, WebSocketConfig.permission.APP, false);

    config.delegate = {
        socketOnDataProgress: function (socket, progress) {
            console.log(progress);
        },
        socketOnTokenConfirmed: function (socket, response) {
            console.log(response);
        },
        socketOnTokenReceived: function (socket, result) {
            console.log(result);
        },
        socketOnTokenRefresh: function (socket, newTkObj) {
            console.log(newTkObj);
        },
        socketOnConnectionClosed: function (socket, code) {
            console.log(code);
        },
        socketOnEventReceived: function (socket, events, type) {
            if (type === 2) {
                events.forEach(function (event) {
                    console.log(event.uuid + " -> " + event.value);
                });
            }
        }
    };

    const socket = new LxCommunicator.WebSocket(config);

    try {
        await socket.open("dns.loxonecloud.com/504F94D04BEF", "admin", "Modo@2023");

        const response = await socket.send(`jdev/sps/io/${uuid}/${command}`);

        if (response.LL && response.LL.Code === '200') {
            console.log('Command sent successfully');
        } else {
            throw new Error('Command failed with response code: ' + (response.LL ? response.LL.Code : 'unknown'));
        }
    } catch (error) {
        console.error(`Failed to send command: ${error}`);
        throw error; 
    } finally {
        await socket.close();
    }
}
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname1, '/client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname1, 'client', 'build', 'index.html'))
    })
} else {
    app.get('/', (req, res) => {
        res.send("Hello from the server")
    })
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
