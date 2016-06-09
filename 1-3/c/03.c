#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define COL_MAX 8192
#define THRESHOLD 5e-5

typedef struct {
	int height;
	int width;
	double **a;
} Matrix;

typedef struct {
	int i;
	int j;
	double value;
} Coordinate;

typedef struct {
	double sin;
	double cos;
} Trigonometry;



/* ---------------------------------
	Jacobi
---------------------------------- */
void jacobi( Matrix *m, int num_of_file );
void printEigen( Matrix *eigen_values, Matrix *eigen_vectors, int num_of_file );
void sort( Matrix *m );
void rotate( Matrix *m, Coordinate position, Trigonometry angle );
void append( Matrix *m, Coordinate position, Trigonometry angle );
Trigonometry calcAngle( Matrix *m, Coordinate position );
Coordinate locateMaxValue( Matrix *m );
void repair( Matrix *matrix );



/* ---------------------------------
	Matrix
---------------------------------- */
Matrix *loadMatrix( const char* fname );
int countSpliter( const char* string, const char splitter );
void printMatrix( Matrix *m );
void printMatrixToFile( const char fn[], Matrix *m );

Matrix *multiply( Matrix *a, Matrix *b );
Matrix *generateIdentityMatrix( int dim );

Matrix *createMatrix( int width, int height );
void freeMatrix( Matrix* matrix );



/* ---------------------------------
	Error Handler 
---------------------------------- */
void FileOpenError( const char* fname ) {
	printf("can't open %s\n", fname);
	exit(1);
}

void FileNameError() {
	printf("ファイル名の形式は sigma00.txt にしてください．");
	exit(1);
}

void MatrixLoadError() {
	printf("行列のロードに失敗しました．\n" );
	exit(1);
}

void AllocationError() {
	printf( "Allocation Error\n" );
	exit(1);
}



int findNumber( const char fn[] ) {
	const static char base[] = "sigma";
	int i = 0
	  , num_of_file = -1
	;
	while ( fn[i] !='\0' )
		i++;

	while(1) {
		i--;
		if ( fn[i] == base[0] ) {
			fn += i;
			break;
		}
		if ( i == 0 )
			return -1;
	}
	printf("%s", fn);
	sscanf( fn, "sigma%d.txt", &num_of_file );

	return num_of_file;
}

int getNum() {
	int n;
	scanf( "%d", &n );
	return n;
}

int main(int argc, char *argv[]) {
	int num;
	Matrix *m;
	for ( int i = 1; i < argc; i++ ) {
		num = findNumber( argv[i] );
		if ( num == -1 )
			FileNameError();

		jacobi( loadMatrix( argv[i] ), num );
		printf( " : finish!\n" );
	}

	if ( argc == 1 ) {
		printf(
			"コマンドライン引数で固有値を求めたい対称行列を入力してください．（複数可）\n"
			"入力：\n"
			"   ファイル名：sigmaxx.txt\n"
			"   中身：n*nの対称行列\n"
			"         x.x x.x x.x ... x.x\n"
			"          :               : \n"
			"         x.x x.x x.x ... x.x\n"
			"出力：\n"
			"   ファイル名：eigenxx.txt\n"
			"   中身：固有値とそれに対応する固有ベクトル（λk > λk+1）\n"
			"         λ1 v1-1 v1-2 ... v1-n\n"
			"         :                  : \n"
			"         λn vn-1 vn-2 ... vn-n\n"
		);
	}

	return 0;
}



/* ---------------------------------
	Jacobi
---------------------------------- */
void jacobi( Matrix *m, int num_of_file ) {
	Matrix *eigen_values = m
	     , *eigen_vectors = generateIdentityMatrix( m->height )
	;
	Coordinate position;
	Trigonometry angle;

	int count = 0
	  , not_change = 0
	;
	double previous = 0;

	while(1) {
		position = locateMaxValue( eigen_values );
		if ( position.value < THRESHOLD )
			break;

		if ( position.value == previous )
			not_change++;
		else
			not_change = 0;

		if ( not_change == 100 )
			break;

		previous = position.value;

		// printf("%d回目 : %lf\n", count++, position.value );

		angle = calcAngle( m, position );
		rotate( eigen_values,  position, angle );
		append( eigen_vectors, position, angle );
		repair( eigen_values );
	}

	printEigen( eigen_values, eigen_vectors, num_of_file );
}

