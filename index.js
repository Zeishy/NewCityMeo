document.addEventListener('DOMContentLoaded', () => {
    const campaignList = document.getElementById('campaign-list');
    const campaignForm = document.getElementById('campaign-form');
    const contentFormFile = document.getElementById('content-form-file');
    const contentFormUrl = document.getElementById('content-form-url');
    const manageCampaignModal = document.getElementById('manage-campaign-modal');
    const closeModal = document.querySelector('.close');
    const uploadContentBtn = document.getElementById('upload-content-btn');
    const uploadContentInput = document.getElementById('upload-content-input');
    const urlInput = document.getElementById('urlInput');
    const uploadUrlBtn = document.getElementById('uploadUrlBtn');
    const sourceSelect = document.getElementById('source');
    const toggleDatesBtn = document.getElementById('toggle-dates-btn');
    const datesContainer = document.getElementById('dates-container');
    const urlList = document.getElementById('url-list');
    const deviceList = document.getElementById('device-list');
    const deviceForm = document.getElementById('device-form');
    let campaigns = []; // Declare campaigns array here
    let devices = []; // Declare devices array here

    // Toggle dates visibility
    toggleDatesBtn.addEventListener('click', () => {
        const isHidden = datesContainer.style.display === 'none';
        datesContainer.style.display = isHidden ? 'block' : 'none';
        toggleDatesBtn.textContent = isHidden ? 'Remove Dates' : 'Add Dates';
    });

    // Fetch and display campaigns
    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/campaigns');
            campaigns = await response.json();
            campaignList.innerHTML = '';
            campaigns.forEach((campaign) => {
                const li = document.createElement('li');
                li.className = campaign.isActive ? 'active' : '';
                const dates = campaign.startDate && campaign.endDate ? 
                    `(${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})` : 
                    '(No dates set)';
                li.innerHTML = `
                    <span>${campaign.name} ${dates} - ${campaign.isActive ? 'Active' : 'Inactive'}</span>
                    <div class="campaign-buttons">
                        <button onclick="manageCampaign(${campaign.id})">Manage</button>
                        <button onclick="deleteCampaign(${campaign.id})" class="delete-btn">Delete</button>
                    </div>
                `;
                campaignList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    // Add new campaign
    campaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Only validate dates if they are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();

            if (start < today) {
                alert('Start date cannot be in the past.');
                return;
            }

            if (end < start) {
                alert('End date must be after the start date.');
                return;
            }
        }

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name,
                    startDate: startDate || null,
                    endDate: endDate || null
                })
            });
            campaignForm.reset();
            datesContainer.style.display = 'none';
            toggleDatesBtn.textContent = 'Add Dates';
            fetchCampaigns();
        } catch (error) {
            console.error('Error adding campaign:', error);
        }
    });

    const detectContentType = (source) => {
        try {
            const url = new URL(source);
            // Check for common video streaming platforms
            if (url.hostname.includes('youtube.com') || 
                url.hostname.includes('vimeo.com') ||
                url.hostname.includes('dailymotion.com')) {
                return 'url';
            }
            return 'url';
        } catch (e) {
            // If not a URL, check file extension
            const extension = source.toLowerCase().split('.').pop();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
            
            if (imageExtensions.includes(extension)) {
                return 'image';
            } else if (videoExtensions.includes(extension)) {
                return 'video';
            }
            return 'url'; // Default to URL if can't determine type
        }
    };
    
    // Modify the content form submit handler
    contentFormFile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const campaignId = parseInt(document.getElementById('campaign-id-file').value);
        const type = detectContentType(document.getElementById('source').value);
        const source = document.getElementById('source').value;
        const duration = parseInt(document.getElementById('duration-file').value);
        
        console.log('Adding content:', { campaignId, type, source, duration }); // Debug log
        
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, source, duration })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add content');
            }
            
            contentFormFile.reset();
            await fetchCampaigns();
            await manageCampaign(campaignId); // Refresh the campaign content display
            
        } catch (error) {
            console.error('Error adding content:', error);
            alert('Error adding content: ' + error.message);
        }
    });

    // Add content to campaign from URL
    contentFormUrl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const campaignId = document.getElementById('campaign-id-url').value;
        const type = 'url';
        const source = document.getElementById('url').value;
        const duration = document.getElementById('duration-url').value;
        try {
            await fetch(`/api/campaigns/${campaignId}/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, source, duration })
            });
            contentFormUrl.reset();
            fetchCampaigns();
            manageCampaignModal.style.display = 'none'; // Hide modal after adding content
        } catch (error) {
            console.error('Error adding content:', error);
        }
    });

    // Activate campaign
    window.activateCampaign = async (id) => {
        try {
            await fetch(`/api/campaigns/${id}/activate`, {
                method: 'POST'
            });
            fetchCampaigns();
        } catch (error) {
            console.error('Error activating campaign:', error);
        }
    };

    // Manage campaign
    window.manageCampaign = async (campaignId) => {
        try {
            // Convert campaignId to number since it's coming as a string from the HTML
            campaignId = parseInt(campaignId);
            
            // Find the campaign by its ID
            const campaign = campaigns.find(c => c.id === campaignId);
            
            if (!campaign) {
                console.log('Available campaigns:', campaigns);
                console.log('Looking for campaign with ID:', campaignId);
                alert('Campaign not found');
                return;
            }
    
            // Set form values
            document.getElementById('campaign-id-file').value = campaignId;
            document.getElementById('campaign-id-url').value = campaignId;
            
            // Display existing content
            const contentList = document.createElement('ul');
            contentList.className = 'content-list';
            
            if (campaign.contents && campaign.contents.length > 0) {
                campaign.contents.forEach((content, index) => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="content-item">
                            <span>${content.type}: ${content.source} (${content.duration}s)</span>
                            <button onclick="deleteContent(${campaignId}, ${index})" class="delete-btn">Delete</button>
                        </div>
                    `;
                    contentList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No content added yet';
                contentList.appendChild(li);
            }
            
            // Add content list to modal
            const modalContent = document.querySelector('.modal-content');
            const existingList = modalContent.querySelector('.content-list');
            if (existingList) {
                existingList.remove();
            }
            modalContent.insertBefore(contentList, document.getElementById('content-form-file'));
            
            // Populate source dropdown and show modal
            await populateSourceDropdown();
            manageCampaignModal.style.display = 'block';
        } catch (error) {
            console.error('Error managing campaign:', error);
            alert('Error managing campaign');
        }
    };
    
    // Add this CSS to your style.css file
    // Delete campaign function
    window.deleteCampaign = async (campaignId) => {
        try {
            // Find the campaign in the campaigns array
            const campaign = campaigns.find(c => c.id === campaignId);
            if (!campaign) {
                alert('Campaign not found');
                return;
            }
    
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE'
            });
    
            if (response.ok) {
                await fetchCampaigns(); // Refresh the campaigns list
            } else {
                throw new Error('Failed to delete campaign');
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Error deleting campaign');
        }
    };
    
    // Delete content function
    window.deleteContent = async (campaignId, contentIndex) => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/content/${contentIndex}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete content');
            }
            
            await fetchCampaigns();
            await manageCampaign(campaignId); // Refresh the campaign content display
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Error deleting content');
        }
    };

    // Populate source dropdown
    const populateSourceDropdown = async () => {
        try {
            const response = await fetch('http://localhost:8282');
            const files = await response.json();
            sourceSelect.innerHTML = '';
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                sourceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    // Handle file upload
    uploadContentBtn.addEventListener('click', () => {
        uploadContentInput.click();
    });

    uploadContentInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        try {
            await fetch('http://localhost:8282/upload', {
                method: 'POST',
                body: formData
            });
            alert('File uploaded successfully');
            await populateSourceDropdown(); // Refresh the source dropdown
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        }
    });

    uploadUrlBtn.addEventListener('click', async () => {
        const url = urlInput.value;
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        const blob = new Blob([url], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', blob, 'url.txt');

        try {
            await fetch('http://localhost:8282/upload', {
                method: 'POST',
                body: formData
            });
            alert('URL uploaded successfully');
            await populateSourceDropdown(); // Refresh the source dropdown
        } catch (error) {
            console.error('Error uploading URL:', error);
            alert('Error uploading URL');
        }
    });

    // Close modal
    closeModal.onclick = () => {
        manageCampaignModal.style.display = 'none';
    };

    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target == manageCampaignModal) {
            manageCampaignModal.style.display = 'none';
        }
    };

    // Function to fetch URLs from JSON file
    const fetchUrlsFromJson = async () => {
        try {
            const response = await fetch('http://localhost:8181/data/urls.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const urls = await response.json();
            return urls;
        } catch (error) {
            console.error('Error fetching URLs from JSON file:', error);
            return [];
        }
    };

    // Function to display URLs in the modal
    const displayUrls = async () => {
        const urls = await fetchUrlsFromJson();
        urlList.innerHTML = '';
        urls.forEach(url => {
            const listItem = document.createElement('li');
            listItem.textContent = `${url.value}`;
            urlList.appendChild(listItem);
        });
    };

    // Fetch and display devices
    const fetchDevices = async () => {
        try {
            const response = await fetch('/api/devices');
            devices = await response.json();
            deviceList.innerHTML = '';
            devices.forEach((device) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="device-info">
                        <span>${device.name} (ID: ${device.id})</span>
                        <div class="device-controls">
                            <select id="campaign-select-${device.id}" onchange="assignCampaign(${device.id}, this.value)">
                                <option value="">Select Campaign</option>
                                ${campaigns.map(campaign => `
                                    <option value="${campaign.id}" ${device.activeCampaignId === campaign.id ? 'selected' : ''}>
                                        ${campaign.name}
                                    </option>
                                `).join('')}
                            </select>
                            <button onclick="toggleDevice(${device.id})" class="${device.isActive ? 'active' : ''}">
                                ${device.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onclick="deleteDevice(${device.id})" class="delete-btn">Delete</button>
                        </div>
                    </div>
                `;
                deviceList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    };
    
    window.assignCampaign = async (deviceId, campaignId) => {
        try {
            const response = await fetch(`/api/devices/${deviceId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ campaignId: campaignId || null })
            });
            if (!response.ok) throw new Error('Failed to assign campaign');
            await fetchDevices();
        } catch (error) {
            console.error('Error assigning campaign:', error);
            alert('Error assigning campaign to device');
        }
    };
    // Add new device
    deviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('device-name').value;
        
        try {
            await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
            deviceForm.reset();
            fetchDevices();
        } catch (error) {
            console.error('Error adding device:', error);
        }
    });

    window.toggleDevice = async (deviceId) => {
        try {
            const response = await fetch(`/api/devices/${deviceId}/toggle`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to toggle device');
            await fetchDevices();
        } catch (error) {
            console.error('Error toggling device:', error);
            alert('Error toggling device');
        }
    };

    // Delete device function
    window.deleteDevice = async (deviceId) => {
        try {
            const response = await fetch(`/api/devices/${deviceId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete device');
            }
            await fetchDevices();
        } catch (error) {
            console.error('Error deleting device:', error);
            alert('Error deleting device');
        }
    };

    fetchCampaigns();
    fetchDevices();
});