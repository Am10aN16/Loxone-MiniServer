import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Dashboard = () => {
    const [lightStatus, setLightStatus] = useState(false);
    const [ws, setWs] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        // Create WebSocket connection
        const socket = new WebSocket('ws://localhost:5000');
        setWs(socket);

        // Connection opened
        socket.onopen = () => {
            console.log('WebSocket connection opened');
            setIsConnecting(false);
        };

        // Listen for messages
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.lightStatus !== undefined) {
                setLightStatus(data.lightStatus);
            }
            console.log(data);
        };

        // Connection closed
        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event.reason);
            setIsConnecting(true); // Optionally try to reconnect
        };

        // Error occurred
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnecting(true); // Optionally handle error state
        };

        // Clean up on component unmount
        return () => {
            socket.close();
            console.log('WebSocket connection closed during cleanup');
        };
    }, []);

    const toggleLight = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('toggleLight');
        } else {
            console.warn('WebSocket is not connected');
        }
    };

    return (
        <Container>
            <Title>Loxone Dashboard</Title>
            <Status>Light is {lightStatus ? 'On' : 'Off'}</Status>
            <ToggleButton onClick={toggleLight} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Toggle Light'}
            </ToggleButton>
        </Container>
    );
};

export default Dashboard;

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f5f5f5;
`;

const Title = styled.h1`
    font-size: 2.5em;
    color: #333;
    margin-bottom: 20px;
`;

const Status = styled.p`
    font-size: 1.5em;
    color: ${props => (props.lightStatus ? '#4caf50' : '#f44336')};
    margin-bottom: 20px;
`;

const ToggleButton = styled.button`
    padding: 10px 20px;
    font-size: 1em;
    color: white;
    background-color: ${props => (props.disabled ? '#ccc' : '#007bff')};
    border: none;
    border-radius: 5px;
    cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
    transition: background-color 0.3s;

    &:hover {
        background-color: ${props => (props.disabled ? '#ccc' : '#0056b3')};
    }
`;
