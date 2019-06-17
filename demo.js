const sails = require('sails');
const { spawn } = require('child_process');

const INITIAL_VALUE = 10000;
const REQUEST_COUNT = 20;

sails.lift({}, async err => {
  if(err) return console.error(`Failed to lift sails.`, err);

  try {
    console.log('Making requests...');

    for(let i=1; i<=INITIAL_VALUE/REQUEST_COUNT; ++i) {
      // attempt to create a race condition
      await Promise.all([
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
        asyncBalanceTransfer(1),
      ]);

      const delta = REQUEST_COUNT * i;
      await assertBalances(INITIAL_VALUE - delta, delta);
    }
  } catch(e) {
    console.error(e);
    process.exit(1);
  }

  console.log('Everything went ok :~)');
  const account1 = await BankAccount.findOne(1);
  const account2 = await BankAccount.findOne(2);
  console.log(`
        Account #1 expected 0; got ${account1.balance}
        Account #2 expected ${INITIAL_VALUE}; got ${account2.balance}`);

  process.exit(0);
});

async function asyncBalanceTransfer(amount) {
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [ 'http://localhost:1337', '--header', 'content-type: application/json', '--data', `{ "amount":${amount} }` ]);
    curl.on('error', reject);
    curl.on('close', resolve);
  });
}

async function assertBalances(expected1, expected2) {
  const account1 = await BankAccount.findOne(1);
  const account2 = await BankAccount.findOne(2);

  if(account1.balance + account2.balance !== INITIAL_VALUE) {
    throw new Error(`Something went badly wrong.  Balances do not sum to ${INITIAL_VALUE}:
        Account #1 is ${account1.balance} (expected ${expected1})
        Account #2 is ${account2.balance} (expected ${expected2})`);
  }
}
