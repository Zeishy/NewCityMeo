document.addEventListener('DOMContentLoaded', () => {
    const campaignList = document.getElementById('campaign-list');
    const campaignForm = document.getElementById('campaign-form');
    const contentForm = document.getElementById('content-form');
    const manageCampaignModal = document.getElementById('manage-campaign-modal');
    const closeModal = document.querySelector('.close');
    const uploadContentBtn = document.getElementById('upload-content-btn');
    const uploadContentInput = document.getElementById('upload-content-input');
    const urlInput = document.getElementById('urlInput');
    const uploadUrlBtn = document.getElementById('uploadUrlBtn');
    const sourceSelect = document.getElementById('source');
    let campaigns = []; // Declare campaigns array here

    // Fetch and display campaigns
    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/campaigns');
            campaigns = await response.json(); // Assign fetched campaigns to the array
            campaignList.innerHTML = '';
            campaigns.forEach((campaign, index) => {
                const li = document.createElement('li');
                li.className = campaign.isActive ? 'active' : '';
                li.innerHTML = `
                    <span>${campaign.name} (Start: ${new Date(campaign.startDate).toLocaleDateString()}, End: ${new Date(campaign.endDate).toLocaleDateString()}) - ${campaign.isActive ? 'Active' : 'Inactive'}</span>
                    <button onclick="activateCampaign(${index})">Activate</button>
                    <button onclick="manageCampaign(${index})">Manage</button>
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
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const today = new Date();
        console.log("today:", today);
        console.log("startday:", startDate);

        // Extract date parts
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Check if the start date and end date are valid
        if (startDateOnly < todayOnly) {
            alert('Start date cannot be in the past.');
            return;
        }

        if (endDate < startDate) {
            alert('End date must be after the start date.');
            return;
        }

        const formData = {
            name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };

        try {
            await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, startDate, endDate })
            });
            campaignForm.reset();
            fetchCampaigns();
        } catch (error) {
            console.error('Error adding campaign:', error);
        }
    });

    // Add content to campaign
    contentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contentForm);
        const campaignId = formData.get('campaign-id');
        const type = formData.get('type');
        const source = formData.get('source');
        const duration = formData.get('duration');
        try {
            await fetch(`/api/campaigns/${campaignId}/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, source, duration })
            });
            contentForm.reset();
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
            document.getElementById('campaign-id').value = id;
            await populateSourceDropdown();
            manageCampaignModal.style.display = 'block';
        } else {
            alert('Campaign not found');
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

    fetchCampaigns();
});