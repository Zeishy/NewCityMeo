document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');

    // Function to fetch and display content
    async function fetchAndDisplayContent(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');

            if (contentType.includes('image')) {
                const img = document.createElement('img');
                img.src = url;
                contentDiv.appendChild(img);
            } else if (contentType.includes('video')) {
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                contentDiv.appendChild(video);
            } else if (contentType.includes('application/pdf')) {
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.width = '100%';
                iframe.height = '600px';
                contentDiv.appendChild(iframe);
            } else {
                contentDiv.textContent = 'Unsupported content type';
            }
        } catch (error) {
            console.error('Error fetching content:', error);
            contentDiv.textContent = `Error fetching content: ${error.message}`;
        }
    }

    // Example URL (replace with your actual URL)
    const url = 'https://example.com/path/to/your/content';
    fetchAndDisplayContent(url);
});