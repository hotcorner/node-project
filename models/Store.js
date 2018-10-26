const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slugs = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter store name',
	},
	slug: String,
	description: {
		type: String,
		trim: true,
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point',
		},
		coordinates: [{ 
				type: Number,
				required: 'Supply coordinates',
		}],
		address: {
			type: String,
			required: 'Supply an address',
		}
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'Author is required',
	}
}, {
	toJSON: { virtuals: true },
	toObject: { virtuals: true}
});

// Defining Indexes

storeSchema.index({
	name: 'text',
	description: 'text',
});

storeSchema.index({
	location: '2dsphere',
});

storeSchema.pre('save', async function(next){
	if (!this.isModified('name')){
		next();
		return;
	}
	this.slug = slugs(this.name);
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const stores = await this.constructor.find({ slug: slugRegEx });
	if(stores.length) {
		this.slug = `${this.slug}-${stores.length + 1}`;
	}
	next();
});

storeSchema.statics.getTagsList = function() {
	const query = [
		{ $unwind: '$tags' }, 
		{ $group: { _id: '$tags', count: { $sum: 1 } } },
		{ $sort: { count: -1 } }
	];
  return this.aggregate(query);
}

storeSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'store'
});

module.exports = mongoose.model('Store', storeSchema)
