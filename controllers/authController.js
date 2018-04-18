const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail.js');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed login!',
	successRedirect: '/',
	successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out!');
	res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()) {
		next();
		return;
	}
	req.flash('error', 'You must be logged in.');
	res.redirect('/login')
}

exports.forgot = async (req, res) => {
	const user =  await User.findOne({ email: req.body.email });
	if(!user) {
		req.flash('error', 'A password reset has been mailed to you.');
		return res.redirect('/login');
	}
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExprires = Date.now() + 3600000;
	await user.save();
	const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		subject: 'Password Reset',
		resetURL,
		filename: 'password-reset',
	})
	req.flash('success', `You have been emailed a password reset link.`);
	res.redirect('/login');
}

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExprires: { $gt: Date.now() },
	});
	if(!user) {
		res.flash('error', 'Whoops, something expired. Try to reset your password again');
		return res.redirect('/login');
	}
	res.render('reset', { title: 'Reset Password'});
}

exports.confirmPasswords = (req, res, next) => {
	if(req.body.password === req.body['password-confirm']) {
		next();
		return;
	}

	req.flash('error', 'Passwords do not match');
	res.redirect('back');
}

exports.updatePassword = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExprires: { $gt: Date.now() },
	});
	if(!user) {
		res.flash('error', 'Whoops, something expired. Try to reset your password again');
		return res.redirect('/login');
	}
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExprires = undefined;
	const updateUser = await user.save();
	await req.login(updateUser);
	req.flash('success', 'You have reset your password!');
	res.redirect('/')
}
