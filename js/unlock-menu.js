define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Router = require('coreJS/router');

	function breakCoreLocking() {
		Adapt.course.unset('_lockType');

		breakLocks(Adapt.contentObjects);
		breakLocks(Adapt.articles);
		breakLocks(Adapt.blocks);

		function breakLocks(collection) {
			collection.each(function(model) {
				model.unset('_lockType');
				model.unset('_isLocked');
			});
		}
	}

	function onMenuUnlocked() {
		if (Adapt.devtools.get('_menuUnlocked')) {
			breakCoreLocking();
			// reload the page/menu
			if (Adapt.location._currentId == Adapt.course.get('_id')) Router.handleRoute();
			else Router.handleId(Adapt.location._currentId);
		}
	}

	// legacy (for courses authored prior to v2.0.9 or which otherwise do not use core locking)
	function onMenuPreRender(view) {
		if (Adapt.devtools.get('_menuUnlocked')) {
			if (Adapt.location._currentId == view.model.get('_id')) {
				view.model.once('change:_isReady', _.bind(onMenuReady, view));
				view.model.getChildren().each(function(item) {
					// first pass: attempt to manipulate commonly employed locking mechanisms
					if (item.has('_lock')) item.set('_lock', item.get('_lock').length > -1 ? [] : false);
					if (item._lock) item._lock = item._lock.length > -1 ? [] : false;
					if (item._locked === true) item._locked = false;
					if (item._isLocked === true) item._isLocked = false;
				});
			}
		}
	}

	// legacy (for courses authored prior to v2.0.9 or which otherwise do not use core locking)
	function onMenuReady() {
		if (Adapt.devtools.get('_menuUnlocked')) {
			// second pass: attempt to enable clickable elements
			this.$('a, button').prop('disabled', false).css('pointer-events', 'auto');
		}
	}

	Adapt.once('adapt:initialize devtools:enable', function() {
		if (!Adapt.devtools.get('_isEnabled')) return;

		if (Adapt.devtools.get('_unlockMenuAvailable')) {
			Adapt.devtools.on('change:_menuUnlocked', onMenuUnlocked);
			Adapt.on('menuView:preRender', onMenuPreRender);
		}
	});
});
