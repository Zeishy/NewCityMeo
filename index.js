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
    let campaigns = []; // Declare campaigns array here

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
            campaigns = await response.json(); // Assign fetched campaigns to the array
            campaignList.innerHTML = '';
            campaigns.forEach((campaign, index) => {
                const li = document.createElement('li');
                li.className = campaign.isActive ? 'active' : '';
                const dates = campaign.startDate && campaign.endDate ? 
                    `(${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})` : 
                    '(No dates set)';
                li.innerHTML = `
                    <span>${campaign.name} ${dates} - ${campaign.isActive ? 'Active' : 'Inactive'}</span>
                    <div class="campaign-buttons">
                        <button onclick="activateCampaign(${index})">Activate</button>
                        <button onclick="manageCampaign(${index})">Manage</button>
                        <button onclick="deleteCampaign(${index})" class="delete-btn">Delete</button>
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
        const campaignId = document.getElementById('campaign-id-file').value;
        const type = detectContentType(document.getElementById('source').value);
        const source = document.getElementById('source').value;
        const duration = document.getElementById('duration-file').value;
        try {
            await fetch(`/api/campaigns/${campaignId}/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, source, duration })
            });
            contentFormFile.reset();
            fetchCampaigns();
            manageCampaignModal.style.display = 'none'; // Hide modal after adding content
        } catch (error) {
            console.error('Error adding content:', error);
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
    window.manageCampaign = async (id) => {
        const campaign = campaigns[id];
        if (campaign) {
            document.getElementById('campaign-id-file').value = id;
            document.getElementById('campaign-id-url').value = id;
            // Display existing content
            const contentList = document.createElement('ul');
            contentList.className = 'content-list';
            campaign.contents.forEach((content, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${content.type}: ${content.source} (${content.duration}s)</span>
                    <button onclick="deleteContent(${id}, ${index})" class="delete-btn">Delete</button>
                `;
                contentList.appendChild(li);
            });
            
            // Add content list to modal
            const modalContent = document.querySelector('.modal-content');
            const existingList = modalContent.querySelector('.content-list');
            if (existingList) {
                existingList.remove();
            }
            modalContent.insertBefore(contentList, document.getElementById('content-form'));
            
            await populateSourceDropdown();
            await displayUrls(); // Display URLs in the modal
            manageCampaignModal.style.display = 'block';
        } else {
            alert('Campaign not found');
        }
    };
    
        // Delete campaign function
    window.deleteCampaign = async (id) => {
        try {
            const response = await fetch(`/api/campaigns/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await fetchCampaigns();
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
            
            if (response.ok) {
                await fetchCampaigns();
                await manageCampaign(campaignId); // Refresh the manage campaign modal
            } else {
                throw new Error('Failed to delete content');
            }
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

    fetchCampaigns();
});