const flaverr = require('flaverr');

const USER_ACCOUNT_ID = 1;
const RECIPIENT_ACCOUNT_ID = 2;

module.exports = {

  inputs: {
    amount: { type:'number', required:true }, // NB not an integer
  },

  fn: async function({ amount }) {
    const requestId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    await sails.getDatastore()
      .transaction(async db => {
        const myAccount = await BankAccount
            .findOne(USER_ACCOUNT_ID)
            .usingConnection(db);
        if (!myAccount)
          throw new Error('Consistency violation: Database is corrupted-- logged in user record has gone missing');

        await randomSleep();

        const recipientAccount = await BankAccount
            .findOne(RECIPIENT_ACCOUNT_ID)
            .usingConnection(db);
        if (!recipientAccount)
          throw flaverr('E_NO_SUCH_RECIPIENT', new Error('There is no recipient with that id'));

        if(false) console.log(`[update-balance ${requestId}] transfer amount=${amount}; should update:
            ${USER_ACCOUNT_ID} from ${myAccount.balance} to ${myAccount.balance-amount}
            ${RECIPIENT_ACCOUNT_ID} from ${recipientAccount.balance} to ${recipientAccount.balance+amount}`);

        // Do the math to subtract from the logged-in user's account balance,
        // and add to the recipient's bank account balance.
        const myNewBalance = myAccount.balance - amount;

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
            .set({ balance:recipientAccount.balance + amount })
            .usingConnection(db);

        // finally, create a receipt to show that we successfully processed
        // this transfer request.
        await Receipt
            .create({ amount })
            .usingConnection(db);
      })
      .intercept('E_INSUFFICIENT_FUNDS', () => 'badRequest')
      .intercept('E_NO_SUCH_RECIPIENT',  () => 'notFound');
  },
};

async function randomSleep() {
  const duration = Math.round(Math.random() * 100);
  return new Promise(resolve => setTimeout(resolve, duration));
}
