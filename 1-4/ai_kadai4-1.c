#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define COL_MAX 8192
#define SAMPLE 20
#define DIM 196
#define b 100


typedef struct {
	double eigen_value;
	double *eigen_vector;
} EIGEN;



/* ---------------------------------
	Mahalanobis
---------------------------------- */
void calc_Mahalanobis( EIGEN **m, double mean[], double recognize[][DIM], double distance[], int num );
void SubtractAverage( double recognize[][DIM], double mean[] );
double InnerProduct( double recognize[], double m[] );
int compare( double distance[] );

/* ---------------------------------
	load and print
---------------------------------- */
void loadMean( const char fname[], double mean[] );
void loadRecognizedData( const char fname[], double recognize[][DIM] );

/* ---------------------------------
	EIGEN
---------------------------------- */
EIGEN **loadEIGEN( const char* fname );
int countSpliter( const char* string, const char splitter );
EIGEN *createEIGEN( int dim );




int main(){

	int i, j, num;
	char filename[1024];
	double mean[DIM];
	double recognize[20][DIM];
	double distance[46];
	int filenum=0;

	printf("認識したい文字の特徴量データファイルを１つ入力してください\n");
	scanf( "%s", filename );	
	loadRecognizedData( filename, recognize );

	printf("あ〜ん:1〜46\n");

	for( j = 0; j < 46; j++ ){
		sprintf( filename, "Mean/mean%02d.txt", j+1 );
		loadMean( filename, mean );

		sprintf( filename, "Eigen/Eigen%02d.txt", j+1 );
		calc_Mahalanobis( loadEIGEN( filename ), mean, recognize, distance, j );

	}
	filenum = compare( distance );
	printf("これは%dの文字です\n", filenum);

	//printf("this is %c\n", '');
}


/* ---------------------------------
	Mahalanobis
---------------------------------- */

void calc_Mahalanobis( EIGEN **m, double mean[], double recognize[][DIM], double distance[], int num ){

	double a;
	SubtractAverage( recognize, mean );

	for( int i = 0; i < SAMPLE; i++ ){

		distance[i] = 0.0;
		for( int j = 0; j < DIM; j++ ){

			// if( m[j]->eigen_value > b ){
			// 	a = m[i]->eigen_value;
			// } else {
			// 	a = b;
			// }
			distance[i] += pow( 2, InnerProduct( recognize[i], m[j]->eigen_vector ) ) / m[j]->eigen_value;
		}
		printf("ファイルの%dサンプル目と%dの距離:%.4lf\n", i, num, distance[i] );

	}

	//return distance;
	//distance[filenum] = temp1[i] + temp2[i];
}

void SubtractAverage( double recognize[][DIM], double mean[] ){

	for( int i = 0; i < SAMPLE; i++ ){
		for( int j = 0; j < DIM; j++ ){
			recognize[i][j] -= mean[j];
		}
	}
}

double InnerProduct( double recognize[], double m[] ){

	double answer = 0.0;

	for( int k = 0; k < DIM; k++ ){
		answer += recognize[k] * m[k];
	}
	return answer;
}

int compare( double distance[] ){

	int i, num;
	double shortest_dis=-1;

	for( i = 0; i < 46; i++ ){
		if( shortest_dis < distance[i] ){
			shortest_dis = distance[i];
			num = i;
		}
	}
	return i;
}



/* ---------------------------------
	load and print
---------------------------------- */

void loadMean( const char fname[], double *mean ){

	int i;

	FILE *fp = fopen( fname, "r" );
	if ( fp == NULL ){
		printf("can't open %s\n", fname);
		exit(1);
	}
	for( i = 0; i < DIM; i++ ){
		fscanf(fp, "%lf", &mean[i]);
	}
	fclose( fp );

}

void loadRecognizedData( const char fname[], double recognize[][DIM] ){

	int i,j;

	FILE *fp = fopen( fname, "r" );
	if ( fp == NULL ){
		printf("can't open %s\n", fname);
		exit(1);
	}
	for( i = 0; i < SAMPLE; i++ ){
		for ( j = 0; j < DIM; j++ ){
			fscanf(fp, "%lf", &recognize[i][j]);
		}
	}
	fclose( fp );

}

/* ---------------------------------
	EIGEN
---------------------------------- */

EIGEN **loadEIGEN( const char* fname )
{
	int i, j, dim;
	EIGEN **m;
	char line[ COL_MAX ];
	char *ends;

	FILE *fp = fopen( fname, "r" );
	if ( fp == NULL ){
		printf("can't open %s\n", fname);
		exit(1);
	}

	if ( fgets( line, COL_MAX, fp ) == NULL ){
		printf("行列のロードに失敗しました．\n" );
		exit(1);
	}
	dim = countSpliter( line, ' ' ) - 1;//196

	rewind(fp);
	
	if( ( m = (EIGEN**)malloc( sizeof( EIGEN* ) * dim ) ) == NULL ){
		printf( "Allocation Error\n" );
		exit(1);
	}

	for( i = 0; i < dim; i++ ){
		m[i] = createEIGEN( dim );
	}

	for(i = 0; i < dim; i++){
		m[i]->eigen_value = 0.0;
	}
	for ( i = 0; i < dim; i++ ) {
		if ( fgets( line, COL_MAX, fp ) == NULL ){
			printf("行列のロードに失敗しました．\n" );
			exit(1);
		}
		m[i]->eigen_value = strtod( strtok( line, " " ), &ends );
		for ( j = 1; j < dim; j++ ) {
			m[i]->eigen_vector[j] = strtod( strtok( NULL, " " ), &ends );
		}
	}
	

	fclose( fp );
	return m;
}

int countSpliter( const char* string, const char splitter ) {
	
	int i, count = 0;
	for ( i = 0; string[i] != '\0'; i++ ) {
		if ( string[i] == splitter ){
			count++;
		}
	}

	if ( string[i-1] == '\n' && string[i-2] == splitter )
		return count;

	if ( string[i-1] ==  splitter )
		return count;

	return count + 1;//197
}

EIGEN *createEIGEN( int dim )
{
	int i;
	EIGEN *temp;

	if( ( temp = (EIGEN*)malloc( sizeof( EIGEN ) ) ) == NULL ){
		printf( "Allocation Error\n" );
		exit(1);
	}

	if( ( temp->eigen_vector = (double*)malloc( sizeof(double) * dim ) ) == NULL ){
		printf( "Allocation Error\n" );
		exit(1);
	}

	return temp;
}
