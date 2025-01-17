document.addEventListener('DOMContentLoaded', () => {
    const setupForm = document.getElementById('setup-form');

    const waitForServer = async (port, maxAttempts = 20) => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                console.log(`Attempting to connect to server (${i + 1}/${maxAttempts})...`);
                const response = await fetch(`http://localhost:${port}/health`);
                if (response.ok) {
                    console.log('Server is ready!');
                    return true;
                }
            } catch (error) {
                console.log('Server not ready, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1 second
            }
        }
        return false;
    };

    setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const backendIp = document.getElementById('backend-ip').value;
        const deviceId = document.getElementById('device-id').value;
        const port = document.getElementById('port').value;

        try {
            // Save configuration locally
            const config = {
                id: deviceId,
                backendIp: backendIp,
                port: port,
                configured: true
            };
            
            console.log('Saving configuration:', config);
            const saveResponse = await fetch('/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                console.error('Failed to save configuration:', errorData);
                throw new Error('Failed to save configuration');
            }

            console.log('Configuration saved successfully. Restarting server...');
            // Restart the server with new configuration
            const restartResponse = await fetch('/restart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!restartResponse.ok) {
                const errorData = await restartResponse.json();
                console.error('Failed to restart server:', errorData);
                throw new Error('Failed to restart server');
            }

            // Wait longer before checking server
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('Waiting for server to be ready...');
            const isServerReady = await waitForServer(port);
            
            if (isServerReady) {
                window.location.href = `http://localhost:${port}/device/${deviceId}`;
            } else {
                alert('Server started but not responding. Please wait a moment and refresh the page.');
            }

        } catch (error) {
            console.error('Error configuring device:', error);
            alert('Error configuring device. Please try again.');
        }
    });
});