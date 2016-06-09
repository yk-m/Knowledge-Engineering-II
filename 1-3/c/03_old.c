#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>



#define COL_MAX 8192
#define THRESHOLD 1e-5



typedef struct {
	int size;
	double *v;
} Vector;

typedef struct {
	int height;
	int width;
	double **a;
} Matrix;

typedef struct {
	int x;
	int y;
	double value;
} Coordinate;



/* ---------------------------------
	Jacobi
---------------------------------- */
void jacobi( Matrix *m, int num_of_file );
Matrix *rotate( Matrix *m, Coordinate position, double theta );
Matrix *append( Matrix *m, Coordinate position, double theta );
Matrix *makeGivens( int dim, Coordinate position, double theta, int inverse );
double calcAngle( Matrix *m, Coordinate position );
Coordinate locateMaxValue( Matrix *m );
void repair( Matrix *matrix );



/* ---------------------------------
	Matrix & Vector
---------------------------------- */
Matrix *loadMatrix( const char* fname );
int countSpliter( const char* string, const char splitter );
void printMatrix( Matrix *m );
void printMatrixToFile( const char fn[], Matrix *m );

Matrix *multiply( Matrix *a, Matrix *b );
Matrix *generateIdentityMatrix( int dim );

Vector *createVector( int size );
void freeVector( Vector* vector );
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
	printf("%s\n", fn);
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
	}

	return 0;
}



/* ---------------------------------
	Jacobi
---------------------------------- */
void jacobi( Matrix *m, int num_of_file ) {
	Matrix *eigen_values = m
	     , *eigen_vectors = generateIdentityMatrix( m->height )
	     , old
	;
	Coordinate position;
	char fname[256];
	double theta;
	int count = 0;

	while(1) {
		position = locateMaxValue( eigen_values );
		if ( position.value < THRESHOLD )
			break;

		printf("%d回目 : %lf\n", count++, position.value );

		theta = calcAngle( m, position );
		eigen_values  = rotate( eigen_values,  position, theta );
		eigen_vectors = append( eigen_vectors, position, theta );
		repair( eigen_values );
	}

	sprintf( fname, "EigenValues%02d.txt", num_of_file );
	printMatrixToFile( fname, eigen_values  );
	sprintf( fname, "EigenVectors%02d.txt", num_of_file );
	printMatrixToFile( fname, eigen_vectors );
}

Matrix *rotate( Matrix *m, Coordinate position, double theta ) {
	Matrix *givens = makeGivens( m->height, position, theta, 1 )
	     , *product
	;

	product = multiply( givens, m );
	inverseGivens( givens, position );
	product = multiply( product, givens )

	freeMatrix( givens );
	return product;
}

Matrix *append( Matrix *m, Coordinate position, double theta ) {
	Matrix *givens  = makeGivens( m->height, position, theta, 0 )
	     , *product = multiply( m, givens )
	;

	freeMatrix( givens );
	return product;
}

Matrix *makeGivens( int dim, Coordinate position, double theta, int inverse ) {
	Matrix *givens = generateIdentityMatrix( dim );
	double sin_theta = sin( theta )
	     , cos_theta = cos( theta )
	;

	givens->a[ position.y ][ position.y ] = cos_theta;
	givens->a[ position.y ][ position.x ] = (inverse ? -1: 1 ) * sin_theta;
	givens->a[ position.x ][ position.x ] = cos_theta;
	givens->a[ position.x ][ position.y ] = (inverse ? 1: -1 ) * sin_theta;

	return givens;
}

void inverseGivens( Matrix *m, Coordinate position ) {
	givens->a[ position.y ][ position.x ] *= -1;
	givens->a[ position.x ][ position.y ] *= -1;
}

double calcAngle( Matrix *m, Coordinate position ) {
	double mii = m->a[ position.y ][ position.y ]
	     , mij = m->a[ position.y ][ position.x ]
	     , mjj = m->a[ position.x ][ position.x ]
	;

	return 0.5 * atan2( 2 * mij, mjj - mii );
}

Coordinate locateMaxValue( Matrix *m ) {
	Coordinate position = { 0, 0, -1 };

	for ( int i = 0; i < m->height; i++ ) {
		for ( int j = i+1; j < m->width; j++ ) {
			if ( fabs( m->a[i][j] ) <= position.value )
				continue;
			position.y = i;
			position.x = j;
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
	Matrix & Vector 
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

Matrix *multiply( Matrix *a, Matrix *b ) {
	Matrix *product = createMatrix( a->height, b->width );

	if ( a->width != b->height ) {
		printf("計算出来ない行列の組みわせです．\n");
		exit(1);
	}

	for ( int row = 0; row < a->height; row++ ) {
		for ( int col = 0; col < b->width; col++ ) {
			product->a[ row ][ col ] = 0;
			for ( int k = 0; k < a->width; k++ ) {
				product->a[ row ][ col ] += a->a[ row ][ k ] * b->a[ k ][ col ];
			}
		}
	}

	return product;
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

Vector *createVector( int size )
{
	Vector *temp;

	if( ( temp = (Vector*)malloc( sizeof( Vector ) ) ) == NULL )
		AllocationError();

	if( ( temp->v = (double*)malloc( sizeof( double ) * size ) ) == NULL )
		AllocationError();

	temp->size = size;

	return temp;
}

void freeVector( Vector* vector )
{
	free( vector->v );
	free( vector );
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