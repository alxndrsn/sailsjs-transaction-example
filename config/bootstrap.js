module.exports.bootstrap = async function() {
  await BankAccount.create({ id:1, balance:10000 });
  await BankAccount.create({ id:2, balance:    0 });
};
