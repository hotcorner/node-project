const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
	res.render('login', { title: "Login"})
}

exports.registerForm = (req, res) => {
	res.render('register', { title: "Register"})
}

exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply a name').notEmpty();
	req.checkBody('email', 'That Email Address is not valid').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false,
	});
	req.checkBody('password', 'Password cannot be blank').notEmpty();
	req.checkBody('password-confirm', 'Confirmed Password cannot be blank').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password)

	const errors = req.validationErrors();
	if(errors) {
		req.flash('error', errors.map(err => err.msg));
		res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
		return;
	}
	next();
}

exports.register = async (req, res, next) => {
	const user = new User({ name: req.body.name, email: req.body.email });
	const register = promisify(User.register, User);
	await register(user, req.body.password)
	.then(
		function fulfilled(){
			next();
			return;
		},
		function rejected(err){
			req.flash('error', 'That email address is already being used.');
			res.render('register', {title: 'Register', flashes: req.flash()});
		}
	);
}

exports.account = (req, res) => {
	res.render('account', {title: 'Your Account'});
}

exports.accountUpdate = async (req, res) => {
	const updates = {
		name: req.body.name,
		email: req.body.email
	};

	const user = await User.findOneAndUpdate(
		{ _id: req.user._id }, 
		{ $set: updates },
		{ new: true, runValidators: true, context: 'query' }
	);
	req.flash('success', 'Update successful!')
	res.redirect('back');
}