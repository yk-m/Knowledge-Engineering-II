var JacobiTester = function () {}

JacobiTester.prototype.test_givens = function() {
	var givens = this.makeGivens( 2, { i: 0, j: 1 }, { cos: Math.cos( 30 ), sin: Math.sin( 30 ) } );

	console.log( "Givens回転行列テスト" )
	console.log( givens )
	console.log( "掛け算" )
	console.log( Matrix.cross( givens.inverse, givens.matrix ) )
}

JacobiTester.prototype.test_angle = function() {
	var matrix = [
		[ 2.5, 1.5 ]
	  , [ 1.5, 2.5 ]
	];

	var angle = this.calcAngle( matrix, this.locateMaxValue(matrix) );

	console.log( "sin/cosテスト" )
	console.log( angle )
}

JacobiTester.prototype.test_rotate = function() {
	var matrix = [
		[ 2.5, 1.5 ]
	  , [ 1.5, 2.5 ]
	];

	var values = this.rotate( matrix, this.locateMaxValue(matrix), this.calcAngle( matrix, this.locateMaxValue(matrix) ) );

	console.log( "rotateテスト" )
	console.log( values )
}

JacobiTester.prototype.test_cross = function () {
	console.log( Matrix.cross(
		[
			[2,3]
		  , [1,4]
		  , [2,1]
		],[
			[3,1,2]
		  , [2,4,2]
		]
	) )
}

JacobiTester.prototype.main = function ( matrix, threshold  ) {
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
}
JacobiTester.prototype.rotate = function( b, position, angle ) {
	console.log( "rotate" )
	var dim = b.length;
	if (dim < 2)
		return b;
	var givens = this.makeGivens( dim, position, angle );
	console.log( givens );
	return Matrix.cross( Matrix.cross( givens.inverse, b ), givens.matrix );
}

JacobiTester.prototype.appendRotation = function( matrix, position, angle ) {
	var dim = matrix.length;

	if (dim < 2)
		return matrix;

	var givens = this.makeGivens( dim, position, angle );
	return Matrix.cross( matrix, givens.matrix );
}

JacobiTester.prototype.makeGivens = function ( dim, position, angle ) {
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
JacobiTester.prototype.calcAngle = function( matrix, position ) {
	var mii = matrix[ position.i ][ position.i ]
	  , mij = matrix[ position.i ][ position.j ]
	  , mji = matrix[ position.j ][ position.i ]
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

	// var dif = ( mii - mjj ) / 2
	//   , u2  = ( mii - ( mii + mjj ) / 2 -  Math.sqrt( mij * mij + dif * dif ) ) / mij
	//   , len = Math.sqrt( 1 + u2 * u2 )
	// ;

	// return { cos: u1/len, sin: u2/len };
}

JacobiTester.prototype.locateMaxValue = function( matrix ) {
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

JacobiTester.prototype.repair = function( matrix ) {
	var dim = matrix.length;

	for ( var i = 0; i < dim; i++ ) {
		for ( var j = 0; j < i; j++ ) {
			matrix[j][i] = matrix[i][j];
		}
	}
	return matrix;
} 