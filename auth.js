// auth.js
// Vérifier si l'utilisateur est déjà connecté
if (localStorage.getItem('loggedIn') === 'true') {
    window.location.href = '/dashboard.html';
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            localStorage.setItem('loggedIn', 'true');
            window.location.href = '/dashboard.html';
        } else {
            alert('Identifiants invalides');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur lors de la connexion');
    }
});
