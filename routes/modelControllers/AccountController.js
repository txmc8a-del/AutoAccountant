const express = require('express');
const debug = require('debug')('autoaccountant:server');
const passport = require('passport');
const router = express.Router();

const Account = require('../../models/Account');

/**
 * Helper function to format account balance structure
 * Converts Mongoose document to plain object and remaps balances
 */
const formatAccountBalances = (accountDoc) => {
  if (!accountDoc) return null;
  
  // Convert Mongoose Document to plain JS Object so we can delete/add keys safely
  const account = accountDoc.toObject ? accountDoc.toObject() : { ...accountDoc };
  
  account.balances = {
    available: account.available_balance,
    current: account.current_balance,
    limit: account.limit
  };
  
  debug(account.balances);
  
  // Remove deprecated/flattened keys
  delete account.available_balance;
  delete account.current_balance;
  delete account.limit;
  delete account._id;
  
  return account;
};

/* GET route for getting accounts from database */
router.get('/', 
  // passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      // .lean() returns plain JS objects directly, making it faster and editable
      const accounts = await Account.find({}).lean();
      const newAccounts = accounts.map(formatAccountBalances);
      
      debug(newAccounts);
      res.json({ accounts: newAccounts });
    } catch (err) {
      debug(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* GET route for retrieving account objects by id */
router.get('/:id', 
  // passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const account_id = req.params.id;
    
    if (!account_id) {
      return res.status(400).json({ message: "Account not specified" });
    }

    debug(`Returning account ${account_id}`);
    
    try {
      // findById returns a single document instead of an array
      const accountDoc = await Account.findById(account_id);
      
      if (!accountDoc) {
        return res.status(404).json({ message: "Account not found" });
      }

      const formattedAccount = formatAccountBalances(accountDoc);
      debug(formattedAccount);
      res.json(formattedAccount);
    } catch (err) {
      debug(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* PATCH route for updating account objects by id */
router.patch('/:id', 
  // passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const account_id = req.params.id;
    
    if (!account_id) {
      return res.status(400).json({ message: "Account not specified" });
    }

    debug(`Updating account ${account_id}`);
    
    try {
      // Replaced deprecated .update() with .updateOne()
      const result = await Account.updateOne({ _id: account_id }, req.body.account);
      
      debug(result);
      res.json(result);
    } catch (err) {
      debug(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
