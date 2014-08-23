/*globals Backbone javascripture bible worker _ */
/*Backbone.ajax = function() {
	return
}
Backbone.sync = function() {
	return
}*/


var ReferenceModel = Backbone.Model.extend( { } );

var ReferenceView = Backbone.View.extend({
	el: '#verse',

	template: _.template( $("#reference-template").html() ),

	initialize: function() {
		this.collection = new ChapterCollection( this.model.get( 'chapters' ), {
			prev: this.model.attributes.prev,
			next: this.model.attributes.next,
			testament: this.model.attributes.testament,
			reference: this.model.attributes.reference
		} );
//		this.listenTo( this.collection, 'reset', this.render );
		this.render();
	},

	render: function() {
		var $reference = $( this.template( this.model.attributes ) );
		var chapters = this.collection.getChapters();
		_.each( chapters, function( chapter ) {
			$reference.append( chapter );
		} );
		this.$el.html( $reference );
	}

});

var ChapterModel = Backbone.Model.extend( { } );

var ChapterCollection = Backbone.Collection.extend( {

	model: ChapterModel,

	initialize: function( models, options ) {
		this.prev = options.prev;
		this.next = options.next;
		this.testament = options.testament;
		this.reference=  options.reference;
	},

	getChapters: function() {
		var chapters = [];
		if ( this.prev ) {
			chapters.push( javascripture.modules.reference.getChapterText( this.prev, this.models[0].attributes, this.testament ) );
			chapters.push( javascripture.modules.reference.getChapterText( this.reference, this.models[1].attributes, this.testament ) );
			if (  this.next ) {
				chapters.push( javascripture.modules.reference.getChapterText( this.next, this.models[2].attributes, this.testament ) );
			}
		} else {
			chapters.push( javascripture.modules.reference.getChapterText( this.reference, this.models[0].attributes, this.testament ) );
			if ( this.next ) {
				chapters.push( javascripture.modules.reference.getChapterText( this.next, this.models[1].attributes, this.testament ) );
			}
		}
		return chapters;
	}

/*	fetch: function( options ) {
		console.log(this);
		console.log( options );
		// Send data to our worker.
		worker.postMessage( {
			task: 'reference',
			parameters: reference
		} );
	}*/
} );

var ChapterView = Backbone.View.extend({

	template: _.template( $("#chapter-template").html() ),

	render: function() {
		return this.$el.html( this.template( this.model.attributes ) );
	},

	events: {
		'click' : 'clickChapter'
	},

	clickChapter: function() {
		//anything?
	}

});

var VerseModel = Backbone.Model.extend({});

var VerseView = Backbone.View.extend({

	tagName: "li",

	template: _.template( $("#verse-template").html() ),

	events: {
		'click' : 'clickVerse'
	},

/*	initialize: function() {
		this.collection = new WordCollection();
		this.listenTo( this.collection, 'add', this.render )
	},*/

	clickVerse: function() {
		alert( 'click verse' );
	},

	render: function() {
		//this.collection.fetch();
		return this.template( this.model.attributes );
	}

});

var WordModel = Backbone.Model.extend( {
	defaults: {
		word: '',
		lemma: '',
		morph: ''
	},
	initialize: function() {
		this.setFamilies();
		this.setLiteralTranslation();
	},
	setFamilies: function() {
		var families = [];
		this.get( 'lemma' ).split( ' ' ).forEach( function( lemmaValue ) {
			families.push( javascripture.api.word.getFamily( lemmaValue ) );
		} );
		this.set( 'families', families );
	},
	setLiteralTranslation: function() {
		//this.set( 'word', javascripture.modules.translateLiterally.getWord( this ) );
	}
} );

var WordCollection = Backbone.Collection.extend( {
	model: WordModel,
	initialize: function( reference ) {
		this.book = reference.book;
		this.chapter = reference.chapter;
		this.verse = reference.verse;
	},
	url: function() {
		return this.book + ':' + this.chapter + ':' + this.verse;
	}
} );

var WordView = Backbone.View.extend({

	events: {
		'click' : 'clickWord'
	},

	template: _.template( $("#word-template").html() ),

	render: function() {
		return this.template( this.model.attributes );
	},

	clickWord: function() {
		alert('click');
		$( document ).trigger( 'wordPanel', this.model );
	}

});

