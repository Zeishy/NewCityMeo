// User.js
class User {
  constructor(username, password, role) {
    this.username = username;
    this.password = password; // In a real application, ensure to hash passwords
    this.role = role; // 'admin' or 'campaign_creator'
  }
}

module.exports = User;