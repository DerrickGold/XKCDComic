//jsonp callback function
var displayComic = null;

var XKCDComic = function(pluginConf) {


	var instance = this;

	this.lastComicID = null;
	this.containerDom = null;
	this.titleDom = null;
	this.comicDom = null;
	this.initInterval = null;
	this.updateInterval = null;
	this.comicScript = null;

	//set callback for comic retrieval
	displayComic = function(data) {
		//update last comic id
		if (instance.lastComicID === null)
			instance.lastComicID = parseInt(data.num);

		//update the plugin client
		instance.titleDom.innerHTML=data.title;
		instance.comicDom.src=data.img;
	}


	//get XKCD comic information via their api
	this.getComicMetaData = function(id, successCb, errorCb, otherCb) {

		var comicUrl = null;
		//no id specified, get the newest comic
		if (!id)
			comicUrl = "http://dynamic.xkcd.com/api-0/jsonp/comic/"
		else
			comicUrl = "http://dynamic.xkcd.com/api-0/jsonp/comic/" + id;

		//remove old script
		if (instance.comicScript)
			instance.comicScript.parentNode.removeChild(instance.comicScript);
		//get new script
		instance.comicScript = document.createElement('script');
		instance.comicScript.src = comicUrl + "?callback=displayComic";
		document.getElementsByTagName('head')[0].appendChild(instance.comicScript);
	}

	this.getComic = function() {
		var nextComicID = null;

		//if we don't have the last released comic's ID, we can't generate
		//a random number in the valid comic ID range. So first get the last
		//comic to determine the ID range.
		if (instance.lastComicID) {
			//otherwise, we have the last comic ID, pick a random comic from
			//0 - lastComicID
			nextComicID = parseInt(Math.random() * instance.lastComicID);
		}

		instance.getComicMetaData(nextComicID);
	}

	//set a timer to fetch a new comic every "newPeriod" seconds
	this.setPeriod = function(newPeriod) {
		newPeriod = parseInt(newPeriod);

		if (instance.updateInterval)
			window.clearInterval(instance.updateInterval)

		//convert period into seconds
		newPeriod = parseInt(newPeriod * 1000);

		instance.updateInterval = setInterval(function() {
	    	instance.getComic();
	    }, newPeriod);

	}

	//set callbacks for pluginConf settings as they are read
	pluginConf.onGet = function(resp) {

		//if comic time-to-live (TTL) value was returned, update the comic period
		if (resp.setting === "comicTTL") {
			instance.setPeriod(resp.value);
			console.log(resp);
		}
	}

	//constructor must be called init for the web frontend to initialize
	//when this plugin is loaded
	this.init = function() {
		//locate relevant doms for updating
		instance.titleDom = instance.containerDom.getElementsByClassName("title")[0];
		instance.comicDom = instance.containerDom.getElementsByClassName("comic")[0];

		//get the initial comic
		instance.getComic();

		//load update time
		pluginConf.get("comicTTL");
	}

	//destructor must be named 'destroy' for web frontend to cleanup
	//when unloading this plugin
	this.destroy = function() {
		//clear all set intervals
		if (instance.initInterval)
			window.clearInterval(instance.initInterval);

		if (instance.updateInterval)
			window.clearInterval(instance.updateInterval);

		//unset callback function
		displayComic = null;
	}

	//wait for HTML data to load before initializing
	this.initInterval = setInterval(function() {
		var container = document.getElementById('XKCDComic');
		//checks that the title class div object defined in xkcdcomic.html is
		//injected into the plugin client
		var domExists = container.getElementsByClassName("title")[0];
		loaded = (domExists !== undefined && domExists !== null);

		if (loaded) {
			instance.containerDom = container;
			window.clearInterval(instance.initInterval);
			instance.initInterval = null;
			instance.init();
		}

	}, 50);
};
