
const expect = require('chai').expect;

const ACL = require('./index');
const NotAllowed = ACL.NotAllowed;

const sandbox = require('sinon').createSandbox();

describe('@digitaltoolbuilders/acl', () => {
  
  afterEach(() => {
    
    sandbox.verifyAndRestore();
    
  });
  
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
    
    describe('isAllowedList', () => {
      
      let expected, list;
      
      beforeEach(() => {
        
        expected = ['item1'];
        
        list = ['item1', 'item2'];
        
      });
      
      it('should resolve allowed items', () => {
        
        const stub = sandbox.mock(acl);
        
        stub
          .expects('isAllowed')
          .resolves(true);
          
        stub
          .expects('isAllowed')
          .rejects(new NotAllowed());
        
        return acl.isAllowedList(role, action, resource, user, list)
        .then((result) => {
          
          expect(result).to.deep.equal(expected);
          
        });
        
      });
      
    });
    
    it('should accept an array of actions', () => {
      
      const actions = [action, 'action-2'];
      
      acl.allow(role, actions, resource);
      
      return Promise.all([
        acl.isAllowed(role, action, resource, context, user),
        acl.isAllowed(role, 'action-2', resource, context, user)
      ]);
      
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