javascripture.modules.reference = {
	load: function( reference ) {
		var self = this;

		if ( 'undefined' == typeof reference.verse ) {
			reference.verse = 1;
		}

		reference.rightVersion = $('#versionSelectorRight').val();
		if ( reference.rightVersion === 'original' ) {
			reference.rightVersion = 'kjv'; // Backup
			if ( localStorage.rightVersion ) {
				reference.rightVersion = localStorage.rightVersion;
			}
		}

		reference.leftVersion = $('#versionSelectorLeft').val();
		if ( reference.leftVersion === 'original' ) {
			reference.leftVersion = 'kjv'; // Backup
			if ( localStorage.leftVersion ) {
				reference.leftVersion = localStorage.leftVersion;
			}
		}

		worker.postMessage( {
			task: 'reference',
			parameters: reference
		} );

		return this; //makes it chainable

	},
	scrollToVerse: function ( verse, offset ) {
		if ( undefined === offset ) {
			offset = 0;
		}
		$( document ).scrollTop( 0 );
		offset = offset - $('#dock').height();

		//there must be a better way to do this, but the problem is that the top animation hasn't happened by this point
		if ( $( 'html' ).hasClass( 'reading-mode' ) ) {
			offset = offset - 50;
		}

		if(verse.length > 0) {
//				$('#verse').closest('.panel').scrollTop(verse.offset().top - $('.dock').height() - $('h1').height() );
			$( document ).scrollTo( verse, { offset: offset } );
		}

		$( document ).trigger( 'createWayPoint' );
	},
	getAnchoringData: function ( direction ) {
		//anchor to current verse
		var anchorPointSelector = '#current',
			offset = 0,
			$bodyOffset = $( document ).scrollTop(),
			$anchorVerse;

		//anchor to scrollstop point
		if ( direction ) {
			if ( direction === 'prev' ) {
				$anchorVerse = $('.reference:first-child ol.wrapper li:first-child');
			}

			if ( direction === 'next' ) {
				$anchorVerse = $('.reference:last-child ol.wrapper li:last-child');
			}
			anchorPointSelector = '#' + $anchorVerse.attr('id');
			offset = $bodyOffset - $anchorVerse.offset().top + $('#dock').height();
		}

		return [offset, anchorPointSelector];
	},
	anchorReference: function ( anchoringData ) {
		var anchorPointSelector = anchoringData[1],
		    offset = anchoringData[0],
		    $anchorPoint = $( anchorPointSelector ),
		    verseHeight;

		if ( anchorPointSelector === '.current-verse' ) {
			verseHeight = $anchorPoint.height(),
			offset = -$(window).height() / 2 + verseHeight;
		}

		//anchor to a chapter
		if ( $anchorPoint.length === 0 ) {
			$anchorPoint = $( '#' + anchoringData.currentId );
			offset = - $('[data-role=header]').height();// - 10;
		}

		this.scrollToVerse( $anchorPoint, offset );
	},
	getReferenceFromCurrentUrl: function () {
		return this.getReferenceFromUrl( window.location.hash );
	},
	getReferenceFromUrl: function ( url ) {
		var hashArray = url.split('&'),
			reference = {};

		if ( hashArray.length > 1 ) {
			reference.book = hashArray[0].split('=')[1],
			reference.chapter = parseInt(hashArray[1].split('=')[1], 10),
			reference.verse = 1;
	        if ( hashArray[2] )
	            reference.verse = parseInt(hashArray[2].split('=')[1], 10);
		}
		return reference;
	},
	loadReferenceFromHash: function () {
	    var hash = window.location.hash;
	    if( hash.indexOf( 'search' ) > -1 ) {
	        var word = hash.split( '=' )[ 1 ];
	        setTimeout( function () {
		        createSearchReferencesPanel( { lemma: word } );
		    } );
	    } else if( hash.indexOf( 'reference' ) > -1 ) {
	        var referenceObject = this.getReferenceFromHash();
			if ( localStorage ) {
				localStorage.reference = JSON.stringify( referenceObject );
			}
			referenceObject.anchoringData = javascripture.modules.reference.getAnchoringData( null );
			javascripture.modules.reference.load( referenceObject );
	    }
	},
	getReferenceFromHash: function () {
		var reference = window.location.hash.split( '=' )[1].split(':'),
		    book = reference[0],
		    chapter = parseInt(reference[1], 10),
		    verse = 1;
	    if ( reference[2] ) {
	        verse = parseInt(reference[2], 10);
	    }
		return { book: book, chapter: chapter, verse: verse };
	},
	createReferenceLink: function( reference ) {
		return 'reference=' + reference.book + ':' + reference.chapter + ':' + reference.verse;
	},
	getChapterText: function ( reference, chapterData, testament ) {
		var self = this,
		    book = reference.book,
		    chapter = reference.chapter,
		    verse = reference.verse,
			chapterInArray = chapter - 1,
			verseInArray = verse - 1,
			context = false,
			verses = '';

		if ( chapterData && chapterData.right ) {
			chapterData.right.forEach( function( verseText, verseNumber ) {
				verses += self.getVerseString( reference, chapterData, verseText, verseNumber, verseInArray, testament );
			});
		}
		var chapterModel = new ChapterModel( {
			book: book,
			chapter: chapter,
			verses: verses
		} );
		var chapterView = new ChapterView( {
			model: chapterModel
		} );
		return chapterView.render();

	},
	getVerseString: function( reference, chapterData, verseText, verseNumber, verseInArray, testament ) {
		var self = this,
		    className = '',
		    wrapperId = '',
		    rightString = '',
		    leftString = '';
//		chapterText += '<li id="' + reference.book.replace( / /gi, '_' ) + '_' + reference.chapter + '_' + ( verseNumber + 1 ) + '"';
		if(verseNumber === verseInArray) {
			className = 'current';
		}
		if(verseNumber === verseInArray) {
			wrapperId = 'current';
		}
		if(verseNumber === verseInArray-5) {
			wrapperId = 'context';
			context = true;
		}
		chapterData.right[verseNumber].forEach( function( wordObject, wordNumber ) {
			if ( wordObject ) {
				rightString += self.createWordString( wordObject, 'english', testament, reference.rightVersion );
			}
		});

		//Load original
		if(	chapterData.left[verseNumber] ) {
			chapterData.left[verseNumber].forEach( function( wordObject, wordNumber ) {
				if ( wordObject ) {
					leftString += self.createWordString( wordObject, testament, testament );
				}
			});
		}
		reference.verse = verseNumber;
		var verse = new VerseModel( {
			reference: reference,
			wrapperId: wrapperId,
			className: className,
			rightString: rightString,
			testament: testament,
			leftString: leftString
		} );
		var verseView = new VerseView( {
			model: verse
		} );
		return verseView.render();

	},
	createWordString: function ( wordArray, language, testament, version ) {
		var word = new WordModel( {
			word: wordArray[0],
			lemma: wordArray[1],
			morph: wordArray[2],
			language: testament
		} );
		var wordView = new WordView( {
			model: word
		} );
		return wordView.render();
	},

	createPageTitle: function( reference ) {
		var title = reference.book;
		if ( typeof reference.chapter !== 'undefined' ) {
			title += ' ' + reference.chapter;
		}

		if ( typeof reference.verse !== 'undefined' ) {
			title += ':' + reference.verse;
		}
		return title;
	},

	getReferencesText: function( result ) {
		// This is a bit messy
		var chapters = '';
		if ( result.prev ) {
			chapters += javascripture.modules.reference.getChapterText( result.prev, result.chapters[0], result.testament );
			chapters += javascripture.modules.reference.getChapterText( result.reference, result.chapters[1], result.testament );
			if ( result.next ) {
				chapters += javascripture.modules.reference.getChapterText( result.next, result.chapters[2], result.testament );
			}
		} else {
			chapters += javascripture.modules.reference.getChapterText( result.reference, result.chapters[0], result.testament );
			if ( result.next ) {
				chapters += javascripture.modules.reference.getChapterText( result.next, result.chapters[1], result.testament );
			}
		}
		return chapters;
	}
};


