const { ADMIN_ROLE, MANAGER_ROLE, VIEWER_ROLE } = require('./userRoles');

const PERMISSIONS = {
  [ADMIN_ROLE]: [
    'group:create', 'group:update', 'group:delete', 'group:view',
    'user:create', 'user:update', 'user:delete', 'user:view'
  ],
  [MANAGER_ROLE]: [
    'group:create', 'group:update', 'group:view',
    'user:create', 'user:update', 'user:view'
  ],
  [VIEWER_ROLE]: [
    'group:view',
    'group:update',
    'user:view'
  ]
};

module.exports = {
  PERMISSIONS
};
