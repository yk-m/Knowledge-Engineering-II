

	var dim = matrix.length
	  , eigen = {
			values: matrix
		  , vector: Matrix.generateIdentityMatrix( dim )
	  }
	  , roop_counter = 0  //loop
	;

	while(1) {
		var position = locateMaxValue( eigen.values )
		  , angle    = calcAngle( eigen.values, position )
		;

		console.log( "roop! " + ++roop_counter );
		console.log( position.max );
		console.log( eigen.values, eigen.vector );

		if ( position.max < threshold )
			break;

		eigen.values = repair( rotate( eigen.values, position, angle ) );
		eigen.vector = appendRotation( eigen.vector, position, angle );
	}

	return eigen;

	//Pinv * A * P
	function rotate( b, position, angle ) {
		var dim = b.length;
		if (dim < 2)
			return b;
		var givens = makeGivens( dim, position, angle );
		console.log( givens );
		return Matrix.cross( Matrix.cross( givens.inverse, b ), givens.matrix );
	}

	function appendRotation( matrix, position, angle ) {
		var dim = matrix.length;

		if (dim < 2)
			return matrix;

		var givens = makeGivens( dim, position, angle );
		return Matrix.cross( matrix, givens.matrix );
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

		// var sum = ( mii + mjj ) / 2
		//   , dif = ( mii - mjj ) / 2
		//   , root = Math.sqrt( mji * mji + dif * dif )
		//   , u1  = 1
		//   , u2  = ( mii - sum - root ) / mij
		//   , len = Math.sqrt( u1 * u1 + u2 * u2 )
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