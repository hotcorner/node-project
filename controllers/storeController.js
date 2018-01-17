exports.myMiddleware = (req, res, next) => {
	req.name = 'Clintonia';
	next();
}

exports.homePage = (req, res) => {
	res.render('index', {title: 'Hello!'});
}