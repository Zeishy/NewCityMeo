document.addEventListener('DOMContentLoaded', async () => {
    const campaignNameElement = document.getElementById('campaign-name');
    const contentContainer = document.getElementById('content-container');
    let currentContentIndex = 0;
    let contentItems = [];
    let carouselInterval;

    // Fetch the active campaign
    const fetchActiveCampaign = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/campaigns');
            const campaigns = await response.json();
            const activeCampaign = campaigns.find(campaign => campaign.isActive);
            return activeCampaign;
        } catch (error) {
            console.error('Error fetching active campaign:', error);
        }
    };

    function formatURL(source) {
        try {
            // Check if the source is a valid URL
            const url = new URL(source);
            return url.href;
        } catch (e) {
            // If not a valid URL, assume it's a relative path and prepend the base URL
            return `http://localhost:8282/${source}`;
        }
    }
    // Display single content item
    const displayContentItem = (item) => {
        contentContainer.innerHTML = '';
        let element;
        
        if (item.type === 'image') {
            element = document.createElement('img');
            element.src = `http://localhost:8282/${item.source}`;
        } else if (item.type === 'video') {
            element = document.createElement('video');
            element.src = `http://localhost:8282/${item.source}`;
            element.controls = true;
            element.autoplay = true;
            // Add event listener for video end
            element.onended = () => {
                showNextContent();
            };
        } else if (item.type === 'url') {
            element = document.createElement('iframe');
            element.src = formatURL(item.source); // Use the formatURL function
            element.width = '100%';
            element.height = '500px';
            element.style.border = 'none';
        }
        
        contentContainer.appendChild(element);

        // If it's not a video, set timeout for next content
        if (item.type !== 'video') {
            if (carouselInterval) clearTimeout(carouselInterval);
            carouselInterval = setTimeout(showNextContent, item.duration * 1000);
        }
    };

    // Show next content
    const showNextContent = () => {
        if (contentItems.length === 0) return;
        currentContentIndex = (currentContentIndex + 1) % contentItems.length;
        displayContentItem(contentItems[currentContentIndex]);
    };

    // Update active campaign and start carousel
    const updateActiveCampaign = async () => {
        const activeCampaign = await fetchActiveCampaign();
        if (activeCampaign && activeCampaign.contents.length > 0) {
            campaignNameElement.textContent = activeCampaign.name;
            contentItems = activeCampaign.contents;
            currentContentIndex = 0;
            displayContentItem(contentItems[currentContentIndex]);
        } else {
            campaignNameElement.textContent = 'No active campaign';
            contentContainer.innerHTML = '';
            if (carouselInterval) {
                clearTimeout(carouselInterval);
            }
        }
    };

    // Initial load
    await updateActiveCampaign();

    // Check for changes in active campaign every 5 seconds
    // setInterval(updateActiveCampaign, 5000);
});