export const USERS = [
  {
    id: 'superadmin',
    username: 'admin',
    password: 'Admin2024!',
    role: 'superuser',
    displayName: 'Amministratore',
  },
  {
    id: 'aiaclient',
    username: 'aiaclient',
    password: 'AIAct2024!',
    role: 'cliente',
    displayName: 'AI Act Consulting',
    allowedClient: 'AI Act Consulting SRL',
  },
];

export function authenticate(username, password) {
  return USERS.find(u => u.username === username && u.password === password) || null;
}

export function canDeleteClient(user) {
  return user?.role === 'superuser';
}

export function canCreateClient(user) {
  return user?.role === 'superuser';
}

export function filterClientsForUser(clients, user) {
  if (!user || user.role === 'superuser') return clients;
  return clients.filter(c =>
    c.ragioneSociale?.toLowerCase() === user.allowedClient?.toLowerCase()
  );
}
