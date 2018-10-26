const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuidv4 = require('uuid/v4');

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next) {
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto){
			next(null, true);
		} else {
			next({message: 'That file is not allowed'}, false);
		}
	}
}

exports.homePage = (req, res) => {
	res.render('index', {title: 'Hello!'});
}

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store'});
}

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
	if(!req.file) {
		next();
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuidv4()}.${extension}`;
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
}

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
	const store = await (new Store(req.body)).save();
	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
	// Query database for all stores
	const stores = await Store.find();
	res.render('stores', {stores, title: 'Stores'});
}

const confirmOwner = (store, user) => {
	if (!store.author.equals(user._id)){
		throw Error('You must own a store to edit it!');
	}
}

exports.editStore = async (req, res) => {
	const store = await Store.findOne({ _id: req.params.id });
	confirmOwner(store, req.user);
	res.render('editStore', {store, title: `Edit ${store.name}`});
}

exports.updateStore = async (req, res) => {
	req.body.location.type = 'Point';
	const store = await Store.findOneAndUpdate(
		{ _id: req.params.id}, 
		req.body, 
		{ new: true, 
			runValidators: true
		}
	)
	.exec();
	req.flash('success', `Successfully updated ${store.name}. <a href="/store/${store.slug}">View Store</a>`);
	res.redirect(`/stores/${store._id}/edit`);
}

exports.viewStore = async (req, res, next) => {
	const store = await Store.findOne({
		slug: req.params.slug,
	}).populate('author reviews');
	if(!store) return next();
	res.render('store', {title:store.name, store});
}

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag;
	const tagQ = tag || { $exists: true };
	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({ tags: tagQ });
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
	res.render('tags', {title: 'Tags', tags, tag, stores});
}

exports.searchStores = async (req, res) => {
	const stores = await Store
	.find({
		$text: {
			$search: req.query.q,
		}
	}, {
		score:  { $meta: 'textScore' }
	})
	.sort({ score: {$meta: 'textScore'}
	})
	.limit(5);
	res.json(stores);
}

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates,
				},
				$maxDistance: 10000,
			}
		}
	}
	const stores = await Store.find(q).select('slug name description location photo').limit(10);
	res.json(stores);
}

exports.mapPage = async (req, res) => {
	res.render('map', { title: `Map` });
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User.findByIdAndUpdate(
		req.user._id, 
		{ [operator] : { hearts: req.params.id }},
		{ new: true }
	);
	res.json(user);
}

exports.getHearts = async (req, res) => {
	const stores = await Store.find({
		_id: { $in: req.user.hearts	}
	});
	res.render('stores', { title: 'Hearted Stores', stores });
}
