document.addEventListener('DOMContentLoaded', async () => {
    const campaignNameElement = document.getElementById('campaign-name');
    const contentContainer = document.getElementById('content-container');
    let currentContentIndex = 0;
    let contentItems = [];
    let carouselInterval;

    // Get device ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = window.DEVICE_ID;

    if (!deviceId) {
        campaignNameElement.textContent = 'No device ID provided';
        return;
    }

    // Fetch the assigned campaign for this device
    const fetchAssignedCampaign = async () => {
        try {
            console.log(`Fetching campaign for device ${deviceId} from ${window.BACKEND_IP}`);
            const response = await fetch(`http://${window.BACKEND_IP}:8080/api/devices/${deviceId}/campaign`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Campaign data:', data);
            if (data.message) {
                campaignNameElement.textContent = data.message;
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error fetching assigned campaign:', error);
            campaignNameElement.textContent = 'Error fetching campaign';
            return null;
        }
    };

    // Display single content item
    const displayContentItem = async (item) => {
        if (!item) return;
        
        contentContainer.innerHTML = '';
        let element;
    
        if (item.type === 'image') {
            element = document.createElement('img');
            // Use the backend IP for content server access
            element.src = `http://${window.BACKEND_IP}:8282/${item.source}`;
            contentContainer.appendChild(element);
            // Set timeout for next content after image loads
            element.onload = () => {
                if (carouselInterval) clearTimeout(carouselInterval);
                carouselInterval = setTimeout(showNextContent, item.duration * 1000);
            };
        } else if (item.type === 'video') {
            element = document.createElement('video');
            // Use the backend IP for content server access
            element.src = `http://${window.BACKEND_IP}:8282/${item.source}`;
            element.controls = true;
            element.autoplay = true;
            element.muted = true;
            element.playsInline = true;
            element.onended = showNextContent;
            contentContainer.appendChild(element);
            element.play().catch(e => console.error('Error playing video:', e));
        } else if (item.type === 'url') {
            element = document.createElement('iframe');
            element.src = item.source;
            element.width = '100%';
            element.height = '500px';
            element.style.border = 'none';
            contentContainer.appendChild(element);
            // Set timeout for next content
            if (carouselInterval) clearTimeout(carouselInterval);
            carouselInterval = setTimeout(showNextContent, item.duration * 1000);
        }
    };
    
    // Show next content
    const showNextContent = () => {
        if (!contentItems || contentItems.length === 0) return;
        currentContentIndex = (currentContentIndex + 1) % contentItems.length;
        displayContentItem(contentItems[currentContentIndex]);
    };

    // Update campaign content
    const updateCampaign = async () => {
        console.log('Updating campaign...');
        const campaign = await fetchAssignedCampaign();
        console.log('Fetched campaign:', campaign);
        
        if (campaign && campaign.contents?.length > 0) {
            console.log('Campaign has contents:', campaign.contents);
            contentItems = campaign.contents;
            currentContentIndex = 0;
            await displayContentItem(contentItems[currentContentIndex]);
        } else {
            console.log('No campaign or no contents');
            contentContainer.innerHTML = '';
            campaignNameElement.textContent = '';
            if (carouselInterval) {
                clearTimeout(carouselInterval);
            }
        }
    };
    
    // Set up WebSocket connection for real-time updates
    const connectWebSocket = () => {
        const socket = new WebSocket(`ws://${window.BACKEND_IP}:8080/ws`);
        
        socket.addEventListener('open', () => {
            console.log('WebSocket connected');
        });
    
        socket.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'deviceUpdate' && data.deviceId === parseInt(deviceId)) {
                await updateCampaign();
            } else if (data.type === 'campaignUpdate') {
                await updateCampaign();
            }
        });

        socket.addEventListener('close', () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(connectWebSocket, 5000);
        });
    
        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    };
    
    // Initial setup
    await updateCampaign();
    connectWebSocket();
});