"use strict";

var FileSaver = function ( onError ) {
	this.onError = onError;
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

}

FileSaver.prototype.save = function ( filename, text ) {
	navigator.webkitPersistentStorage.requestQuota ( 1024*1024*1024, function( grantedBytes ) {
		console.log ( 'requestQuota: ', arguments );
		this.requestFS( filename, text, grantedBytes );
	}.bind(this), this.onError );
}

FileSaver.prototype.requestFS = function ( filename, grantedBytes ) {
	window.webkitRequestFileSystem( window.PERSISTENT, grantedBytes, function( fs ) {
		window.webkitRequestFileSystem( window.PERSISTENT, grantedBytes, this.onInitFs.bind( this, filename, text ), this.onError);
	}, this.onError);
}

FileSaver.prototype.onInitFs = function ( filename, text, fs ) {
	text = text + ''; 
	fs.root.getFile( filename, { create: true, exclusive: true }, function( fileEntry ) {
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.onwriteend = function(e) {
				console.log('Write completed.');
			};

			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};
			console.log( "rrr" );
			fileWriter.truncate(0);
			var bb = new Blob([ text ]);
			console.log( bb );
			fileWriter.write(bb);
		});
	}, this.onError);
}