
import * as Bluebird from 'bluebird';

export const ALLOW = 'allow';
export const DENY = 'deny';

export class ACL<User=any> {

  inheritance: { [key: string]: string } = {};

  rules: RuleMap = {};

  allow<Context=any>(role: string, actions: string | Array<string>, assert?: Assertion<User,Context> | Array<Assertion<User,Context>>) {

    if (!Array.isArray(actions)) {

      actions = [actions];

    }

    if (assert && !Array.isArray(assert)) {

      assert = [assert];

    } else {

      assert = [];

    }

    const rule = new Rule<User, Context>(ALLOW, actions, assert);

    actions.forEach((action: string) => {

      this.rules[role] = this.rules[role] || {};

      this.rules[role][action] = this.rules[role][action] || [];

      this.rules[role][action].push(rule);

    });

  }

  deny<Context=any>(role: string, actions: string | Array<string>, assert?: Assertion<User,Context> | Array<Assertion<User,Context>>) {

    if (!Array.isArray(actions)) {

      actions = [actions];

    }

    if (assert && !Array.isArray(assert)) {

      assert = [assert];

    } else {

      assert = [];

    }

    const rule = new Rule<User, Context>(DENY, actions, assert);

    actions.forEach((action: string) => {

      this.rules[role] = this.rules[role] || {};

      this.rules[role][action] = this.rules[role][action] || [];

      this.rules[role][action].push(rule);

    });

  }

  getRules(role: string, action: string) {

    let rules: Array<Rule<User,any>> = [];

    if (this.rules[role]) {

      rules = rules.concat(this.rules[role][action] || []);

    }

    if (this.inheritance[role]) {

      rules = rules.concat(this.getRules(this.inheritance[role], action));

    }

    return rules;

  }

  hasAllow(rules: Array<Rule<User,any>>) {

    let has = false;

    rules.forEach((rule: Rule<User,any>) => {

      if (rule.type === ALLOW) {

        has = true;

      }

    });

    return has;

  }

  hasDeny(rules: Array<Rule<User,any>>) {

    let has = false;

    rules.forEach((rule: Rule<User,any>) => {

      if (rule.type === DENY) {

        has = true;

      }

    });

    return has;

  }

  inherit(child: string, parent: string) {

    this.inheritance[child] = parent;

  }

  isAllowed<Context>(roles: Array<string>, action: string, user: User, context: Context): Promise<Context> {

    // evalute all rules for each role
    
    // matching rules will return true

    const matches: Array<Rule<User,Context>> = [];

    const promises: Array<Promise<any>> = [];

    roles.forEach((role: string) => {

      const rules = this.getRules(role, action);

      const promise = Promise.all(rules.map((rule: Rule<User,Context>) => {

        return rule.evaluate(role, action, user, context)
        .then((match: boolean) => {

          if (match) {

            matches.push(rule);

          }

          return match;

        });

      }));

      promises.push(promise);

    });

    return Promise.all(promises)
    .then(() => {

      if (this.hasAllow(matches) && !this.hasDeny(matches)) {

        return context;

      } else {

        throw new NotAllowed(`Not Allowed to ${action} with ${JSON.stringify(roles)}`);

      }

    });

  }

  listAllowed<Context>(roles: Array<string>, action: string, user: User, context: Array<Context>): Promise<Array<Context>> {

    const allowed: Array<Context> = [];

    const promises: Array<Promise<any>> = [];

    context.forEach((item: Context) => {

      promises.push(this.isAllowed(roles, action, user, item)
      .then((item: Context) => {

        allowed.push(item);

      })
      .catch((exception: NotAllowed | any) => {

        if (exception.isNotAllowed) {

          return false;

        } else {

          throw exception;

        }

      }));

    });

    return Promise.all(promises)
    .then(() => {

      return allowed;

    });

  }

}

export type AssertFunction<User,Context> = (role: string, action: string, user: User, context: Context) => boolean | Promise<boolean>; 

export class Assertion<User,Context> {

  constructor(private fn: AssertFunction<User,Context>, private message: string) { }

  assert(role: string, action: string, user: User, context: Context) {

    return Bluebird.try(() => {

      return this.fn(role, action, user, context);

    });

  }

}

export class NotAllowed extends Error {

  isNotAllowed = true;

  constructor(m: string) {

    super(m);

    Object.setPrototypeOf(this, NotAllowed.prototype);

  }

  get name() {

    return this.constructor.name;

  }

}

export class Rule<User=any,Context=any> {

  private assert: Array<Assertion<User,Context>> = [];

  constructor(public type: string, private actions: Array<string>, assert?: Assertion<User,Context> | Array<Assertion<User,Context>>) { 

    if (assert) {

      if(!Array.isArray(assert)) {

        assert = [assert];

      }

      this.assert = assert;

    }

  }

  evaluate(role: string, action: string, user: User, context: Context) {

    const promises: Array<Promise<boolean>> = this.assert.map((assertion: Assertion<User,Context>) => {

      return assertion.assert(role, action, user, context);

    });

    return Promise.all(promises)
    .then((results: Array<boolean>) => {

      if (results.includes(false)) {

        return false;

      } else {

        return true;

      }

    });

  }

}

export interface RuleMap {

  [key: string]: {
    [key: string]: Array<Rule<any,any>>
  };

}
