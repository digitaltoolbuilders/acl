
const ACL = require('../index');

const acl = new ACL();

module.exports.isAllowed = (role, action, resource, context, user) => {
  
  return acl.isAllowed(role, action, resource, context, user);
  
};

module.exports.NotAllowed = ACL.NotAllowed;
