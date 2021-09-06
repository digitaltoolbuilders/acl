
const logger = require('@incdevco/lambda/logger');
const Promise = require('bluebird');

class ACL {
  
  rules = {};
  
  allow(role, action, resource, assert) {
    
    const rule = new Rule(role, action, resource, assert);
    
    this.rules[role] = this.rules[role] || [];
    
    this.rules[role][resource] = this.rules[role][resource] || [];
    
    this.rules[role][resource][action] = this.rules[role][resource][action] || [];
    
    this.rules[role][resource][action].push(rule);
    
  }
  
  isAllowed(role, action, resource, context, user) {
    
    return Promise.try(() => {
      
      let rules = [];
      
      if (this.rules[role] 
        && this.rules[role][resource]
        && this.rules[role][resource][action]) {
        
        rules = this.rules[role][resource][action];
        
      }
      
      if (rules.length === 0) {
        
        throw new NotAllowed();
        
      }
      
      let isAllowed = false;
      
      let promise = Promise.resolve(true);
      
      rules.forEach((rule) => {
        
        promise = promise.then(() => {
          
          return rule.evaluate(role, context, user)
          .then(() => {
            
            isAllowed = true;
            
            return true;
            
          })
          .catch(AssertionFailed, (exception) => {
            
            logger.debug('assertion-failed', exception);
            
            return false;
            
          });
          
        });
        
      });
      
      return promise
      .then(() => {
        
        if (isAllowed) {
          
          return true;
          
        } else {
          
          throw new NotAllowed();
          
        }
        
      });
      
    });
    
  }
  
}

class AssertionFailed extends Error {
  
  constructor(message) { 
   
    super(message);
    
  }
  
  get name() {
    
    return this.constructor.name;
    
  }
  
}

class NotAllowed extends Error {
  
  constructor(message) { 
   
    super(message);
    
  }
  
  get name() {
    
    return this.constructor.name;
    
  }
  
}

class Rule {
  
  constructor(role, action, resource, assert) {
    
    this.action = action;
    this.assert = assert;
    this.resource = resource;
    this.role = role;
    
    if (this.assert && !Array.isArray(assert)) {
      
      this.assert = [this.assert];
      
    }
    
  }
  
  evaluate(role, context, user) {
    
    return Promise.try(() => {
      
      logger.debug('rule.evaluate', this.role, this.resource, this.action);
      
      if (this.assert) {
        
        const promises = [];
        
        this.assert.forEach((assertion) => {
          
          promises.push(assertion(role, context, user));
          
        });
        
        return Promise.all(promises)
        .then(() => {
          
          return true;
          
        });
        
      }
      
      return true;
      
    });
    
  }
  
}

module.exports = ACL;

module.exports.Rule = Rule;

module.exports.AssertionFailed = AssertionFailed;
module.exports.NotAllowed = NotAllowed;
