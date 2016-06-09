Math.log10 = Math.log10 || function(x) {
	return Math.log(x) / Math.LN10;
};

function matchFileNum( filename, prefix ) {
	var num = filename.match( new RegExp( prefix + "(\\d\\d).txt" ) );
	if ( num == null )
		return null;
	return num[1];
}

var Assignments = function ( preferences ) {
	var loading = document.getElementById( "loading" );

	if ( typeof preferences.a5 == "undefined" )
		return;

	var load_function = this.load();
	this.appendOutput = this.generateAppendOutput( preferences.a5.output_container );
	this.appendResult = this.generateAppendResult( preferences.a5.result_container );
	this.prepare_section = preferences.a5.prepare_section;
	this.compute_section = preferences.a5.compute_section;

	console.log( preferences.a5 );
	new FileHandler( {
		dropzone:  preferences.a5.mean_dropzone
	  , on_load:   load_function["mean"]
	  , on_error:  this.onError
	  , on_start:  showLoading
	  , on_finish: hideLoading
	} );
	new FileHandler( {
		dropzone:  preferences.a5.eigens_dropzone
	  , on_load:   load_function["eigen"]
	  , on_error:  this.onError
	  , on_start:  showLoading
	  , on_finish: hideLoading
	} );
	new FileHandler( {
		dropzone:  preferences.a5.dropzone
	  , on_load:   this.a5.bind( this )
	  , on_error:  this.onError
	  , on_start:  showLoading
	  , on_finish: hideLoading
	} );

	this.vector_dim = 196;
	this.target_num = 20;
	this.feature = {};
	for( var i = 0; i < 46; i++ ) {
		this.feature[i] = {};
	}


	function showLoading() {
		loading.classList.remove( "hide" );
		loading.classList.add( "show" );
	}

	function hideLoading() {
		loading.classList.remove( "show" );
		loading.classList.add( "hide" );
	}
}

Assignments.prototype.a5 = function ( file, filename ) {
	var input = file.split( "\n" ).parseInts().reshape( this.vector_dim )
	  , result = []
	  , count = 0
	  , answer = matchFileNum( filename, "c" )
	;

	if ( answer == null )
		return;

	for( var target = 0; target < this.target_num; target++ ) {
		var bays = [];
		for ( var word = 0; word < 46; word++ ) {
			bays[ word ] = this.computeBays( input[ target ], this.feature[ word ].means, this.feature[ word ].eigens );
		}
		var result_index = bays.indexOf( Math.min.apply( null, bays ) );
		if ( result_index + 1 == answer )
			count++;
		this.appendOutput( filename, target, result_index, bays );
	}
	this.appendResult( answer, count/this.target_num );
}

Assignments.prototype.generateAppendResult = function ( container ) {
	var table = document.createElement( 'table' )
	  , tbody = document.createElement( 'tbody' )
	  , flag  = 0
	;
	tbody.innerHTML = "<tr><th>字種</th><th>認識率</th></tr>";
	table.appendChild( tbody );

	return function( target_num, rate ) {
		if ( flag == 0 ) {
			container.appendChild( table );
			flag = 1;
		}

		var tr = document.createElement( 'tr' );
		tr.innerHTML = "<td>" + target_num + "</td><td>" + rate + "</td>";
		tbody.appendChild( tr );
	}
}