void printEigen( Matrix *eigen_values, Matrix *eigen_vectors, int num_of_file ) {
	char fn[256];

	Matrix *eigen = createMatrix( eigen_vectors->height + 1, eigen_values->height );
	for ( int row = 0; row < eigen->height; row++ ) {
		eigen->a[row][0] = eigen_values->a[row][row];
		for ( int col = 1; col < eigen->width; col++ ) {
			eigen->a[row][col] = eigen_vectors->a[col-1][row];
		}
	}

	sort( eigen );
	sprintf( fn, "eigen%02d.txt", num_of_file );
	printMatrixToFile( fn, eigen );
}

void sort( Matrix *m ) {
	double *tmp;
	for ( int i = 0; i < m->height; i++ ) {
		for ( int j = m->height - 1; j > i; j-- ) {
			if ( m->a[j][0] <= m->a[j-1][0] )
				continue;
			tmp = m->a[j];
			m->a[j] = m->a[j-1];
			m->a[j-1] = tmp;
		}
	}
}

void rotate( Matrix *m, Coordinate position, Trigonometry angle ) {
	double tmp_i, tmp_j
	     , mii = m->a[ position.i ][ position.i ]
	     , mij = m->a[ position.i ][ position.j ]
	     , mjj = m->a[ position.j ][ position.j ]
	     , sin_pow2  = angle.sin * angle.sin
	     , cos_pow2  = angle.cos * angle.cos
	     , sin_x_cos = angle.sin * angle.cos
	;

	// P^-1 * A
	for ( int i = 0; i < m->height; i++ ) {
		tmp_i = m->a[ position.i ][i];
		tmp_j = m->a[ position.j ][i];
		m->a[ position.i ][i] = angle.cos * tmp_i - angle.sin * tmp_j;
		m->a[ position.j ][i] = angle.sin * tmp_i + angle.cos * tmp_j;
	}

	// A * P
	for ( int i = 0; i < m->height; i++ ) {
		m->a[i][ position.i ] = m->a[ position.i ][i];
		m->a[i][ position.j ] = m->a[ position.j ][i];
	}

	// 重複部分
	m->a[ position.i ][ position.i ] = cos_pow2 * mii + sin_pow2 * mjj - 2 * sin_x_cos * mij;
	m->a[ position.j ][ position.j ] = sin_pow2 * mii + cos_pow2 * mjj + 2 * sin_x_cos * mij;

	m->a[ position.i ][ position.j ] = sin_x_cos * ( mii - mjj ) + ( cos_pow2 - sin_pow2 ) * mij;
	m->a[ position.j ][ position.i ] = m->a[ position.i ][ position.j ];
}

void append( Matrix *m, Coordinate position, Trigonometry angle ) {
	double tmp_i, tmp_j
	     , mii = m->a[ position.i ][ position.i ]
	     , mij = m->a[ position.i ][ position.j ]
	     , mjj = m->a[ position.j ][ position.j ]
	;

	for ( int i = 0; i < m->height; i++ ) {
		tmp_i = m->a[i][ position.i ];
		tmp_j = m->a[i][ position.j ];
		m->a[i][ position.i ] = angle.cos * tmp_i - angle.sin * tmp_j;
		m->a[i][ position.j ] = angle.sin * tmp_i + angle.cos * tmp_j;
	}
}

Trigonometry calcAngle( Matrix *m, Coordinate position ) {
	double mii = m->a[ position.i ][ position.i ]
	     , mij = m->a[ position.i ][ position.j ]
	     , mjj = m->a[ position.j ][ position.j ]
	;
	Trigonometry angle;

	double alpha = ( mii - mjj ) / 2
	     , beta  = -mij
	     , gamma = fabs( alpha ) / sqrt( alpha * alpha + beta * beta )
	;

	angle.sin = sqrt( ( 1 - gamma ) / 2 );
	angle.cos = sqrt( ( 1 + gamma ) / 2 );

	if( alpha * beta < 0 )
		angle.sin *= -1;

	return angle;
}

