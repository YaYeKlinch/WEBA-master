# Setup:
	
	- install git
	- install heroku-cli

# Commands:

	- git init (in app folder)
	- git add .
	- git commit -m "init"
	- heroku login
	- heroku create <<app-name>>
	- heroku git:remote -a <<app-name>> (set git remote heroku to https://git.heroku.com/<<app-name>>.git)
	- git push heroku master
	- heroku open

