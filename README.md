# dependency-status

Check whether your public npm dependencies (or private github dependencies) are up-to-date

	npm install dependency-status

## Usage

Simply call `dependency-status` with module or github repository name

``` js
var check = require('dependency-status');

check('dependency-status', function(err, report) {
	console.log(report);
});
```

The above result will look like this

``` js
{
	name: 'dependency-status',
	version: '0.1.0',
	dependencies: [{
		name: 'request',
		latest: '2.34.0',
		used: '^2.34.0',
		status: 'latest'
	}, {
		...
	}]
}
```

The status of each dependency can be `up-to-date` or `outdated`.

You can also use `dependency-status` if your node project is not on npm but only on github (like an app).
Simply pass `username/repository` to the function

``` js
check('my-github-username/my-repo', callback);
```

If your repository is private you need to pass credentials as well as the second parameter

``` js
check('my-user/my-private-repo', {
	username: 'this-user-has-read-access-to-the-repo',
	password: 'this-is-his-password'
}, callback);
```

If you pass a credentials map you can also check the status of your modules private github dependencies

## License

MIT