import { ACL, ALLOW, Rule, NotAllowed, Assertion } from './acl';

class User {

  user_id: string;

}

class Model {

  id: string;

}

describe('acl', () => {

  let action: string, 
    acl: ACL, context: any, 
    roles: Array<string>, 
    rule: Rule, 
    model: Model,
    user: User;
  
  describe('ACL', () => {
    
    beforeEach(() => {
      
      acl = new ACL<User>();
      
      roles = ['role'];
      
      action = 'action';

      user = new User();

      model = new Model();
      
    });
    
    it('should deny when no rules and exception isNotAllowed', () => {
      
      return acl.isAllowed<Model>(roles, action, user, model)
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
      
      acl.allow(roles[0], action);

      roles.push('does-not-exist');

      return acl.isAllowed<Model>(roles, action, user, model);
      
    });

    it('should allow when allow rule found', () => {

      acl.allow<Model>(roles[0], action);

      return acl.isAllowed<Model>(roles, action, user, model);

    });

    it('should deny when deny rule found, even when allow rule is found', () => {

      acl.allow<Model>(roles[0], action);

      acl.deny<Model>(roles[0], action);

      return acl.isAllowed<Model>(roles, action, user, model)
      .then(() => {

        throw new Error('allowed');

      })
      .catch((exception: NotAllowed | any) => {

        expect(exception.isNotAllowed).toBe(true);

      });

    });

  });
  
  describe('Rule', () => {
    
    beforeEach(() => {
      
    });
    
    it('should evaluated to true with no assertions', () => {
      
      rule = new Rule(ALLOW, [action]);
      
      return rule.evaluate(roles[0], action, user, context)
      .then((result: boolean) => {
        
        expect(result).toBe(true);
        
      });
      
    });
    
    it('should evaluated to false when assertion returns false', () => {
      
      const assert = new Assertion((role: string, context: any, user: any) => {

        return false;

      }, 'this should fail');

      rule = new Rule(ALLOW, [action], [assert]);
      
      return rule.evaluate(roles[0], action, user, context)
      .then((result: boolean) => {
        
        expect(result).toBe(false);
        
      })
      .catch((exception: any) => {

        expect(exception.isNotAllowed).toBe(true);

      });
      
    });
    
  });
  
});