Coordinate locateMaxValue( Matrix *m ) {
	Coordinate position = { 0, 0, -1 };

	for ( int i = 0; i < m->height; i++ ) {
		for ( int j = i+1; j < m->width; j++ ) {
			if ( fabs( m->a[i][j] ) <= position.value )
				continue;
			position.i = i;
			position.j = j;
			position.value = fabs( m->a[i][j] );
		}
	}
	return position;
}

void repair( Matrix *matrix ) {
	for ( int i = 0; i < matrix->height; i++ ) {
		for ( int j = 0; j < i; j++ ) {
			matrix->a[j][i] = matrix->a[i][j];
		}
	}
} 



/* ---------------------------------
	Matrix
---------------------------------- */

Matrix *loadMatrix( const char* fname )
{
	int dim;
	Matrix *m;
	char line[ COL_MAX ]
	   , *ends
	;

	FILE *fp = fopen( fname, "r" );
	if ( fp == NULL )
		FileOpenError( fname );

	if ( fgets( line, COL_MAX, fp ) == NULL )
		MatrixLoadError();
	dim = countSpliter( line, ' ' );

	rewind(fp);
	
	m = createMatrix( dim, dim );
	for ( int i = 0; i < dim; i++ ) {
		if ( fgets( line, COL_MAX, fp ) == NULL )
			MatrixLoadError();

		m->a[i][0] = strtod( strtok( line, " " ), &ends );
		for ( int j = 1; j < dim; j++ ) {
			m->a[i][j] = strtod( strtok( NULL, " " ), &ends );
		}
	}

	fclose( fp );
	return m;
}

int countSpliter( const char* string, const char splitter ) {
	int i, count = 0;
	for ( i = 0; string[i] != '\0'; i++ ) {
		if ( string[i] == splitter )
			count++;
	}

	if ( string[i-1] == '\n' && string[i-2] == splitter )
		return count;

	if ( string[i-1] ==  splitter )
		return count;

	return count + 1;
}

void printMatrix( Matrix *m ) {
	for ( int i = 0; i < m->height; i++ ) {
		for ( int j = 0; j < m->width; j++ ) {
			printf( "%.4f ", m->a[i][j] );
		}
		printf( "\n");
	}
	printf("\n");
}

void printMatrixToFile( const char fn[], Matrix *m ) {
	FILE *fp = fopen( fn, "w" );
	if ( fp == NULL )
		FileOpenError( fn );

	for ( int i = 0; i < m->height; i++ ) {
		for ( int j = 0; j < m->width; j++ ) {
			fprintf( fp, "%.4f ", m->a[i][j] );
		}
		fprintf( fp, "\n");
	}

	fclose( fp );
}

Matrix *generateIdentityMatrix( int dim ) {
	Matrix *m = createMatrix( dim, dim );
	for ( int i = 0; i < dim; i++ ) {
		for ( int j = 0; j < dim; j++ ) {
			if ( i == j ) {
				m->a[i][j] = 1;
				continue;
			}
			m->a[i][j] = 0;
		}
	}
	return m;
}

Matrix *createMatrix( int width, int height )
{
	Matrix *temp;

	if( ( temp = (Matrix*)malloc( sizeof( Matrix ) ) ) == NULL )
		AllocationError();

	if( ( temp->a = (double**)malloc( sizeof(double*) * height ) ) == NULL )
		AllocationError();

	for ( int i = 0; i < height; i++ ) {
		if( ( temp->a[i] = (double*)malloc( sizeof(double) * width ) ) == NULL ) 
			AllocationError();
	}

	temp->width = width;
	temp->height = height;

	return temp;
}

void freeMatrix( Matrix* matrix )
{
	free( matrix->a );
	free( matrix );
}