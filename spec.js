
const expect = require('chai').expect;

const ACL = require('./index');

describe('@digitaltoolbuilders/acl', () => {
  
  describe('ACL', () => {
    
    let acl, action, context, resource, role, user;
    
    beforeEach(() => {
      
      acl = new ACL();
      
      action = 'action';
      
      context = {};
      
      resource = 'resource';
      
      role = 'role';
      
      user = {};
      
    });
    
    it('should deny when no rules', () => {
      
      return acl.isAllowed(role, action, resource, context, user)
      .then(() => {
        
        throw new Error('allowed');
        
      })
      .catch(ACL.NotAllowed, () => {
        
        return true;
        
      });
      
    });
    
    it('should allow when rule with no assertions', () => {
      
      acl.allow(role, action, resource);
      
      return acl.isAllowed(role, action, resource, context, user);
      
    });
    
    it('should allow when rule with assertions', () => {
      
      acl.allow(role, action, resource, (role, context, user) => {
        
        return true;
        
      });
      
      return acl.isAllowed(role, action, resource, context, user);
      
    });
    
    it('should allow when rule with multiple assertions', () => {
      
      acl.allow(role, action, resource, [
        (role, context, user) => {
          
          return true;
          
        },
        (role, context, user) => {
          
          return true;
          
        },
        (role, context, user) => {
          
          return true;
          
        }
      ]);
      
      return acl.isAllowed(role, action, resource, context, user);
      
    });
    
    it('should deny when assertion fails', () => {
      
      acl.allow(role, action, resource, (role, context, user) => {
        
        throw new ACL.AssertionFailed();
        
      });
      
      return acl.isAllowed(role, action, resource, context, user)
      .then(() => {
        
        throw new Error('allowed');
        
      })
      .catch(ACL.NotAllowed, () => {
        
        return true;
        
      });
      
    });
    
    it('should deny with muliple assertions and an assertion fails', () => {
      
      acl.allow(role, action, resource, [
        (role, context, user) => {
          
          return true;
          
        },
        (role, context, user) => {
          
          return true;
          
        },
        (role, context, user) => {
          
          throw new ACL.AssertionFailed();
          
        },
        (role, context, user) => {
          
          return true;
          
        }
      ]);
      
      return acl.isAllowed(role, action, resource, context, user)
      .then(() => {
        
        throw new Error('allowed');
        
      })
      .catch(ACL.NotAllowed, () => {
        
        return true;
        
      });
      
    });
    
  });
  
  describe('acl', () => {
    
    const acl = require('./spec/acl');
    
    it('should not be able to call allow', () => {
      
      expect(acl.allow).to.equal(undefined);
      
    });
    
    it('should be able to call isAllowed', () => {
      
      expect(acl.isAllowed).to.be.a('function');
      
    });
    
  });
  
});
