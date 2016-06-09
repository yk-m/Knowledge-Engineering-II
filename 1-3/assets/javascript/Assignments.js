var Assignments = function ( preferences ) {
	var loading = document.getElementById( "loading" );

	if ( typeof preferences.a1 != "undefined" )
		new FileHandler( {
			dropzone:         preferences.a1.dropzone
		  , output_container: preferences.a1.output_container
		  , on_load:          this.a1.bind( this )
		  , on_error:         this.onError
		  , file_name_handler: function( filename ) {
				return filename.replace( /c/g , "mean" );
		  }
		  , on_start: function () {
				loading.style.display = "block"
		  }
		  , on_finish: function () {
				loading.style.display = "none"
		  }
		} );

	if ( typeof preferences.a2 != "undefined" )
		new FileHandler( {
			dropzone:         preferences.a2.dropzone
		  , output_container: preferences.a2.output_container
		  , on_load:          this.a2.bind( this )
		  , on_error:         this.onError
		  , file_name_handler: function( filename ) {
				return filename.replace( /c/g , "sigma" );
		  }
		  , on_start: function () {
				loading.style.display = "block"
		  }
		  , on_finish: function () {
				loading.style.display = "none"
		  }
		} );

	if ( typeof preferences.a3 != "undefined" )
		new FileHandler( {
			dropzone:         preferences.a3.dropzone
		  , output_container: preferences.a3.output_container
		  , on_load:          this.a3.bind( this )
		  , on_error:         this.onError
		  , file_name_handler: function( filename ) {
				return filename.replace( /c/g , "eigen" );
		  }
		  , on_start: function () {
				loading.style.display = "block"
		  }
		  , on_finish: function () {
				loading.style.display = "none"
		  }
		} );

	this.vector_dim = 196;
}

Assignments.prototype.a1 = function ( string ) {
	console.log( string );
	var input  = string.split( "\n" ).parseInts().reshape( this.vector_dim );
	var output = this.calcVectorsMean( input, false );
	return output.join( "\n" );
}

Assignments.prototype.a2 = function ( string ) {
	var input  = string.split( "\n" ).parseInts().reshape( this.vector_dim );
	var output = this.calcCovarianceMatrix( input );
	return output.map( function ( row ) { return row.join( " " ); } ).join( "\n" );
}

Assignments.prototype.a3 = function ( string ) {
	var input  = string.split( "\n" ).map( function ( row ) { return row.split( " " ).parseInts(); } );
	var output = this.jacobi( input, 0.00001 );
	//TODO TEST WITH A LARGER THRESHOLD
	console.log( output );
}

Assignments.prototype.calcVectorsMean = function ( vectors, is_transposed ) {
	var means = []
	  , assignments = this
	;

	if ( !is_transposed )
		vectors = Matrix.transpose( vectors );

	return vectors.map( function( vector ) {
		return assignments.calcMean( vector );
	} );
}

Assignments.prototype.calcMean = function( values ) {
	return values.reduce( function ( a, b ) { return a + b } ) / values.length;
}

Assignments.prototype.calcCovarianceMatrix = function ( vectors ) {
	vectors = Matrix.transpose( vectors );

	var means   = this.calcVectorsMean( vectors, true )
	  , covariance_matrix = []
	;

	for ( var i = 0; i < this.vector_dim; i++ ) {
		covariance_matrix[i] = [];
		for ( var j = 0; j < this.vector_dim; j++ ) {
			covariance_matrix[i][j] = this.calcCovariance( vectors[i], vectors[j], means[i], means[j] );
		}
	}

	return covariance_matrix;
}

Assignments.prototype.calcCovariance = function( x_i, x_j, mean_i, mean_j ) {
	return Vector.dot( x_i, x_j ) / x_i.length - mean_i * mean_j;
}

