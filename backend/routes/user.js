const express = require('express');
const router = express.Router();
const auth = require('../auth/auth')
const user = require('../controllers/user.js');

router.post('/api/user/login', auth.optional, user.login);
router.post('/api/user/registration', auth.optional, user.registration);
router.post('/api/user/changePassword', auth.optional, user.changePassword);
router.post('/api/user/confirmCode', auth.optional, user.confirmCode);
router.post('/api/user/changeNumber', auth.optional, user.changeNumber);
router.post('/api/user/information', auth.optional, user.information);
router.post('/api/user/verificationPhone', auth.optional, user.verificationPhone);
router.post('/api/user/verificationEmail', auth.optional, user.verificationEmail);
router.post('/api/user/confirmEmail',auth.optional , user.confirmEmail);

module.exports = router;