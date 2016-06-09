"use strict";

var FileHandler = function ( user_preferences ) {
	this.dropzone = user_preferences.dropzone;
	this.output_container = user_preferences.output_container;

	this.onStart  = user_preferences.on_start;
	this.onFinish = user_preferences.on_finish;
	this.onLoad   = user_preferences.on_load;
	this.onError      = user_preferences.on_error || this.onError;
	this.getFileName  = user_preferences.file_name_handler || this.nameFile;

	this.list = document.createElement( 'ul' );
	this.output_container.appendChild( this.list );

	new FileSelector( this.dropzone, this.loadFiles.bind( this ) );

	this.stacked_files = 0;
}

FileHandler.prototype.loadFiles = function ( files ) {
	this.stacked_files = files.length;
	this.onStart( this.stacked_files );

	for ( var i in files ) {
		setTimeout( this.loadFile.bind( this, files[i] ), 0 );
	}
}

FileHandler.prototype.loadFile = function ( file_object ) {
	// if ( !file_object.type.match( 'text.*' ) )
	// 	thi new Error( "File type don't match text.*" );

	var reader = new FileReader()
	  , fileHandler = this
	  , get_URL = function() {
			return window.URL || window.webkitURL || window.view;
	  }
	;
	
	reader.readAsText( file_object );

	reader.onload = function( e ){
		var output = fileHandler.onLoad( e.target.result );
		if ( typeof output === 'undefined' )
			return; 

		var filename = fileHandler.getFileName( file_object.name );
		var blob = new Blob( [output] , { type: "text/plain" } );

		// saveAs( blob, this.getFileName( filename ) );

		fileHandler.generateLink( fileHandler.list, get_URL().createObjectURL( blob ), filename );

		fileHandler.stacked_files--;
		if ( fileHandler.stacked_files === 0 )
			fileHandler.onFinish();
	};
	
	reader.onerror = function( evt ){
		fileHandler.onError( evt.target.error.code );

		fileHandler.stacked_files--;
		if ( fileHandler.stacked_files === 0 )
			fileHandler.onFinish();
	};
}

FileHandler.prototype.nameFile = function( name ) {
	return name;
}

FileHandler.prototype.generateLink = function( container, url, filename ) {
	var list_item = document.createElement( 'li' )
	  , anchor    = document.createElement( 'a' )
	;
	anchor.href = url;
	anchor.download = filename;
	elementSetTextContent( anchor, filename );

	list_item.appendChild( anchor );
	container.appendChild( list_item );

	function elementSetTextContent( element, str ){
		if( element.textContent !== undefined ){
			element.textContent = str;
		}
		if( element.innerText !== undefined ){
			element.innerText = str;
		}
	}
}