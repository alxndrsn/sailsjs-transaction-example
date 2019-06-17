const flaverr = require('flaverr');

const USER_ACCOUNT_ID = 1;
const RECIPIENT_ACCOUNT_ID = 2;

module.exports = {
  fn: async inputs => {

    await sails.getDatastore()
      .transaction(async db => {
        const myAccount = await BankAccount
            .findOne(USER_ACCOUNT_ID)
            .usingConnection(db);
        if (!myAccount)
          throw new Error('Consistency violation: Database is corrupted-- logged in user record has gone missing');

        const recipientAccount = await BankAccount
            .findOne(RECIPIENT_ACCOUNT_ID)
            .usingConnection(db);
        if (!recipientAccount)
          throw flaverr('E_NO_SUCH_RECIPIENT', new Error('There is no recipient with that id'));

        // Do the math to subtract from the logged-in user's account balance,
        // and add to the recipient's bank account balance.
        const myNewBalance = myAccount.balance - inputs.amount;

        // If this would put the logged-in user's account balance below zero,
        // then abort.  (The transaction will be rolled back automatically.)
        if (myNewBalance < 0)
          throw flaverr('E_INSUFFICIENT_FUNDS', new Error('Insufficient funds'));

        await BankAccount
            .update(myAccount.id)
            .set({ balance:myNewBalance })
            .usingConnection(db);

        await BankAccount
            .update(recipientAccount.id)
            .set({ balance:recipientAccount.balance + inputs.amount })
            .usingConnection(db);
      })
      .intercept('E_INSUFFICIENT_FUNDS', () => 'badRequest')
      .intercept('E_NO_SUCH_RECIPIENT',  () => 'notFound');
  },
};
