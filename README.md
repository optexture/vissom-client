# vissom-client - smartphone client application for Visualize Somerville 2.0

**Visualize Somerville** is a concept to combine technology and community into a large scale interactive installation, which took place on May 7, 2016. Visitors were able to interact with the projections via smartphone or tablet to control what is on the walls. Imagine 30+ people all controlling different factors of the projections, painting on the walls, and making amazing art collectively.

Learn more about the event: [https://www.kickstarter.com/projects/1728100511/visualize-somerville-an-interactive-community-expe](https://www.kickstarter.com/projects/1728100511/visualize-somerville-an-interactive-community-expe)

[Artists and amateurs can climb the walls at Visualize Somerville 2](http://www.metro.us/boston/artists-and-amateurs-can-climb-the-walls-at-visualize-somerville-2/zsJpdz---XJGAWAvnNTHkU/)

##Build

- run **npm install**
- install gulp globally on your machine: **npm install -g gulp**
- run **gulp build**
- your build will be found at `dist/`; copy the contents to your webserver and you should be good to go.


##Development

- run **npm install**
- install gulp globally on your machine: **npm install -g gulp**
- you must run **gulp process-scss** at least once, unless you like unstyled web pages
- **default** task will spin up a BrowserSync server at http://localhost:3000/