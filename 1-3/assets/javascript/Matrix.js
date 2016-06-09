var Matrix = {
	transpose: function( a ) {
		return  a[0].map( function (_, c) {
			return a.map( function ( r ) {
				return r[c];
			});
		});
	}
  , cross: function( a, b ) {
		if ( a[0].length != b.length )
			throw new TypeError( "外積不可能な組み合わせです．" );

		b = Matrix.transpose( b );
		var product = []
		  , rows = a.length
		  , columns = b.length
		;
		for ( var i = 0; i < rows; i++ ) {
			product[i] = [];
			for ( var j = 0; j < columns; j++ ) {
				product[i][j] = Vector.dot( a[i], b[j] );
			}
		}
		return product;
	}
  , generateIdentityMatrix: function( size ) {
		return Array.apply( null, { length: size } ).map( function ( _, i ) {
			return Array.apply( null, { length: size } ).map( function ( _, j ) {
				return i == j ? 1 : 0;
			} );
		} );
	}
}

var Vector = {
	dot: function ( a, b ) {
		if ( a.length != b.length )
			throw new Error( "引数の次元が異なります．" );
		return a.reduce( function ( previous, current, index ) {
			return previous + current * b[index];
		}, 0 );
	}
}