/*globals javascripture*/
;( function ( $ ) {
	var english = javascripture.data.english;
	$.fn.scrollStopped = function(callback) {
	    $(this).scroll( function () {
	        var self = this, $this = $(self);
	        if ($this.data('scrollTimeout')) {
	          clearTimeout($this.data('scrollTimeout'));
	        }
	        $this.data('scrollTimeout', setTimeout(callback,250,self));
	    });
	};

	javascripture.modules.reference.loadReferenceFromHash();

	$(window).bind( 'hashchange', function() {
	    startDate = new Date();
	    javascripture.modules.reference.loadReferenceFromHash();
	});

	$( window ).scrollStopped( function() {
		var scrollTop = $( document ).scrollTop(),
			verseHeight = $( '.referencePanel' ).height() - $( window ).height(),// + $( '.dock' ).height(),
			anchoringData;
		if ( scrollTop <= 0 ) {
			var prev = $( '.three-references' ).data( 'prev' );
			if ( prev ) {
				prev.anchoringData = javascripture.modules.reference.getAnchoringData( 'prev' );
				javascripture.modules.reference.load( prev );
			}
		}
		if ( scrollTop >= verseHeight ) {
			var next = $( '.three-references' ).data( 'next' );
			if ( next ) {
				next.anchoringData = javascripture.modules.reference.getAnchoringData( 'next' );
				javascripture.modules.reference.load( next );
			}
		}
	});

	$('.goToReference').submit(function (event) {
		event.preventDefault();
		var reference = bible.parseReference( $('#goToReference').val() ),
			referenceObject = {
				book: bible.Data.books[reference.bookID - 1][0],
				chapter: reference.chapter,
				verse: reference.verse
			};
		var hash = javascripture.modules.reference.createReferenceLink( referenceObject );
		window.location.hash = hash;
		$( this ).closest( '.popup' ).popup( 'close' );
		$('#goToReference').blur();
		if ( $( 'html' ).hasClass( 'reading-mode' ) ) {
			hideDock();
		}
		return false;
	});

	worker.addEventListener('message', function(e) {
		if( e.data.task === 'reference' ) {

			var reference = e.data.result.reference;

//			var chapterText = javascripture.modules.reference.getReferencesText( e.data.result ),
//				references = e.data.result;
//			references.chapters = chapterText;
			var referenceView = new ReferenceView( {
				model: new ReferenceModel( e.data.result )
			} );

			$( 'head title' ).text( javascripture.modules.reference.createPageTitle( reference ) );

			if ( $.fn.waypoint ) {
				$('.reference').waypoint('destroy');
			}
			javascripture.modules.reference.anchorReference( e.data.parameters.anchoringData );
			maintainState( reference );
			var endDate = new Date();
			timer(startDate, endDate);
		}
	} );

	worker.addEventListener('message', function(e) {
		if( e.data.task === 'loading' ) {
			$( '.loading' ).html( e.data.html );
		}
	} );

} )( jQuery );