Assignments.prototype.makeGivens = function ( dim, position, angle ) {
		var givens = {
			matrix: Matrix.generateIdentityMatrix( dim )
		  , inverse: Matrix.generateIdentityMatrix( dim )
		};

		givens.matrix[ position.i ][ position.i ] = angle.cos;
		givens.matrix[ position.i ][ position.j ] = -angle.sin;
		givens.matrix[ position.j ][ position.j ] = angle.cos;
		givens.matrix[ position.j ][ position.i ] = angle.sin;

		givens.matrix[ position.i ][ position.i ] = angle.cos;
		givens.inverse[ position.i ][ position.j ] = angle.sin;
		givens.matrix[ position.j ][ position.j ] = angle.cos;
		givens.inverse[ position.j ][ position.i ] = -angle.sin;

		return givens;
}

// jacobi
Assignments.prototype.jacobi = function ( matrix, threshold ) {
	var dim = matrix.length
	  , eigen = {
			values: matrix
		  , vector: Matrix.generateIdentityMatrix( dim )
	  }
	  , roop_counter = 0  //loop
	;

	while(1) {
		console.profile("test");
		var position = locateMaxValue( eigen.values )
		  , angle    = calcAngle( eigen.values, position )
		;

		console.log( "roop! " + ++roop_counter );
		console.log( position.max );
		console.log( eigen.values[0][0] );

		if ( position.max < threshold )
			break;

		eigen.values = rotate( eigen.values, position, angle );
		eigen.vector = append( eigen.vector, position, angle );
	}

	eigen.values = repair( eigen.values );
	return eigen;

	//Pinv * A * P
	function rotate( b, position, angle ) {
		var dim = b.length;
		if (dim < 2)
			return b;
		var givens = makeGivens( dim, position, angle );
		return Matrix.cross( Matrix.cross( givens.inverse, b ), givens.matrix );
	}

	function append( matrix, position, angle ) {
		var dim = matrix.length;

		if (dim < 2)
			return matrix;

		var givens = makeGivens( dim, position, angle );
		return Matrix.cross( matrix, givens.matrix );
	}

	function makeGivens( dim, position, angle ) {
		var givens = {
			matrix: Matrix.generateIdentityMatrix( dim )
		  , inverse: Matrix.generateIdentityMatrix( dim )
		};

		givens.matrix[ position.i ][ position.i ] = angle.cos;
		givens.matrix[ position.i ][ position.j ] = angle.sin;
		givens.matrix[ position.j ][ position.j ] = angle.cos;
		givens.matrix[ position.j ][ position.i ] = -angle.sin;

		givens.inverse[ position.i ][ position.i ] = angle.cos;
		givens.inverse[ position.i ][ position.j ] = -angle.sin;
		givens.inverse[ position.j ][ position.j ] = angle.cos;
		givens.inverse[ position.j ][ position.i ] = angle.sin;

		return givens;
	}

	//TODO write unit test
	//compare to the calculation with hand
	function calcAngle( matrix, position ) {
		var mii = matrix[ position.i ][ position.i ]
		  , mij = matrix[ position.i ][ position.j ]
		  // , mji = matrix[ position.j ][ position.i ]
		  , mjj = matrix[ position.j ][ position.j ]
		;

		var theta = 0.5 * Math.atan2( 2 * mij, mjj - mii );
		return { cos: Math.cos( theta ), sin: Math.sin( theta ) };

		// var dif = ( mii - mjj ) / 2
		//   , u2  = ( mii - sum = ( mii + mjj ) / 2 -  Math.sqrt( mji * mji + dif * dif ) ) / mij
		//   , len = Math.sqrt( 1 + u2 * u2 )
		// ;

		// return { cos: u1/len, sin: u2/len };
	}

	function locateMaxValue( matrix ) {
		var dim = matrix.length
		  , position = {
				i: 0
			  , j: 0
			  , max: 0
		  }
		;
		for ( var i = 0; i < dim; i++ ) {
			for ( var j = i+1; j < dim; j++ ) {
				if ( Math.abs( matrix[i][j] ) <= position.max )
					continue;
				position.max = Math.abs( matrix[i][j] );
				position.i = i;
				position.j = j;
			}
		}
		return position;
	}

	function repair( matrix ) {
		var dim = matrix.length;

		for ( var i = 0; i < dim; i++ ) {
			for ( var j = 0; j < i; j++ ) {
				matrix[j][i] = matrix[i][j];
			}
		}
		return matrix;
	} 
}

Assignments.prototype.onError = function( message ) {
	console.log( message );
}
