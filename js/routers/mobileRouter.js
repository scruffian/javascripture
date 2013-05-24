// Mobile Router
// =============

// Includes file dependencies
define([
	"jquery",
	"backbone",
	"../models/ReferenceModel",
	"../collections/ReferenceCollection",
	"../views/ReferenceView",
	'bible',
	'external/jquery.waypoints'
], function( $, Backbone, ReferenceModel, ReferenceCollection, ReferenceView, bible ) {

	// Extends Backbone.Router
	var MobileRouter = Backbone.Router.extend( {

		// The Router constructor
		initialize: function() {

			var self = this;

			this.referenceView = new ReferenceView( {
				el: '#reference',
				collection: new ReferenceCollection( [], {} )
			} );

			$(window).bind('scrollstop', function () {
				var $window = $(this),
					scrollTop = $window.scrollTop(),
					contentHeight = $(self.referenceView.el).height() - $window.height();
				//update the panel based on the current hash state
				var hash = window.location.hash.split('?')[1];
				self.reference( hash );
/*				if (scrollTop === 0) { //previous
					var offsetChapter = self.referenceView.collection.previousChapter;
						hash = self.referenceView.collection.objectToQueryString( offsetChapter );
					self.referenceInject( hash );
				}
				if (scrollTop > contentHeight) { //next
					var offsetChapter = self.referenceView.collection.nextChapter,
						hash = self.referenceView.collection.objectToQueryString( offsetChapter );
					self.referenceInject( hash );
				}*/
			});

			Backbone.history.start();

		},

		// Backbone.js Routes
		routes: {

			// When there is no hash bang on the url, the home method is called
			"": "home",

			// When #reference? is on the url, the reference method is called
			"reference?:type": "reference"
			
		},

		// Home method
		home: function() {
		
			this.reference( this._getRandomReference() );

		},

		reference: function( hash ) {

//			$('#reference-panel').reference( hashObject );
			var hashObject = this._getObjectFromHash( hash );

			if ( $('#stopBackbone').val() !== 'true' ) {
				if ( ! this.referencesAreTheSame( this.referenceView.collection, hashObject) ) {
					if ( this.referenceView.collection.chapter > hashObject.chapter ) {
						this.referenceView.collection.direction = 'previous';
					}
					if ( this.referenceView.collection.chapter < hashObject.chapter ) {
						this.referenceView.collection.direction = 'next';
					}
					this.referenceView.collection.book = hashObject.book;
					this.referenceView.collection.chapter = hashObject.chapter;
					this.referenceView.collection.verse = hashObject.verse;
		            $.mobile.loading( "show" );
		
		            // Fetches the Collection of Category Models for the current Category View
		            this.referenceView.collection.fetch().done( function() {
		
						$.mobile.loading( "hide" );

					} );
				}
			} else {
				$('#stopBackbone').val('false');
			}

		},
		
		referencesAreTheSame: function ( firstReference, secondReference ) {
			return ( firstReference.book === secondReference.book ) && ( firstReference.chapter === secondReference.chapter );
		},

		_getObjectFromHash: function( hash ) {
			var typeArray = hash.split('&'),
				options = {};
			for(var i = 0; i < typeArray.length; i++) {
				parameter = typeArray[i].split('=');
				options[parameter[0]] = parameter[1];
			}
			return options;
		},

		// get a random reference
		_getRandomReference: function() {
			var bookNumber = Math.floor(Math.random() * bible.Data.books.length),
				chapterNumber = Math.floor(Math.random() * bible.Data.verses[bookNumber].length);
				numberOfVerses = bible.Data.verses[bookNumber][chapterNumber];
				verseNumber = Math.floor(Math.random() * numberOfVerses);
				referenceObject = {};
			referenceObject.book = bible.Data.books[bookNumber][0];
			referenceObject.chapter = chapterNumber + 1;
			referenceObject.verse = verseNumber + 1;
			return this.referenceView.collection.objectToQueryString( referenceObject );
		}

    } );

    // Returns the Router class
    return MobileRouter;

} );