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

Assignments.prototype.onError = function( message ) {
	console.log( message );
}
