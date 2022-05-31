
import * as Bluebird from 'bluebird';

export class ACL {
  
  debug = false;

  inheritance: {[key: string]: string} = {};
  
  rules: {
    [key: string]: {
      [key: string]: {
        [key: string]: Rule[]
      }
    }
  } = {};
  
  allow(role: string, action: string[] | string, resource: string, assert?: Assertion[] | Assertion) {
    
    if (!Array.isArray(action)) {
      
      action = [action];
      
    }
    
    let ruleAssert: Assertion[];
    
    if (assert && !Array.isArray(assert)) {
      
      ruleAssert = [assert] as Assertion[];
      
    } else {
      
      ruleAssert = assert as Assertion[];
      
    }
    
    const rule = new Rule(action, resource, ruleAssert);
    
    action.forEach((action: string) => {
      
      this.rules[role] = this.rules[role] || {};
      
      this.rules[role][resource] = this.rules[role][resource] || {};
      
      this.rules[role][resource][action] = this.rules[role][resource][action] || [];
      
      this.rules[role][resource][action].push(rule);
      
    });
    
  }
  
  getRulesForRole(role: string, resource: string, action: string) {
    
    if (
      this.rules[role]
      && this.rules[role][resource]
      && this.rules[role][resource][action]
    ) {
        
      return this.rules[role][resource][action];
      
    } else {
      
      return [];
      
    }
      
  }
  
  inherit(child: string, parent: string) {
    
    this.inheritance[child] = parent;
    
  }
  
  isAllowed<T>(roles: string | string[], action: string, resource: string, user: any, context: T): Promise<T> {
    
    if (!Array.isArray(roles)) {

      roles = [ roles ];

    }

    const notAllowed = new NotAllowed(`${JSON.stringify(roles)} is not allowed to ${action} on ${resource}`);
      
    const promises = roles.map((role: string) => {

      const notAllowed = new NotAllowed(`${role} is not allowed to ${action} on ${resource}`);
      
      return Bluebird.try(() => {
        
        let rules: Rule[] = [];
        
        rules = rules.concat(this.getRulesForRole(role, resource, action));
        
        if (this.inheritance[role]) {
          
          const parentRole = this.inheritance[role];
  
          const parentRules = this.getRulesForRole(parentRole, resource, action);
  
          rules = rules.concat(parentRules);
          
        }
  
        if (this.debug) {
        
          console.log('isAllowed','rules', rules);
       
        }
        
        if (rules.length === 0) {
          
          throw notAllowed;
          
        }
        
        const promises: Promise<any>[] = [];
        
        rules.forEach((rule: Rule) => {
          
          promises.push(rule.evaluate(role, user, context));
          
        });
        
        return Bluebird.any(promises);
        
      });
      
    });

    return Bluebird.any(promises)
    .then(() => {
      
      return context;
      
    })
    .catch(() => {
      
      throw notAllowed;
      
    });

  }
  
  isAllowedList<T>(role: string | string[], action: string, resource: string, user: any, list: Array<T>): Promise<Array<T>> {
    
    const allowed: T[] = [];
    
    let promise: Promise<any> = Promise.resolve(true);
    
    list.forEach((item: T) => {
      
      promise = promise.then(() => {
        
        return this.isAllowed<T>(role, action, resource, user, item)
        .then(() => {
          
          allowed.push(item);
          
          return true;
          
        })
        .catch(() => {
          
          return false;
          
        });
        
      });
      
    });
    
    return promise
    .then(() => {
      
      return allowed;
      
    });
    
  }
  
}

export type AssertionFunction = (role: string, user: any, context: any) => Promise<boolean> | boolean;

export class Assertion {

  constructor(private fn: AssertionFunction, public message?: string) { }

  assert(role: string, user: any, context: any) {

    return Bluebird.try(() => {

      return this.fn(role, user, context);

    })
    .then((isAllowed: boolean) => {

      if (!isAllowed) {

        throw new AssertionFailed(this.message);

      }

      return true;

    });

  }

}

export class AssertionFailed extends Error {
  
  isNotAllowed = true;

  constructor(m: string = 'An Assertion Failed') {
    
    super(m);
    
    Object.setPrototypeOf(this, AssertionFailed.prototype);
    
  }
  
}

export class NotAllowed extends Error {
  
  isNotAllowed = true;
  
  constructor(m: string = 'Not Allowed') {
    
    super(m);
    
    Object.setPrototypeOf(this, AssertionFailed.prototype);
    
  }
  
  get name() {
    
    return this.constructor.name;
    
  }

}

export class Rule {
  
  constructor(
    public action: string[], 
    public resource: string, 
    public assert?: Assertion[]
  ) { }
  
  evaluate(role: string, user: any, context: any, debug = false): Promise<any> {
    
    if (debug) {

      console.log('rule.evalute', role, user, context);

    }

    if (!this.assert || this.assert.length === 0) {
      
      return Promise.resolve(true);
      
    }
    
    const promises: Promise<any>[] = [];
    
    this.assert.forEach((assertion: Assertion) => {
      
      promises.push(assertion.assert(role, user, context));
      
    });
    
    return Promise.all(promises);
    
  }
  
}
