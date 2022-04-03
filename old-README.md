# @digitaltoolbuilders/acl

`npm install @digitaltoolbuilders/acl`

Create the acl and export an isAllowed function and NotAllowed error class.

`touch acl.js`

```javascript

const ACL = require('@digitaltoolbuilders/acl');

const acl = new ACL();

acl.allow('manager', 'close', 'account');

acl.allow('client', 'close', 'account', (role, context, user) => {
  
  if (context.owner_user_id === user.user_id) {
    
    return true;
    
  } else {
    
    return false;
    
  }
  
});

module.exports.isAllowed = (role, action, resource, context, user) => {
  
  return acl.isAllowed(role, action, resource, context, user);
  
};

module.exports.NotAllowed = ACL.NotAllowed;

```

Use the acl in your code.


```javascript

const acl = require('./acl.js');

acl.isAllowed('manager', 'close', 'account')
.then(() => {
  
  // user is allowed
  
})
.catch(acl.NotAllowed, () => {
  
  // user is not allowed
  
});


```


```javascript

const acl = require('./acl.js');

const context = {
  account_id: '123456',
  owner_user_id: '123456'
};

const user = {
  user_id: '654321'
};

acl.isAllowed('cashier', 'close', 'account', context, user)
.catch(acl.NotAllowed, () => {
  
  // user is not allowed
  
});


```


```javascript

const acl = require('./acl.js');

const context = {
  account_id: '123456',
  owner_user_id: '123456'
};

const user = {
  user_id: '123456'
};

acl.isAllowed('client', 'close', 'account', context, user)
.then(() => {
  
  // user is allowed
  
});


```