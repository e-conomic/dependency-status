var request = require('request');
var semver = require('semver');
var after = require('after-all');

var check = function(name, opts, cb) {
	if (typeof opts === 'function') return check(name, null, opts);
	if (!opts) opts = {};

	var auth = opts.username && opts.password ? opts.username+':'+opts.password+'@' : '';
	var agent = opts.agent;

	var req = function(url, cb) {
		request(url, {json:true, agent:agent}, function(err, response) {
			if (err) return cb(err);
			if (response.statusCode !== 200) return cb();
			cb(null, response.body);
		});
	};

	var findRepo = function(pkg) {
		if (pkg.repository && typeof pkg.repository === 'string') return pkg.repository;
		if (pkg.repository && pkg.repository.url) return pkg.repository.url;
		return undefined;
	};

	var readGithub = function(repo, cb) {
		req('https://'+auth+'raw.github.com/'+repo+'/master/package.json', cb);
	};

	var readNpm = function(name, cb) {
		req('https://registry.npmjs.org/'+name+'/latest', cb);
	};

	var read = function(name, cb) {
		if (/git@/.test(name)) {
			if (name.indexOf('github.com') === -1) return cb(new Error('only github repos supported'));
			name = name.split(/github.com[:\/]/).pop().split('.git')[0].split('#')[0];
		}

		var ongithub = function() {
			readGithub(name, function(err, pkg) {
				if (err) return cb(err);
				if (pkg) return cb(null, pkg);
				cb();
			});
		};

		if (name.indexOf('/') > -1) return ongithub();

		readNpm(name, function(err, pkg) {
			if (err) return cb(err);
			if (pkg) return cb(null, pkg);
			ongithub();
		});
	};

	read(name, function(err, pkg) {
		if (err) return cb(err);
		if (!pkg) return cb(new Error('could not find package: '+name));

		var dependencies = pkg.dependencies || {};
		var deps = Object.keys(dependencies);
		var pkgs = [];

		var next = after(function(err) {
			if (err) return cb(err);

			pkgs = pkgs
				.map(function(latest) {
					var old = dependencies[latest.name];
					if (!old) return null;

					var used = /git@/.test(old) ? (old.split('#')[1] || '*') : old;
					var result = {};

					result.name = latest.name;
					result.repository = findRepo(latest);
					result.latest = latest.version;
					result.used = used.replace(/^v/, '');

					if (semver.satisfies(latest.version, used)) result.status = 'up-to-date';
					else result.status = 'outdated';

					return result;
				})
				.filter(function(dep) {
					return dep;
				});

			cb(null, {
				name: pkg.name,
				version: pkg.version,
				dependencies: pkgs
			});
		});

		deps.forEach(function(dep) {
			var cb = next();

			if (/git@/.test(dependencies[dep])) dep = dependencies[dep];

			read(dep, function(err, pkg) {
				if (err) return cb(err);
				if (!pkg) return cb(new Error('could not find package: '+dep));
				pkgs.push(pkg);
				cb();
			});
		});
	});
};

module.exports = check;