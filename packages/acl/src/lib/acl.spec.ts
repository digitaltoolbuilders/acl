import { ACL, Rule, NotAllowed, Assertion } from './acl';

describe('acl', () => {

  let action: string, acl: ACL, context: any, resource: string, role: string, rule: Rule, user: any;
  
  describe('ACL', () => {
    
    beforeEach(() => {
      
      acl = new ACL();
      
      role = 'role';
      
      resource = 'resource';
      
      action = 'action';
      
    });
    
    it('should deny when no rules and exception isNotAllowed', () => {
      
      return acl.isAllowed(role, action, resource, context, user)
      .then(() => {
        
        throw new Error('allowed');
        
      })
      .catch((exception: any) => {
        
        if (exception.isNotAllowed) {
          
          return true;
          
        }
        
        throw exception;
        
      });
      
    });

    it('should accept an array of roles to check', () => {
      
      acl.allow(role, action, resource);

      return acl.isAllowed([role, 'does-not-exist'], action, resource, context, user);
      
    });

  });
  
  describe('Rule', () => {
    
    beforeEach(() => {
      
    });
    
    it('should evaluated to true with no assertions', () => {
      
      rule = new Rule([action], resource);
      
      return rule.evaluate(role, context, user)
      .then((result: boolean) => {
        
        expect(result).toBe(true);
        
      });
      
    });
    
    it('should evaluated to false when assertion returns false', () => {
      
      const assert = new Assertion((role: string, context: any, user: any) => {

        return false;

      }, 'this should fail');

      rule = new Rule([action], resource, [assert]);
      
      return rule.evaluate(role, context, user)
      .then((result: boolean) => {
        
        expect(result).toBe(false);
        
      })
      .catch((exception: any) => {

        expect(exception.isNotAllowed).toBe(true);

      });
      
    });
    
  });
  
});
