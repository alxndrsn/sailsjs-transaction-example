module.exports = {
  attributes: {
    id: { type:'number', required:true, unique:true }, // NB number is not integer
    balance: { type:'number', required:true }, // NB number is not integer
  },
};
