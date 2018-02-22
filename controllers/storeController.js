const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
	res.render('index', {title: 'Hello!'});
}

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store'});
}

exports.createStore = async (req, res) => {
	const store = await (new Store(req.body)).save();
	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
	// Query database for all stores
	const stores = await Store.find();
	res.render('stores', {stores, title: 'Stores'});
}

exports.editStore = async (req, res) => {
	const store = await Store.findOne({ _id: req.params.id });
	res.render('editStore', {store, title: `Edit ${store.name}`});
}

exports.updateStore = async (req, res) => {
	const store = await Store.findOneAndUpdate(
		{ _id: req.params.id}, 
		req.body, 
		{ new: true, 
			runValidators: true
		}
	)
	.exec();
	req.flash('success', `Successfully updated ${store.name}. <a href="/stores/${store.slug}">View Store</a>`);
	res.redirect(`/stores/${store._id}/edit`);
}