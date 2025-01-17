// Vérifier si l'utilisateur est connecté
if (!localStorage.getItem('loggedIn')) {
    window.location.href = '/index.html';
}

// Ajouter un gestionnaire pour la déconnexion
function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = '/index.html';
}

// Vérifier périodiquement si l'utilisateur est toujours connecté
setInterval(() => {
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = '/index.html';
    }
}, 5000); 