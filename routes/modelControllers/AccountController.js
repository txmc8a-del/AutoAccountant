const express =‘wget-log.32’. require('express')
const debug = require('debug')('autoaccountant:server')
const passport = require('passport')
const router = express.Router()

const Account = require('../../models/Account')

/* GET route for getting accounts from database */
router.get('/', //passport.authenticate('jwt', { session: false }),
(req, res, next) => {
  Account.find({}).exec()
  .then((accounts) => {
    let newAccounts = accounts.map((a) => {
      a.balances = {
        available: a.available_balance,
        current: a.current_balance,
        limit: a.limit
      }
      debug(a.balances)
      delete a.available_balance
      delete a.current_balance
      delete a.limit
      delete a._id
      return a
    })
    res.json({
      accounts: newAccounts
    })
    debug(accounts)
  })
  .catch((err) => {
    debug(err)
    res.status(500).json({message:"Server error"})
  })
})

/* GET route for retrieving account objects by id */
router.get('/:id', //passport.authenticate('jwt', { session: false }),
(req, res, next) => {
  let account_id = req.params.id
  debug(`Returning account ${account_id}`)
  if (account_id != "") {
    Account.find({_id: account_id}).exec()
    .then((account) => {
      account.balances = {
        available: account.available_balance,
        current: account.current_balance,
        limit: account.limit
      }
      debug(account.balances)
      delete account.available_balance
      delete account.current_balance
      delete account.limit
      delete account._id

      res.json(account)
      debug(account)
    })
    .catch((err) => {
      debug(err)
      res.status(500).json({message:"Server error"})
    })
  } else {
    res.status(400).json({message: "Account not specified"})
  }
})

/* PATCH route for updating account objects by id */
router.patch('/:id', //passport.authenticate('jwt', { session: false }),
(req, res, next) => {
  let account_id = req.params.id
  debug(`Updating account ${account_id}`)
  if (account_id != "") {
    Account.update({_id: account_id}, req.body.account).exec()
    .then((account) => {
      res.json(account)
      debug(account)
    })
    .catch((err) => {
      debug(err)
      res.status(500).json({message:"Server error"})
    })
  } else {
    res.status(400).json({message: "Account not specified"})
  }
})

module.exports = router
