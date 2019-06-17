const sails = require('sails');

sails.lift({}, async err => {
  if(err) return console.error(`Failed to lift sails.`, err);

  console.log('Now make requests...');

  for(let i=0; i<10; ++i) {
    // attempt to create a race condition
    await Promise.all([
      asyncBalanceTransfer(300),
      asyncBalanceTransfer(700),
    ]);

    const delta = 1000 * i;
    await assertBalance(1, 10000 - delta);
    await assertBalance(2, delta);
  }
});

async function asyncBalanceTransfer(amount) {
}

async function assertBalance(accountId, expectedBalance) {
  const account = await BankAccount.find(accountId);
  if(account.balance !== expectedBalance)
    throw new Error(`Expected account ${accountId} to have balance of ${expectedBalance}, but actually found ${account.balance}`);
}
