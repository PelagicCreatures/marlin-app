## ACL Access control for table

Roles
* superuser
* admin
* registered - any registered user
* anonymous - not logged in
* owner - special case for view, edit, delete tests if user.id === instance.userId

You can also define additional roles in the Role table

By default all tables should be to restrict the admin endpoints:
```
ADMIN: {
	ACL: [{
			permission: 'deny',
			roles: ['*'],
			actions: ['*']
	}]
}
```

You can grant access by action and role:
```
ADMIN: {
	ACL: [{
			permission: 'deny',
			roles: ['*'],
			actions: ['*']
	},{
		permission: 'allow',
		roles: ['superuser', 'admin', 'owner'],
		actions: ['create', 'view', 'edit', 'delete']
	}]
}
```
