Array.prototype.reshape = function ( columns ) {
	var arrays = [];
	if ( typeof columns === 'undefined' )
		throw new TypeError( "引数が指定されていません．" );

	while ( this.length > 1 )
		arrays.push( this.splice( 0, columns ) );
	return arrays;
}

Array.prototype.transpose = function () {
	if ( !Array.isArray( this[0] ) )
		throw new TypeError( "2次元配列ではありません．" );
	var arrays = this;
	return arrays[0].map( function (_, c) {
		return arrays.map( function ( r ) {
			return r[c];
		});
	});
}

Array.prototype.parseInts = function () {
	return this.map( function( value ) {
		return value - 0 || 0;
	} )
}