Assignments.prototype.generateAppendOutput = function ( container ) {
	var table = document.createElement( 'table' )
	  , tbody = document.createElement( 'tbody' )
	  , flag  = 0
	  , get_URL = function() {
			return window.URL || window.webkitURL || window.view;
	  }
	  , output_section = container
	  , spliter = ~navigator.userAgent.indexOf("Windows") ? "\r\n" : "\n"
	;
	tbody.innerHTML = "<tr><th>認識ターゲット</th><th>認識結果</th><th>距離</th></tr>";
	table.appendChild( tbody );

	return function( filename, target_num, result_num, output ) {
		if ( flag == 0 ) {
			container.appendChild( table );
			flag = 1;
		}

		var tr = document.createElement( 'tr' )
		  , td = document.createElement( 'td' )
		  , blob   = new Blob( [ output.join( spliter ) ] , { type: "text/plain" } )
		;

		tr.innerHTML = "<td>" + filename + " サンプル" + (target_num + 1) + "</td><td>" + (result_num + 1) + "</td>";

		td.appendChild( generateAnchor( blob, "bays" + matchFileNum( filename, "c" ) + "_" + (target_num + 1) + ".txt" ) );
		tr.appendChild( td );
		tbody.appendChild( tr );
	}

	function generateAnchor( blob, filename ) {
		var anchor = document.createElement( 'a' );

		anchor.href = get_URL().createObjectURL( blob );
		anchor.download = filename;
		elementSetTextContent( anchor, filename );

		return anchor;

		function elementSetTextContent( element, str ){
			if( element.textContent !== undefined ){
				element.textContent = str;
			}
			if( element.innerText !== undefined ){
				element.innerText = str;
			}
		}
	}
}

Assignments.prototype.activateRecognition = function() {
	this.prepare_section.classList.remove( "show" );
	this.prepare_section.classList.add( "hide" );
	this.compute_section.classList.remove( "hide" );
	this.compute_section.classList.add( "show" );
}

Assignments.prototype.load = function () {
	var self = this
	  , flag = 0
	  , mean_file_num = 0
	  , eigen_file_num = 0
	;

	var mean = function( file, filename ) {
			//
			var str_num = matchFileNum( filename, "mean" );
			if ( str_num == null )
				return;

			var num = (str_num - 0) - 1;
			self.feature[ num ].means = file.split( "\n" ).parseInts();
			finish( "mean" + str_num );

			mean_file_num++;
			if ( mean_file_num == 46 )
				flag++;
			checkFlag();
		}
	  , eigen = function( file, filename ) {
			//
			var str_num = matchFileNum( filename, "eigen" );
			if ( str_num == null )
				return;

			var num  = (str_num - 0) - 1
			  , data = file.split( "\n" ).map( function ( row ) { return row.split( " " ).parseInts(); } )
			;

			self.feature[ num ].eigens = [];
			for( var i = 0; i < self.vector_dim; i++ ) {
				self.feature[ num ].eigens[i] = {};
				self.feature[ num ].eigens[i].value  = data[i][0];
				self.feature[ num ].eigens[i].vector = data[i].slice(1);

				if ( self.feature[ num ].eigens[i].vector.length == 197 )
					self.feature[ num ].eigens[i].vector.pop();
			}
			finish( "eigen" + str_num );

			eigen_file_num++;
			if ( eigen_file_num == 46 )
				flag++;
			checkFlag();
		}
	;

	return { "mean": mean, "eigen": eigen };

	function checkFlag() {
		if ( flag != 2 )
			return;
		self.activateRecognition();
	}

	function finish( id ) {
		document.getElementById( id ).classList.add( "loaded" );
	}
}

Assignments.prototype.computeBays = function( target, means, eigens ) {
	var distance = this.computeMahalanobis( target, means, eigens )
	  , alpha    = 0.9
	;
	return alpha * distance + ( 1 - alpha ) * Math.log10( eigens.reduce( function ( previous, current, index ) {
		if ( index > 140 )
			return previous;
		return previous * current.value;
	}, 1 ) );
}

Assignments.prototype.computeMahalanobis = function( target, means, eigens ) {
	var bias = 10
	  , normalized_target = target.map( function ( value, index ) {
			return value - means[index];
		} )
	  , distance = 0
	;

	for( var i = 0; i < eigens.length; i++ ) {
		distance += Math.pow( Vector.dot( normalized_target, eigens[i].vector ), 2 ) / ( eigens[i].value + bias );
	}

	return distance;
}